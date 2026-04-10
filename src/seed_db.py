import psycopg2
import pandas as pd
import os
from dotenv import load_dotenv

load_dotenv()

DB_URL=os.getenv("DATABASE_URL")

ENERGY_PATH = os.getenv("ENERGY_PATH", "raw/Net_Energy_Generation/Top 10 States net Generation.csv")

df=pd.read_csv(ENERGY_PATH)

df["Region"] = df["Region"].str.split(":").str[0].str.strip()
df["Month_Year"] = pd.to_datetime(df["Month_Year"], format="%b %Y", errors="coerce")
df = df[df["Month_Year"] >= "2023-01-01"]

conn=psycopg2.connect(DB_URL)
cursor= conn.cursor()

cursor.execute("""
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
    for model_name in ["XGBoost", "LightGBM", "CatBoost"]:
        cursor.execute(
            "INSERT INTO predictions VALUES (%s, %s, %s, %s, %s)",
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
cursor.close()
conn.close()
print(f"Done! Seeded {count} rows")