import pandas as pd
import logging
from zenml import step
import xgboost as xgb
import lightgbm as lgb
import mlflow
from typing_extensions import Annotated
from typing import Tuple
from xgboost.callback import EarlyStopping
from catboost import CatBoostRegressor

class ModelTrainer:
    def __init__(self,X_train,y_train,X_val,y_val,X_test,y_test):
        self.X_train=X_train
        self.y_train=y_train
        self.X_val=X_val
        self.y_val=y_val
        self.X_test=X_test
        self.y_test=y_test

        self.xgb = xgb.XGBRegressor(
            objective="reg:squarederror",
            n_estimators=300,
            learning_rate=0.05,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
        )

        self.lgb = lgb.LGBMRegressor(
            objective="regression",
            n_estimators=300,
            learning_rate=0.05,
            num_leaves=31,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
        )
        
        self.cat= CatBoostRegressor(
            iterations=300,
            learning_rate=0.05,
            depth=6,
            subsample=0.8,
            colsample_bylevel=0.8,
            random_seed=42,
            verbose=False
        )
        
    def train_xgboost(self):
        
        self.xgb.fit(self.X_train,self.y_train, eval_set=[(self.X_val,self.y_val)], verbose=False)
        val_score=self.xgb.score(self.X_val,self.y_val)
        

        logging.info(f"XGBoost Validation Score: {val_score}")
        return self.xgb

    def train_lightgbm(self):
        
        self.lgb.fit(self.X_train,self.y_train, eval_set=[(self.X_val,self.y_val)])
        val_score=self.lgb.score(self.X_val,self.y_val)
        
        logging.info(f"LightGBM Validation Score: {val_score}")
        return self.lgb
    
    def train_catboost(self):
        self.cat.fit(self.X_train,self.y_train, eval_set=[(self.X_val,self.y_val)], verbose=False)
        val_score=self.cat.score(self.X_val,self.y_val)
        
        logging.info(f"CatBoost Validation Score: {val_score}")
        return self.cat
    
@step 
def train_models(
    X_train, y_train,
    X_val, y_val,
    X_test, y_test
)-> Tuple[Annotated[xgb.XGBRegressor, "XGB_Model"],
    Annotated[lgb.LGBMRegressor, "LGB_Model"],
    Annotated[CatBoostRegressor, "CatBoost_Model"]]:

    try:
        trainer=ModelTrainer(
            X_train, y_train,
            X_val, y_val,
            X_test, y_test
        )
        
        xgb_model=trainer.train_xgboost()
        lgb_model=trainer.train_lightgbm()
        cat_model=trainer.train_catboost()
        
        return xgb_model, lgb_model, cat_model
    except Exception as e:
        logging.error(f"Error during model training: {e}")
        raise e