import os
from dotenv import load_dotenv
import dagshub
import mlflow

load_dotenv()

dagshub.init(
    repo_owner=os.getenv("DAGSHUB_REPO_OWNER"),
    repo_name=os.getenv("DAGSHUB_REPO_NAME"),
    mlflow=True
)

from pipelines.monthly_update_pipeline import monthly_update

WEATHER_PATHS = {
    "California":   "raw/weather/California weather.csv",
    "Colorado":     "raw/weather/colorado weather.csv",
    "Illinois":     "raw/weather/Illinois weather.csv",
    "Iowa":         "raw/weather/Iowa weather.csv",
    "Kansas":       "raw/weather/kansas weather.csv",
    "Minnesota":    "raw/weather/Minnesota weather.csv",
    "North Dakota": "raw/weather/North Dakota weather.csv",
    "Oklahoma":     "raw/weather/Oklahoma weather.csv",
    "Texas":        "raw/weather/Texas weather.csv",
    "Washington":   "raw/weather/Washington weather.csv",
}

ENERGY_PATH = "raw/Net_Energy_Generation/Top 10 States net Generation.csv"

monthly_update(
    weather_paths=WEATHER_PATHS,
    energy_path=ENERGY_PATH,
    eia_api_key=os.getenv("EIA_API_KEY")
)