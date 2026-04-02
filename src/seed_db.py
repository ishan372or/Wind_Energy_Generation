import sqlite3
import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))  
PROJECT_ROOT = os.path.dirname(BASE_DIR)                
DB_PATH = os.path.join(PROJECT_ROOT, "src", "predictions.db")

ENERGY_PATH= r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\Net_Energy_Generation\Top 10 States net Generation.csv"

df=pd.read_csv(ENERGY_PATH)

df["Region"] = df["Region"].str.split(":").str[0].str.strip()
df["Month_Year"] = pd.to_datetime(df["Month_Year"], format="%b %Y", errors="coerce")
df = df[df["Month_Year"] >= "2023-01-01"]

conn=sqlite3.connect(DB_PATH)

conn.execute("""
    CREATE TABLE IF NOT EXISTS predictions (
        state TEXT,
        month TEXT,
        predicted REAL,
        actual REAL,
        model_name TEXT
    )
""")

count = 0
for _, row in df.iterrows():
    for model_name in ["XGBoost", "LightGBM"]:
        conn.execute(
            "INSERT INTO predictions VALUES (?, ?, ?, ?, ?)",
            (
                str(row["Region"]),
                row["Month_Year"].strftime("%Y-%m"),
                None,
                float(row["Net_Generation_MWh"]),
                str(model_name)
            )
        )
        count += 1

conn.commit()
conn.close()
print(f"Done! Seeded {count} rows")