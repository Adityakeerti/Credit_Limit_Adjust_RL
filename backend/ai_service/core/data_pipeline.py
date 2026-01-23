import pandas as pd
import numpy as np

class DataPipeline:
    def __init__(self):
        pass

    def calculate_macro_unemployment(self, t):
        """
        Simulates macro unemployment trend
        macro_unemployment_t = base + amplitude * sin(2π * t / 60) + N(0, 0.1)
        """
        base = 5.0
        amplitude = 2.0
        noise = np.random.normal(0, 0.1)
        return base + amplitude * np.sin(2 * np.pi * t / 60) + noise

    def calculate_utilization(self, balance, limit):
        # utilization_t = min(balance_eom_t / current_limit_t, 1.5)
        if limit == 0: return 0
        return min(balance / limit, 1.5)

    def calculate_payment_ratio(self, repayment, statement_balance):
        # payment_ratio_t = total_repayments_t / statement_balance_{t-1}
        if statement_balance <= 0: return 1.0 # Fully paid or no balance
        return min(repayment / statement_balance, 10.0) # Cap at 10x

    def calculate_trend_3m(self, utils):
        """
        Trend_3M = Σ(i=0 to 2) [(x_i - x̄)(UR_{t-2+i} - ŪR)] / Σ(i=0 to 2) (x_i - x̄)²
        Here utils is a list/array of 3 utilization values [t-2, t-1, t]
        x = [0, 1, 2], x̄ = 1
        """
        if len(utils) < 3:
            return 0.0
        
        y = np.array(utils[-3:])
        x = np.array([0, 1, 2])
        x_bar = 1
        y_bar = np.mean(y)
        
        numerator = np.sum((x - x_bar) * (y - y_bar))
        denominator = np.sum((x - x_bar) ** 2)
        
        if denominator == 0:
            return 0.0
        return numerator / denominator

    def process_monthly_statement(self, user_id, month_idx, balance, limit, repayment, prev_balance):
        """
        Generates a single row for model input from raw values
        """
        util = self.calculate_utilization(balance, limit)
        pay_ratio = self.calculate_payment_ratio(repayment, prev_balance)
        macro = self.calculate_macro_unemployment(month_idx)
        
        return {
            "user_id": user_id,
            "t_start": month_idx,
            "t_stop": month_idx + 1,
            "utilization": util,
            "payment_ratio": pay_ratio,
            "macro_unemployment": macro,
            "current_limit": limit,
            "balance_eom": balance
        }

    def generate_synthetic_episode(self, episode_length=24):
        """
        Generates synthetic user behavior for training
        """
        data = []
        user_id = f"syn_{np.random.randint(1000,9999)}"
        limit = 5000.0
        balance = np.random.uniform(0, 2000)
        
        utils_history = []
        
        for t in range(episode_length):
            # Simulate generic behavior
            spend = np.random.normal(1000, 300)
            spend = max(0, spend)
            
            # Payment behavior dependent on type (Good, Late, Freuqent)
            # Randomly assign type for this episode
            u_type = np.random.choice(['good', 'risky'], p=[0.8, 0.2])
            
            target_pay = balance + spend
            if u_type == 'good':
                payment = target_pay * np.random.uniform(0.9, 1.0)
            else:
                payment = target_pay * np.random.uniform(0.0, 0.5)
            
            # Update balance
            prev_balance = balance
            balance = prev_balance + spend - payment
            balance = max(0, balance) # Floor at 0
            
            # Default event logic (if balance > limit * 1.5, simple heuristic for synthetic data)
            default = 1 if balance > limit * 1.5 else 0
            
            row = self.process_monthly_statement(user_id, t, balance, limit, payment, prev_balance)
            row['event_default'] = default
            
            # DPD proxy (if payment < min due)
            row['dpd_status'] = 1 if payment < (prev_balance * 0.05) else 0
            
            # 3M Avg Util
            utils_history.append(row['utilization'])
            if len(utils_history) >= 3:
                row['utilization_avg_3m'] = np.mean(utils_history[-3:])
                row['util_trend_3m'] = self.calculate_trend_3m(utils_history[-3:])
            else:
                row['utilization_avg_3m'] = row['utilization']
                row['util_trend_3m'] = 0.0
                
            data.append(row)
            
            if default:
                break
                
        return pd.DataFrame(data)
