import pandas as pd
import logging
from zenml.steps import step
from typing_extensions import Annotated
from typing import Tuple
from sklearn.preprocessing import StandardScaler, OneHotEncoder
import numpy as np
import joblib
import mlflow
import os

class DataPreprocessing:
    def __init__(self):
        self.lags = [1, 2, 3, 6, 12]
        self.scaler = StandardScaler()
        self.encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
        self.num_cols = None
        self.cat_cols = None
        self.target_col = "Net_Generation_MWh"

        self.EXCLUDE_COLS = ["Month_Year", self.target_col]

    @staticmethod
    def time_split(df: pd.DataFrame):
        train = df[df["Month_Year"] < "2021-01-01"]  
        val   = df[(df["Month_Year"] >= "2021-01-01") & (df["Month_Year"] < "2023-01-01")]
        test  = df[df["Month_Year"] >= "2023-01-01"]  
        return train, val, test

    def fit(self, df: pd.DataFrame):
        self.num_cols = [
            col for col in df.select_dtypes(include=["int64", "float64"]).columns
            if col not in self.EXCLUDE_COLS
        ]
        self.cat_cols = ["Region"]

        self.scaler.fit(df[self.num_cols])
        self.encoder.fit(df[self.cat_cols])

    def transform(self, df: pd.DataFrame):
        X_num = self.scaler.transform(df[self.num_cols])
        X_cat = self.encoder.transform(df[self.cat_cols])

        X = np.hstack([X_num, X_cat])
        y = df[self.target_col].values

        return X, y

    def save(self, path: str = "preprocessor.pkl"):
        """Save the fitted preprocessor to disk so Flask can load it later."""
        joblib.dump(self, path)
        logging.info(f"Preprocessor saved to {path}")


@step
def preprocess_data(df: pd.DataFrame) -> Tuple[
    Annotated[np.ndarray, "X_train"],
    Annotated[np.ndarray, "X_test"],
    Annotated[np.ndarray, "y_train"],
    Annotated[np.ndarray, "y_test"],
    Annotated[np.ndarray, "X_val"],
    Annotated[np.ndarray, "y_val"],
]:
    try:
        preprocessor = DataPreprocessing()
        
        train_df, val_df, test_df = DataPreprocessing.time_split(df)

        preprocessor.fit(train_df)

        X_train, y_train = preprocessor.transform(train_df)
        X_val,   y_val   = preprocessor.transform(val_df)
        X_test,  y_test  = preprocessor.transform(test_df)


        preprocessor.save("preprocessor.pkl")
        mlflow.log_artifact("preprocessor.pkl") 

        logging.info("Data Preprocessing Completed Successfully")

        return X_train, X_test, y_train, y_test, X_val, y_val

    except Exception as e:
        logging.error(f"Error during data preprocessing: {e}")
        raise e
    
    
@step
def add_lag_features_step(df: pd.DataFrame) -> pd.DataFrame:
    try:
        df = df.sort_values(["Region", "Month_Year"])

        lags = [1, 2, 3, 6, 12]

        for lag in lags:
            df[f"lag_{lag}"] = (
                df.groupby("Region")["Net_Generation_MWh"]
                .shift(lag)
            )

        df = df.dropna().reset_index(drop=True)

        logging.info("Lag features created successfully")
        return df

    except Exception as e:
        logging.error(f"Error in lag feature step: {e}")
        raise e