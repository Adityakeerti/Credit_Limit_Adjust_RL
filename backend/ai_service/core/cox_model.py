from lifelines import CoxPHFitter
import pandas as pd
import numpy as np
import pickle
import os

class CoxRiskModel:
    def __init__(self):
        self.cph = CoxPHFitter()
        self.is_trained = False

    def train(self, df):
        """
        Trains the Cox Proportional Hazards model
        df must contain: 't_stop' (duration), 'event_default' (event),
        and features: 'utilization_avg_3m', 'payment_ratio', 'dpd_status', 'macro_unemployment'
        """
        print("Training Cox Model...")
        # Check required columns
        required = ['t_stop', 'event_default', 'utilization_avg_3m', 'payment_ratio', 'dpd_status', 'macro_unemployment']
        if not all(col in df.columns for col in required):
            raise ValueError(f"Dataframe missing required columns: {required}")

        self.cph.fit(
            df=df,
            duration_col='t_stop',
            event_col='event_default',
            formula='utilization_avg_3m + payment_ratio + dpd_status + macro_unemployment'
        )
        self.is_trained = True
        print("Cox Model training complete.")
        self.cph.print_summary()

    def predict_hazard(self, features_df):
        """
        Predicts the partial hazard (relative risk) h(t)/h0(t)
        Returns a scalar hazard rate for the user
        """
        if not self.is_trained:
            raise ValueError("Model not trained yet.")
        
        # In real implementation with time-varying covariates, we might want baseline hazard integration
        # But for RL state input, the partial hazard or estimated probability is sufficient
        # predict_partial_hazard gives exp(beta * X) which relates to relative risk
        return self.cph.predict_partial_hazard(features_df)

    def save(self, path):
        with open(path, 'wb') as f:
            pickle.dump(self.cph, f)
    
    def load(self, path):
        if os.path.exists(path):
            with open(path, 'rb') as f:
                self.cph = pickle.load(f)
            self.is_trained = True
            print(f"Loaded Cox model from {path}")
        else:
            print(f"No model found at {path}")
