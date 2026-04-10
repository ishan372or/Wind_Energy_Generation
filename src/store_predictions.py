from zenml import step
import pandas as pd
import logging
import joblib
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
 
@step
def predict_and_store(
    xgb_model,
    lgb_model,
    cat_model,
    df: pd.DataFrame
):
    preprocessor= joblib.load("preprocessor.pkl")
    DB_URL= os.getenv("DATABASE_URL")
    conn = psycopg2.connect(DB_URL)
    cursor= conn.cursor()
    
    test_df = df[df["Month_Year"] >= "2023-01-01"]
 
    try:
        cursor.execute(
            "SELECT DISTINCT month, state, model_name FROM predictions WHERE predicted IS NOT NULL"
        )
        rows= cursor.fetchall()
        stored_pairs= set(rows)  
    except:
        stored_pairs = set()
 
    for model, model_name in [(xgb_model, "XGBoost"), (lgb_model, "LightGBM"), (cat_model, "CatBoost")]:
        for _, row in test_df.iterrows():
            month = row["Month_Year"].strftime("%Y-%m")
            state = row["Region"]
 
            if (month, state, model_name) in stored_pairs:
                continue
 
            row_df = pd.DataFrame([row])
            X, _ = preprocessor.transform(row_df)
            pred = float(model.predict(X)[0])
            actual = float(row["Net_Generation_MWh"])  
            cursor.execute("""
                UPDATE predictions
                SET predicted = %s
                WHERE state = %s AND month = %s AND model_name = %s AND predicted IS NULL
            """, (pred, state, month, model_name))
            conn.commit()
 
            logging.info(f"Stored {model_name} prediction for {state} {month}")
    
    cursor.close()
    conn.close()