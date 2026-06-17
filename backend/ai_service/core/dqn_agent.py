import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
import numpy as np
import random
from collections import deque

# 3.2 Action Space (Section 3.4, Equation 12)
ACTION_MULTIPLIERS = [1.00, 1.04, 1.09, 1.13, 1.17, 1.22, 1.26, 1.30, 1.35, 1.40]

# 3.4 Double DQN Architecture (Section 3.5)
class DuelingDQN(nn.Module):
    def __init__(self, state_dim=5, action_dim=10):
        super(DuelingDQN, self).__init__()
        # Shared layers
        self.fc1 = nn.Linear(state_dim, 128)
        self.fc2 = nn.Linear(128, 128)
        
        # Dueling heads
        self.value_head = nn.Linear(128, 1)           # V(s)
        self.advantage_head = nn.Linear(128, action_dim)  # A(s,a)
    
    def forward(self, x):
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        
        value = self.value_head(x)
        advantage = self.advantage_head(x)
        
        # Equation 13 from paper
        q_values = value + (advantage - advantage.mean(dim=1, keepdim=True))
        return q_values

class DoubleDQNAgent:
    def __init__(self, state_dim=5, action_dim=10):
        self.state_dim = state_dim
        self.action_dim = action_dim
        
        # Hyperparameters (Section 3.6 & 3.7)
        self.batch_size = 64
        self.gamma = 0.99
        self.epsilon = 1.0
        self.epsilon_end = 0.05
        self.epsilon_decay = 0.995
        self.tau = 0.005
        self.lr = 3e-4
        
        # Networks
        self.policy_net = DuelingDQN(state_dim, action_dim)
        self.target_net = DuelingDQN(state_dim, action_dim)
        self.target_net.load_state_dict(self.policy_net.state_dict())
        self.target_net.eval()
        
        # Optimizer & Scheduler (Equation 14: StepLR with gamma=0.8 every 100 steps)
        self.optimizer = optim.Adam(self.policy_net.parameters(), lr=self.lr)
        self.scheduler = optim.lr_scheduler.StepLR(self.optimizer, step_size=100, gamma=0.8)
        
        # Replay Buffer
        self.memory = deque(maxlen=100000)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.policy_net.to(self.device)
        self.target_net.to(self.device)

    def select_action(self, state, training=True):
        if training and random.random() < self.epsilon:
            return random.randrange(self.action_dim)
        
        with torch.no_grad():
            state = torch.FloatTensor(state).unsqueeze(0).to(self.device)
            q_values = self.policy_net(state)
            return q_values.argmax().item()

    def store_transition(self, state, action, reward, next_state, done):
        self.memory.append((state, action, reward, next_state, done))

    def update(self):
        if len(self.memory) < self.batch_size:
            return None
        
        transitions = random.sample(self.memory, self.batch_size)
        state_batch, action_batch, reward_batch, next_state_batch, done_batch = zip(*transitions)
        
        state_batch = torch.FloatTensor(np.array(state_batch)).to(self.device)
        action_batch = torch.LongTensor(action_batch).unsqueeze(1).to(self.device)
        reward_batch = torch.FloatTensor(reward_batch).unsqueeze(1).to(self.device)
        next_state_batch = torch.FloatTensor(np.array(next_state_batch)).to(self.device)
        done_batch = torch.FloatTensor(done_batch).unsqueeze(1).to(self.device)
        
        # 3.5 Double Q-Learning Update
        # 1. Select best action using policy network
        with torch.no_grad():
            best_actions = self.policy_net(next_state_batch).argmax(dim=1, keepdim=True)
            # 2. Evaluate using target network
            target_q_values = self.target_net(next_state_batch).gather(1, best_actions)
            # 3. Bellman target
            expected_q_values = reward_batch + (self.gamma * target_q_values * (1 - done_batch))

        # 4. Current Q-values
        current_q_values = self.policy_net(state_batch).gather(1, action_batch)
        
        # 5. Loss (Equation 16 - Smooth L1)
        loss = F.smooth_l1_loss(current_q_values, expected_q_values)
        
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()
        self.scheduler.step()
        
        # Update epsilon
        self.epsilon = max(self.epsilon_end, self.epsilon * self.epsilon_decay)
        
        # Soft update target network
        self.soft_update()
        
        return loss.item()

    def soft_update(self):
        # θ_target ← (1 - τ) * θ_target + τ * θ_policy (Equation 15)
        for target_param, policy_param in zip(self.target_net.parameters(), self.policy_net.parameters()):
            target_param.data.copy_(self.tau * policy_param.data + (1.0 - self.tau) * target_param.data)

    def save(self, path):
        torch.save(self.policy_net.state_dict(), path)

    def load(self, path):
        checkpoint = torch.load(path, map_location=self.device)
        # Handle both plain state_dict and full checkpoint dict formats
        if isinstance(checkpoint, dict) and "policy_net_state_dict" in checkpoint:
            state_dict = checkpoint["policy_net_state_dict"]
        else:
            state_dict = checkpoint
        self.policy_net.load_state_dict(state_dict)
        self.target_net.load_state_dict(self.policy_net.state_dict())
        self.policy_net.eval()
