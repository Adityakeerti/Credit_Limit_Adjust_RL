import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import joblib
import matplotlib.pyplot as plt
import seaborn as sns

def train_and_save_model(input_file, model_path, scaler_path):
    print("Loading labeled data...")
    try:
        df = pd.read_csv(input_file)
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    # Features and Target
    # We use the metrics we calculated as features
    # Note: 'avg_repayment_days' is heavily correlated because it defined the label, 
    # but a model needs these inputs to make the classification.
    # We also include 'avg_spend' and 'transaction_frequency' as they characterize the user.
    
    X = df[['avg_repayment_days', 'transaction_frequency', 'avg_spend']]
    y = df['label_id'] # 1=Good, 2=Late, 3=Frequent

    # Split Data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # Scailing
    print("Scaling features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # KNN Model
    print("Training KNN model...")
    # Using k=1 to ensure we match specific minority class behaviors without being drowned out
    k = 1 
    knn = KNeighborsClassifier(n_neighbors=k)
    knn.fit(X_train_scaled, y_train)

    # Evaluation
    y_pred = knn.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, target_names=['Good Payer', 'Late Payer', 'Frequent Payer']) # zero_division parameter might be needed if k is small and some classes missing in test
    
    # Save results to text file
    results_path = 'model_results.txt'
    with open(results_path, 'w') as f:
        f.write(f"Model Accuracy: {acc:.4f}\n\n")
        f.write("Classification Report:\n")
        f.write(report)
        f.write("\nConfusion Matrix:\n")
        f.write(str(confusion_matrix(y_test, y_pred)))
    
    print(f"\nModel Accuracy: {acc:.4f}")
    print("\nClassification Report:")
    print(report)
    
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    print(f"\nResults saved to {results_path}")

    # Plot Confusion Matrix
    print("Generating confusion matrix chart...")
    plt.figure(figsize=(8, 6))
    cm = confusion_matrix(y_test, y_pred)
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=['Good Payer', 'Late Payer', 'Frequent Payer'],
                yticklabels=['Good Payer', 'Late Payer', 'Frequent Payer'])
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.title('KNN Classification Confusion Matrix')
    plt.savefig('confusion_matrix.png')
    print("Chart saved to confusion_matrix.png")

    # Save Model and Scaler
    print(f"\nSaving model to {model_path}...")
    joblib.dump(knn, model_path)
    joblib.dump(scaler, scaler_path)
    print("Done.")

if __name__ == "__main__":
    train_and_save_model('labeled_data.csv', 'knn_model.pkl', 'scaler.pkl')
