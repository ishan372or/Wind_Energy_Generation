import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from flask import Flask, jsonify, request
from pipelines.training_pipeline import training_pipeline
from pipelines.monthly_update_pipeline import monthly_update
import logging
import mlflow
import sqlite3
from apscheduler.schedulers.background import BackgroundScheduler
from flask_cors import CORS
import dagshub

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))  
PROJECT_ROOT = os.path.dirname(BASE_DIR)               
DB_PATH = os.path.join(PROJECT_ROOT, "src" , "predictions.db")

STATES = [
    "California", "Colorado", "Illinois", "Iowa", "Kansas",
    "Minnesota", "North Dakota", "Oklahoma", "Texas", "Washington"
]
MODELS = ["XGBoost", "LightGBM"]
 
WEATHER_PATHS = {
    "California":   r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\California weather.csv",
    "Colorado":     r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\colorado weather.csv",
    "Illinois":     r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\Illinois weather.csv",
    "Iowa":         r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\Iowa weather.csv",
    "Kansas":       r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\kansas weather.csv",
    "Minnesota":    r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\Minnesota weather.csv",
    "North Dakota": r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\North Dakota weather.csv",
    "Oklahoma":     r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\Oklahoma weather.csv",
    "Texas":        r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\Texas weather.csv",
    "Washington":   r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\Washington weather.csv",
}
 
ENERGY_PATH = r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\Net_Energy_Generation\Top 10 States net Generation.csv"

def run_training():
    try:
        logging.info("Starting training pipeline")
        dagshub.init(
            repo_owner="ishan372or",
            repo_name="Wind_Energy_Prediction_end_to_end",
            mlflow=True
        )
        training_pipeline(
            weather_paths=WEATHER_PATHS,
            energy_path=ENERGY_PATH
        )
        logging.info("Training pipeline completed successfully")
    except Exception as e:
        logging.error(f"Training pipeline failed: {e}")

def monthly_update():
    try:
        logging.info("Monthly update triggered")
        dagshub.init(
            repo_owner="ishan372or",
            repo_name="Wind_Energy_Prediction_end_to_end",
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
        conn=sqlite3.connect(DB_PATH)
        conn.row_factory= sqlite3.Row
        
        rows= conn.execute("""SELECT month,predicted,actual FROM predictions WHERE state=? AND model_name=? ORDER BY month ASC""",(state,model_name)).fetchall()
        
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