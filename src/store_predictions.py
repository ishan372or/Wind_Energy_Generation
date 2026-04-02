from zenml import step
import pandas as pd
import logging
import joblib
import sqlite3
import os
 
@step
def predict_and_store(
    xgb_model,
    lgb_model,
    df: pd.DataFrame
):
    preprocessor = joblib.load("preprocessor.pkl")
    DB_PATH = os.path.join(os.getcwd(), "src", "predictions.db")
    conn = sqlite3.connect(DB_PATH)
 
    test_df = df[df["Month_Year"] >= "2023-01-01"]
 
    try:
        already_stored = pd.read_sql(
            "SELECT DISTINCT month, state, model_name FROM predictions WHERE predicted IS NOT NULL", conn
        )
        stored_pairs = set(
            zip(already_stored["month"], already_stored["state"], already_stored["model_name"])
        )
    except:
        stored_pairs = set() 
 
    for model, model_name in [(xgb_model, "XGBoost"), (lgb_model, "LightGBM")]:
        for _, row in test_df.iterrows():
            month = row["Month_Year"].strftime("%Y-%m")
            state = row["Region"]
 
            if (month, state, model_name) in stored_pairs:
                continue
 
            row_df = pd.DataFrame([row])
            X, _ = preprocessor.transform(row_df)
            pred = float(model.predict(X)[0])
            actual = float(row["Net_Generation_MWh"])  
            conn.execute("""
                UPDATE predictions
                SET predicted = ?
                WHERE state = ? AND month = ? AND model_name = ? AND predicted IS NULL
            """, (pred, state, month, model_name))
            conn.commit()
 
            logging.info(f"Stored {model_name} prediction for {state} {month}")
 
    conn.close()