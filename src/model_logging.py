from zenml import step
import mlflow
import logging

@step
def log_model_metrics(model,model_name:str,metrics:dict):
    try:
        with mlflow.start_run(run_name=f"{model_name} model",nested=True):
            mlflow.log_metrics(metrics)
            if "lgb" in model_name.lower() or "lightgbm" in model_name.lower():
                mlflow.lightgbm.log_model(model, model_name)
            else:
                mlflow.sklearn.log_model(model, model_name)
            logging.info(f"Logged {model_name} metrics and model to MLflow")
    except Exception as e:
        logging.error(f"Error logging {model_name} metrics/model to MLflow: {e}")
        raise e
    