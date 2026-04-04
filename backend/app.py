import sys
import os
from flask import Flask, jsonify, request
from pipelines.training_pipeline import training_pipeline
from pipelines.monthly_update_pipeline import monthly_update
import logging
import mlflow
import psycopg2
from apscheduler.schedulers.background import BackgroundScheduler
from flask_cors import CORS
import dagshub
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
DB_URL= os.getenv("DATABASE_URL")

STATES = [
    "California", "Colorado", "Illinois", "Iowa", "Kansas",
    "Minnesota", "North Dakota", "Oklahoma", "Texas", "Washington"
]
MODELS = ["XGBoost", "LightGBM"]
 
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

def monthly_update():
    try:
        logging.info("Monthly update triggered")
        dagshub.init(
            repo_owner=os.getenv("DAGSHUB_REPO_OWNER"),
            repo_name=os.getenv("DAGSHUB_REPO_NAME"),
            mlflow=True
        )
        monthly_update()
    except Exception as e:
        logging.error(f"Monthly update failed: {e}")
        
@app.route("/models", methods=["GET"])
def get_models():
    return jsonify({"models": ["XGBoost", "LightGBM"]})

@app.route("/forecast",methods=["GET"])
def get_forecast():
    state      = request.args.get("state")
    model_name = request.args.get("model", "XGBoost")  

    if not state:
        return jsonify({"error": "state parameter is required"}), 400
    if state not in STATES:
        return jsonify({"error": f"Invalid state '{state}'. Choose from: {STATES}"}), 400
    if model_name not in MODELS:
        return jsonify({"error": f"Invalid model '{model_name}'. Choose from: {MODELS}"}), 400
    
    try:
        conn=psycopg2.connect(DB_URL)
        conn.row_factory= psycopg2.Row
        
        rows= conn.execute("""SELECT month,predicted,actual FROM predictions WHERE state=%s AND model_name=%s ORDER BY month ASC""",(state,model_name)).fetchall()
        
        conn.close()
        
        if not rows:
            return jsonify({
                "error": f"No predictions found for {state} using {model_name}. Run the training pipeline first."
            }), 404

        data=[
            {
                "month": row["month"],
                "predicted": round(row["predicted"],2),
                "actual": round(row["actual"],2)
            }
            for row in rows
        ]
        return jsonify({
            "state":      state,
            "model_name": model_name,
            "data":       data
        })
 
    except Exception as e:
        logging.error(f"Error fetching forecast for {state}: {e}")
        return jsonify({"error": str(e)}), 500
    
scheduler = BackgroundScheduler()
scheduler.add_job(
    func=monthly_update,
    trigger="cron",
    month=1,
    day=2,
    hour=0,
    minute=0
)
scheduler.start()

if __name__=="__main__":
    app.run(debug=True,port=5000)