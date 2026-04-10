from zenml import pipeline
from src.data_cleaning import clean_weather_data, merge_weather_energy
from src.data_validation_energy import validate_data
from src.data_validation_weather import validate_weather_data
from src.data_preprocessing import preprocess_data
from src.model_train import train_models
from src.model_evaluation import evaluate_model
from src.model_logging import log_model_metrics
from src.store_predictions import predict_and_store
from src.data_preprocessing import add_lag_features_step
import mlflow

@pipeline
def training_pipeline(weather_paths:dict[str, str],energy_path:str):
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
    
    X_train, X_test, y_train, y_test, X_val, y_val= preprocess_data(df_lagged)
    
    xgb_model,lgb_model,cat_model=train_models(
        X_train, y_train,
        X_val, y_val,
        X_test, y_test)
    
    results_xgb= evaluate_model(
        xgb_model, X_test, y_test)
    
    results_lgb= evaluate_model(
        lgb_model, X_test, y_test)
    
    results_cat= evaluate_model(
        cat_model, X_test, y_test)

    log_model_metrics(xgb_model, "XGBoost_Model", results_xgb)
    log_model_metrics(lgb_model, "LightGBM_Model", results_lgb)
    log_model_metrics(cat_model, "CatBoost_Model", results_cat)

    predict_and_store(xgb_model, lgb_model, cat_model, df_lagged)
    
    return {
        "XGB_Results": results_xgb,
        "LGB_Results": results_lgb,
        "CatBoost_Results": results_cat
    }

