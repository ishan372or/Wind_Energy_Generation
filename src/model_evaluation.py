import  pandas as pd
import logging
from zenml import step
import numpy as np
from sklearn.metrics import root_mean_squared_error, mean_absolute_error, r2_score

class ModelEvaluation:
    def __init__(self,model,X_test,y_test):
        self.model=model
        self.X_test=X_test
        self.y_test=y_test
    
    def evaluate(self):
        y_pred=self.model.predict(self.X_test)
        
        rmse=root_mean_squared_error(self.y_test,y_pred)
        mae=mean_absolute_error(self.y_test,y_pred)
        r2=r2_score(self.y_test,y_pred)
        
        logging.info(f"Model Evaluation Metrics - RMSE: {rmse}, MAE: {mae}, R2: {r2}")
            
        return {
            "RMSE": rmse,
            "MAE": mae,
            "R2": r2
        }
@step
def evaluate_model(model, X_test: np.ndarray, y_test: np.ndarray) -> dict:
    try:
        evaluator=ModelEvaluation(model,X_test,y_test)
        metrics=evaluator.evaluate()       
        return metrics
    except Exception as e:
        logging.error(f"Error during model evaluation: {e}")
        raise e 

