from zenml import step
import mlflow
import dagshub
from dotenv import load_dotenv

load_dotenv()

@step
def load_models():
    run_id_lightgbm = os.getenv("run_id_lightgbm")
    run_id_xgboost = os.getenv("run_id_xgboost")
    dagshub.init(
        repo_owner="ishan372or",
        repo_name="Wind_Energy_Prediction_end_to_end",
        mlflow=True
    )
    
    xgboost=mlfflow.sklearn.load_model(f"runs:/{run_id_xgboost}/model")
    lightgbm=mlflow.sklearn.load_model(f"runs:/{run_id_lightgbm}/model")
    catboost=mlflow.sklearn.load_model(f"runs:/{run_id_catboost}/model")
    
    return{
        "XGBoost": xgboost,
        "LightGBM": lightgbm,
        "CatBoost": catboost
    }