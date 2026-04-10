from zenml import pipeline
from src.fetch_weather_data import fetch_weather_data
from src.fetch_energy_data import fetch_energy_data
from src.data_validation_energy import validate_data
from src.data_validation_weather import validate_weather_data
from src.data_cleaning import clean_weather_data
from src.data_preprocessing import add_lag_features_step
from src.store_predictions import predict_and_store
from src.load_models import load_models
import mlflow.sklearn
from dotenv import load_dotenv
import os

load_dotenv()

STATE_PATH_MAP = {
    "CA": "raw/weather/California weather.csv",
    "CO": "raw/weather/colorado weather.csv",
    "IL": "raw/weather/Illinois weather.csv",
    "IA": "raw/weather/Iowa weather.csv",
    "KS": "raw/weather/kansas weather.csv",
    "MN": "raw/weather/Minnesota weather.csv",
    "ND": "raw/weather/North Dakota weather.csv",
    "OK": "raw/weather/Oklahoma weather.csv",
    "TX": "raw/weather/Texas weather.csv",
    "WA": "raw/weather/Washington weather.csv",
}

COORDINATE_MAP= {
    "CA": [36.5328,  -119.2702],
    "CO": [39.0523,  -105.7821],
    "IL": [40.6331,   -89.3985],
    "IA": [41.8780,   -93.0977],
    "KS": [39.0119,   -98.4842],
    "MN": [46.7296,   -94.6859],
    "ND": [47.5515,  -101.0020],
    "OK": [35.0078,   -97.0929],
    "TX": [31.9686,   -99.9018],
    "WA": [47.7511,  -120.7401],
}

MONTH_COLS = {
    1: "JAN", 2: "FEB",  3: "MAR", 4: "APR",
    5: "MAY", 6: "JUN",  7: "JUL", 8: "AUG",
    9: "SEP", 10: "OCT", 11: "NOV", 12: "DEC"
}

PARAMETERS = "PS,T2M,T2M_MAX,T2M_MIN,T2M_RANGE,WD10M,WD50M,WS10M,WS10M_MAX,WS10M_MIN,WS10M_RANGE,WS50M,WS50M_MAX,WS50M_MIN,WS50M_RANGE"

NASA_POWER_MAX_YEAR = 2025

STATE_MAP = {
    "CA": "California",
    "CO": "Colorado",
    "IL": "Illinois",
    "IA": "Iowa",
    "KS": "Kansas",
    "MN": "Minnesota",
    "ND": "North Dakota",
    "OK": "Oklahoma",
    "TX": "Texas",
    "WA": "Washington",
}

ENERGY_PATH = os.getenv("ENERGY_PATH", "raw/Net_Energy_Generation/Top 10 States net Generation.csv")

@pipeline
def monthly_update(weather_paths:dict[str, str],energy_path:str):
    fetch_weather_data()
    fetch_energy_data()
    df_energy=validate_data(energy_path)
    
    validated_weather_dfs={}
    for state,path in weather_paths.items():
        df_weather=validate_weather_data(path)
        validated_weather_dfs[state]=df_weather

    weather_artifacts={}
    for state, weather_artifact in validated_weather_dfs.items():
        weather_artifacts[state] = clean_weather_data(weather_artifact,state) 
        
    merged_df=merge_weather_energy(weather_df_list=list(weather_artifacts.values()), energy_df=df_energy)
    
    df_lagged=add_lag_features_step(merged_df)
    
    models=load_models()
    
    predict_and_store(
        models["XGBoost"],
        models["LightGBM"],
        models["CatBoost"],
        df_lagged
    )
    
    
    