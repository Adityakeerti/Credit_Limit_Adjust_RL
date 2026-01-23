import numpy as np
import math
from .data_pipeline import DataPipeline

class CreditLimitEnv:
    def __init__(self, cox_model):
        self.cox_model = cox_model
        self.pipeline = DataPipeline()
        self.action_space_n = 10
        self.action_multipliers = [1.00, 1.04, 1.09, 1.13, 1.17, 1.22, 1.26, 1.30, 1.35, 1.40]
        self.max_limit = 20000.0
        
        self.reset()

    def reset(self):
        self.t = 0
        self.user_id = f"sim_{np.random.randint(10000)}"
        self.current_limit = 5000.0
        self.balance = np.random.uniform(0, 1000)
        self.prev_balance = self.balance
        self.utils_history = []
        self.cumulative_pd = 0.0
        
        # User Type (Hidden State)
        self.user_type = np.random.choice(['good', 'risky'], p=[0.7, 0.3])
        
        return self._get_state()

    def step(self, action_idx):
        # 1. Apply Action
        multiplier = self.action_multipliers[action_idx]
        self.current_limit = min(self.current_limit * multiplier, self.max_limit)
        
        # 2. Simulate User Behavior (Environment Dynamics)
        spend = np.random.normal(1000, 400) if self.user_type == 'good' else np.random.normal(1500, 600)
        spend = max(0, spend)
        
        # Buying behavior constrained by limit
        spend = min(spend, self.current_limit - self.balance)
        spend = max(0, spend)
        
        target_pay = self.balance + spend
        if self.user_type == 'good':
            payment = target_pay * np.random.uniform(0.95, 1.0)
        else:
            payment = target_pay * np.random.uniform(0.0, 0.6)
            
        self.prev_balance = self.balance
        self.balance = self.prev_balance + spend - payment
        self.balance = max(0, self.balance)
        
        # 3. Calculate Features for Cox
        row = self.pipeline.process_monthly_statement(
            self.user_id, self.t, self.balance, self.current_limit, payment, self.prev_balance
        )
        row['dpd_status'] = 1 if payment < (self.prev_balance * 0.05) else 0
        
        # Update history for trend
        util = row['utilization']
        self.utils_history.append(util)
        if len(self.utils_history) >= 3:
            row['utilization_avg_3m'] = np.mean(self.utils_history[-3:])
        else:
            row['utilization_avg_3m'] = util
            
        # Get Hazard Rate (PD) from Cox
        # Note: In real training, we pre-calculate hazards or train Cox first. 
        # Here we assume Cox is trained or we use a heuristic if not.
        try:
            # Create DataFrame for prediction
            import pandas as pd
            df = pd.DataFrame([row])
            pd_t = self.cox_model.predict_hazard(df).iloc[0]
        except:
            # Fallback if model not trained
            pd_t = 0.02 if self.user_type == 'good' else 0.15
            
        self.cumulative_pd += pd_t
        
        # 4. Calculate Reward (Section 3.3)
        # Revenue = CL * UR * (1 - PD) * APR
        # Loss = CL * UR * PD * (1 - RR)
        apr = 0.18 / 12 # Monthly
        rr = max(0, 1 - math.log(self.current_limit + 1) / 20.0) # Equation 8
        
        cl = self.current_limit
        ur = util
        
        revenue = cl * ur * (1 - pd_t) * apr
        loss = cl * ur * pd_t * (1 - rr)
        
        raw_reward = revenue - loss
        reward = math.tanh(raw_reward / 2000.0)
        
        # 5. Next State
        self.t += 1
        done = self.t >= 24 or getattr(self, 'defaulted', False) 
        
        # Check default condition
        if self.balance > self.current_limit * 1.5: # Overlimit default
            self.defaulted = True
            reward = -1.0 # Heavy penalty
            done = True
            
        util_trend = self.pipeline.calculate_trend_3m(self.utils_history[-3:] if len(self.utils_history) >= 3 else self.utils_history)
        
        next_state = [
            pd_t,
            util,
            util_trend,
            self.current_limit / self.max_limit,
            self.cumulative_pd
        ]
        
        return np.array(next_state, dtype=np.float32), reward, done, {}

    def _get_state(self):
        # Initial state (t=0)
        # Using heuristic PD for start
        pd_t = 0.02
        util = self.balance / self.current_limit if self.current_limit > 0 else 0
        
        return np.array([
            pd_t,
            util,
            0.0, # Trend 0 initially
            self.current_limit / self.max_limit,
            self.cumulative_pd
        ], dtype=np.float32)
