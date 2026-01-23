import pandas as pd
import numpy as np
from datetime import timedelta

def clean_currency(x):
    if isinstance(x, str):
        return float(x.replace('₹', '').replace(',', '').strip())
    return x

def process_data(input_file, output_file):
    print("Loading data...")
    try:
        df = pd.read_csv(input_file, encoding='utf-16', sep='\t')
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    # Clean columns
    currency_cols = ['monthly income', 'account limit', 'transaction amount', 'amount left']
    for col in currency_cols:
        if col in df.columns:
            df[col] = df[col].apply(clean_currency)

    # Date and Time
    df['datetime'] = pd.to_datetime(df['date of transaction'] + ' ' + df['time of transaction'])
    df = df.sort_values(by=['name', 'datetime'])

    user_stats = []

    grouped = df.groupby('name')
    
    print("Processing users...")
    for name, group in grouped:
        group = group.sort_values('datetime')
        
        # Calculate Repayment Delays
        # Logic: For every Debit, calculate distinct days until the next Credit
        
        debits = group[group['type'] == 'Debit']
        credits = group[group['type'] == 'Credit']
        
        if debits.empty or credits.empty:
            continue
            
        delays = []
        
        # Simplified algorithm: 
        # For each debit, find the first credit that occurs AFTER it.
        # This is a basic approximation of "repayment time".
        
        credit_dates = credits['datetime'].values
        
        for debit_time in debits['datetime']:
            # Find next credit
            future_credits = credit_dates[credit_dates > debit_time]
            if len(future_credits) > 0:
                next_credit = future_credits[0]
                # Calculate difference in days directly from the Timedelta object
                diff = (next_credit - debit_time).days
                delays.append(diff)
        
        if not delays:
            avg_repayment_days = 0 # Default or skip
        else:
            avg_repayment_days = np.mean(delays)
            
        # Feature: Transaction Frequency (tx per day)
        date_range = (group['datetime'].max() - group['datetime'].min()).days
        if date_range < 1: 
            date_range = 1
        tx_freq = len(group) / date_range
        
        # Feature: Credit Utilization (Amount Left / Limit) -- Wait, Amount Left is balance?
        # Let's use (Limit - Amount Left) / Limit to get utilization
        # Taking average utilization
        limit = group['account limit'].iloc[0]
        # Assuming 'amount left' is available funds. 
        # If 'amount left' > limit (which happens in some data), it implies positive balance? 
        # Let's just take the mean of 'transaction amount' for Debits as "Spending Size"
        if not debits.empty:
            avg_spend = debits['transaction amount'].mean()
        else:
            avg_spend = 0

        # Assign Label
        # 1-good payer (uses and repays after few days) -> 5 to 30 days
        # 2-late payer (pays too late) -> > 30 days
        # 3-frequent payer (repays too frequently) -> < 5 days
        
        if avg_repayment_days < 5:
            label = 'Frequent Payer'
            label_id = 3
        elif avg_repayment_days > 30:
            label = 'Late Payer'
            label_id = 2
        else:
            label = 'Good Payer'
            label_id = 1
            
        user_stats.append({
            'name': name,
            'avg_repayment_days': avg_repayment_days,
            'transaction_frequency': tx_freq,
            'avg_spend': avg_spend,
            'label': label,
            'label_id': label_id
        })

    result_df = pd.DataFrame(user_stats)
    print(f"Generated data for {len(result_df)} users.")
    print(result_df['label'].value_counts())
    
    result_df.to_csv(output_file, index=False)
    print(f"Saved to {output_file}")

if __name__ == "__main__":
    process_data('model_training_data.csv', 'labeled_data.csv')
