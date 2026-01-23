import pandas as pd
try:
    df = pd.read_csv('model_training_data.csv', encoding='utf-16', sep='\t')
    with open('data_info.txt', 'w', encoding='utf-8') as f:
        f.write("Columns:\n")
        f.write(str(list(df.columns)) + "\n\n")
        f.write("First Row:\n")
        f.write(str(df.iloc[0].to_dict()) + "\n")
        f.write("\nData Types:\n")
        f.write(str(df.dtypes) + "\n")
except Exception as e:
    print(e)
