import joblib
import pandas as pd
import numpy as np

def test_inference():
    print("Loading model and scaler...")
    try:
        knn = joblib.load('knn_model.pkl')
        scaler = joblib.load('scaler.pkl')
    except Exception as e:
        print(f"Error loading files: {e}")
        print("Make sure you have run knn_model.py first!")
        return

    # Define test cases based on real data values
    # Features: [avg_repayment_days, transaction_frequency, avg_spend]
    
    # Case 1: Frequent Payer (Aishani Sankaran-like)
    # Mean for frequent is ~3.94 days
    sample_frequent = [3.9, 0.4, 7000]

    # Case 2: Good Payer (Aadhya Bora-like)
    # Mean for good is ~18 days
    sample_good = [18.0, 0.3, 8000]

    # Case 3: Late Payer (Advika Halder-like)
    # Mean for late is ~37.16 days
    sample_late = [35.0, 0.2, 7300]

    samples = [sample_frequent, sample_good, sample_late]
    sample_names = ["Frequent Payer Profile", "Good Payer Profile", "Late Payer Profile"]
    
    # Feature names must match training
    feature_names = ['avg_repayment_days', 'transaction_frequency', 'avg_spend']
    
    print("\nRunning predictions...")
    
    # Preprocess
    # Create DataFrame to preserve column names for scaler
    X_new_df = pd.DataFrame(samples, columns=feature_names)
    X_scaled = scaler.transform(X_new_df)
    
    predictions = knn.predict(X_scaled)
    probs = knn.predict_proba(X_scaled)
    
    class_map = {1: 'Good Payer', 2: 'Late Payer', 3: 'Frequent Payer'}
    
    for i, pred_id in enumerate(predictions):
        label = class_map.get(pred_id, "Unknown")
        print(f"\nInput ({sample_names[i]}): {samples[i]}")
        print(f"Predicted Class: {label}")
        print(f"Confidence: {max(probs[i])*100:.2f}%")
        print(f"Probs [Good, Late, Freq]: {probs[i]}")

if __name__ == "__main__":
    test_inference()
