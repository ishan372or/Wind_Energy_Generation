import sys
import os
from flask import Flask, jsonify, request
import logging
import psycopg2
from flask_cors import CORS
from psycopg2.extras import RealDictCursor
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
MODELS = ["XGBoost", "LightGBM","CatBoost"]
        
@app.route("/models", methods=["GET"])
def get_models():
    return jsonify({"models": ["XGBoost", "LightGBM","CatBoost"]})

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
        cursor= conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("""SELECT month, predicted, actual FROM predictions WHERE state=%s AND model_name=%s ORDER BY month ASC""", (state, model_name)) 
        rows = cursor.fetchall()
        
        cursor.close()
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
    
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)