import pandas as pd
from zenml.steps import step
import logging

class EnergyDataValidation():
    def __init__(self,path:str):
        self.df=pd.read_csv(path)
    def validate_energy(self):
        columns_required = {
            "Region": str,
            "Month_Year": str,
            "Net_Generation_MWh": float,
        }
        Allowed_states = [
            "Illinois : all sectors","California : all sectors",
            "Texas : all sectors","Kansas : all sectors","Iowa : all sectors",
            "North Dakota : all sectors","Minnesota : all sectors","Oklahoma : all sectors",
            "Washington : all sectors","Colorado : all sectors"
        ]
        for col, dtype in columns_required.items():
            if col not in self.df.columns:
                logging.info(f"Missing required column: {col}")
                raise ValueError(f"Missing required column: {col}")
        
        self.df["Month_Year"] = pd.to_datetime(
            self.df["Month_Year"], format="%b %Y", errors="coerce"
        )
        
        if self.df["Month_Year"].isnull().any():
            raise ValueError("Invalid Month_Year date format detected")
        
        for state in self.df['Region'].unique():
            if state not in Allowed_states:
                logging.info(f"Invalid state found: {state}")
                raise ValueError(f"Invalid state found: {state}")
            
        if (self.df['Net_Generation_MWh']<0).any():
            logging.info("Negative values found in Net_Generation_MWh")
            raise ValueError("Negative values found in Net_Generation_MWh")
        
        logging.info("Data Validation Energy Completed Successfully")
        return self.df

@step
def validate_data(path: str) -> pd.DataFrame:
    try:
        validate=EnergyDataValidation(path)
        df=validate.validate_energy()
        return df
    except Exception as e:
        logging.error(f"Error during data validation: {e}")
        raise e
