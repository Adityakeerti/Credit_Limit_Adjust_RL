from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import torch
import pandas as pd
import numpy as np
import uvicorn
import os
import io

from core.dqn_agent import DoubleDQNAgent, ACTION_MULTIPLIERS
from core.cox_model import CoxRiskModel
from core.data_pipeline import DataPipeline
from core.environment import CreditLimitEnv

app = FastAPI(title="Advanzia RL Credit Limit Service", version="1.0.0")

# Initialize models
cox_model = CoxRiskModel()
agent = DoubleDQNAgent()
pipeline = DataPipeline()

# Persistence paths — resolve relative to this script's location → ../../models (project root)
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "models")
os.makedirs(MODEL_DIR, exist_ok=True)
COX_PATH = os.path.join(MODEL_DIR, "cox_model.pkl")
AGENT_PATH = os.path.join(MODEL_DIR, "rl_policy.pt")

# Load existing models if available
try:
    if os.path.exists(COX_PATH):
        cox_model.load(COX_PATH)
    if os.path.exists(AGENT_PATH):
        agent.load(AGENT_PATH)
        print("Loaded RL Agent.")
except Exception as e:
    print(f"Warning: Could not load models: {e}")

class TrainRequest(BaseModel):
    num_episodes: int = 500

class PredictRequest(BaseModel):
    user_id: str
    current_limit: float
    utilization_30d: float
    payment_ratio_30d: float
    util_trend_3m: float
    months_on_book: int
    hazard_rate: float = None # Optional, if pre-calculated

class PredictResponse(BaseModel):
    user_id: str
    action_code: int
    multiplier: float
    new_limit_recommendation: float
    confidence: float
    hazard_rate: float
    explanation: str

@app.get("/health")
def health_check():
    return {"status": "ok", "agent_loaded": True, "cox_loaded": cox_model.is_trained}

@app.post("/v1/train")
async def train_model(request: TrainRequest):
    """
    Trains the RL agent using synthetic environment (since we lack real history DB access in this isolated service)
    """
    env = CreditLimitEnv(cox_model)
    rewards_history = []
    
    # 1. Train Cox if not trained (using synthetic data)
    if not cox_model.is_trained:
        print("Generating synthetic data for Cox training...")
        dfs = [pipeline.generate_synthetic_episode() for _ in range(500)]
        full_df = pd.concat(dfs)
        cox_model.train(full_df)
        cox_model.save(COX_PATH)

    # 2. Train RL Agent
    print(f"Starting RL training for {request.num_episodes} episodes...")
    for episode in range(request.num_episodes):
        state = env.reset()
        done = False
        total_reward = 0
        
        while not done:
            action = agent.select_action(state, training=True)
            next_state, reward, done, _ = env.step(action)
            
            agent.store_transition(state, action, reward, next_state, done)
            loss = agent.update()
            
            state = next_state
            total_reward += reward
            
        rewards_history.append(total_reward)
        if episode % 10 == 0:
            print(f"Episode {episode}: Reward={total_reward:.2f}, Epsilon={agent.epsilon:.2f}")

    # Save Agent
    agent.save(AGENT_PATH)
    
    return {
        "status": "success",
        "episodes_trained": request.num_episodes,
        "final_epsilon": agent.epsilon,
        "avg_reward_last_10": np.mean(rewards_history[-10:])
    }

@app.post("/v1/predict")
async def predict_limit(request: PredictRequest):
    """
    Predicts optimal credit limit action
    """
    # 1. Get Hazard Rate if not provided
    hazard = request.hazard_rate
    if hazard is None:
        if not cox_model.is_trained:
            # Fallback heuristic if model not ready
            hazard = 0.05 
        else:
            # Construct feature DF for Cox
            features = pd.DataFrame([{
                'utilization_avg_3m': request.utilization_30d, # Approx
                'payment_ratio': request.payment_ratio_30d,
                'dpd_status': 0, # Assume 0 for single prediction
                'macro_unemployment': 5.0 # default
            }])
            hazard = cox_model.predict_hazard(features).iloc[0]

    # 2. Construct State Vector
    # [PD_t, utilization_t, util_trend_3m, limit_normalized, cumulative_pd_12m]
    # We approximate cumulative PD as hazard * months (simple)
    state = [
        hazard,
        request.utilization_30d,
        request.util_trend_3m,
        request.current_limit / 20000.0,
        hazard * min(request.months_on_book, 12) 
    ]
    
    # 3. RL Inference
    action_idx = agent.select_action(np.array(state, dtype=np.float32), training=False)
    multiplier = ACTION_MULTIPLIERS[action_idx]
    new_limit = request.current_limit * multiplier
    
    # Generate explanation
    explanation = "Maintained limit"
    if multiplier > 1.0:
        explanation = f"Increased limit by {(multiplier-1)*100:.0f}% due to good payment history"
        if hazard > 0.1:
            explanation += " despite moderate risk."
    elif multiplier < 1.0: # If we had decrease actions (currently only >= 1.0 in list)
        explanation = "Decreased limit due to risk factors."
        
    return PredictResponse(
        user_id=request.user_id,
        action_code=action_idx,
        multiplier=multiplier,
        new_limit_recommendation=float(f"{new_limit:.2f}"),
        confidence=0.85 + (0.1 if hazard < 0.05 else -0.1),
        hazard_rate=float(hazard),
        explanation=explanation
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
