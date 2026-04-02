import pandas as pd
from zenml.steps import step
import logging

class WeatherDataValidation():
    def  __init__(self,path):
        self.path=path
        
    def load_data(self,path)->pd.DataFrame:
        with open(path,'r') as file:
            lines=file.readlines()
        end_header_idx = None
        for i, line in enumerate(lines):
            if "-END HEADER-" in line:
                end_header_idx = i
                break
        if end_header_idx is None:
            raise ValueError("Header end marker not found in the file.")
        
        data = pd.read_csv(path, skiprows=end_header_idx + 1)
        return data
    
    def Validate_weather(self):
        self.df=self.load_data(self.path)
        EXPECTED_COLUMNS = [
            "PARAMETER", "YEAR",
            "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
            "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "ANN"
        ]
        if list(self.df.columns) != EXPECTED_COLUMNS:
            logging.info("Weather data schema mismatch")
            raise ValueError("Weather data schema mismatch")
            
        ALLOWED_PARAMETERS = {
            "PS", "T2M", "T2M_MAX", "T2M_MIN",
            "WS10M", "WS50M", "WD10M", "WD50M","WS10M_MAX", "WS50M_MAX" , "WS10M_MIN",
            "WS50M_MIN" , "WS10M_RANGE", "WS50M_RANGE" ,"T2M_RANGE"
        }
        
        for param in self.df['PARAMETER'].unique():
            if param not in ALLOWED_PARAMETERS:
                logging.info(f"Invalid PARAMETER found: {param}")
                raise ValueError(f"Invalid PARAMETER found: {param}")
            
        if not pd.api.types.is_integer_dtype(self.df["YEAR"]):
            raise ValueError("YEAR column must be integer")
        
        logging.info("Data Validation Weather Completed Successfully")
        return self.df
@step
def validate_weather_data(path: str) -> pd.DataFrame:
    try:
        validate=WeatherDataValidation(path)
        df=validate.load_data(path)
        df=validate.Validate_weather()
        return df
    except Exception as e:
        logging.error(f"Error during data validation: {e}")
        raise e