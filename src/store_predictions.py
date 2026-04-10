from zenml import step
import pandas as pd
import logging
import joblib
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

@step(enable_cache=False)
def predict_and_store(
    xgb_model,
    lgb_model,
    cat_model,
    df: pd.DataFrame
):
    preprocessor = joblib.load("preprocessor.pkl")

    DB_URL = os.getenv("DATABASE_URL")
    if DB_URL is None:
        raise ValueError("DATABASE_URL not found in environment variables")

    conn = psycopg2.connect(DB_URL)
    cursor = conn.cursor()

    test_df = df[df["Month_Year"] >= "2023-01-01"]

    for model, model_name in [
        (xgb_model, "XGBoost"),
        (lgb_model, "LightGBM"),
        (cat_model, "CatBoost")
    ]:
        for _, row in test_df.iterrows():
            try:
                month = row["Month_Year"].strftime("%Y-%m")
                state = row["Region"]

                row_df = pd.DataFrame([row])
                X, _ = preprocessor.transform(row_df)

                pred = float(model.predict(X)[0])
                
                cursor.execute("""
                    UPDATE predictions
                    SET predicted = %s
                    WHERE state = %s 
                      AND month = %s 
                      AND model_name = %s 
                      AND predicted IS NULL
                """, (pred, state, month, model_name))

                logging.info(f"Stored {model_name} prediction for {state} {month}")

            except Exception as e:
                logging.error(f"Error processing {model_name} for {state}: {e}")
    conn.commit()
    cursor.close()
    conn.close()