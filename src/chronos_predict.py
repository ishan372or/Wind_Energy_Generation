import pandas as pd
from chronos import Chronos2Pipeline
from dotenv import load_dotenv
import torch
from peft import LoraConfig
import os
import psycopg2

load_dotenv()

CUTOFFS = [2016, 2018, 2020, 2022, 2023]

DATABASE_URL= os.getenv("DATABASE_URL")

pipeline= Chronos2Pipeline.from_pretrained("amazon/chronos-2",device_map="cuda" if torch.cuda.is_available() else "cpu")

def load_energy_data(path:str)->pd.DataFrame:
    df=pd.read_csv(path)
    df["Region"]=df["Region"].str.split(":").str[0].str.strip()
    df["Month_Year"] = pd.to_datetime(df["Month_Year"], format="%b %Y", errors="coerce")
    df = df.sort_values(["Region", "Month_Year"])
    return df
    
def get_test_months(df:pd.DataFrame,state:str)->pd.DataFrame:
    test_df=df[(df["Region"]==state) & (df["Month_Year"] >= "2023-01-01")].copy()
    return test_df

def prepare_inputs(df: pd.DataFrame, cutoff: int) -> list[torch.Tensor]:
    tensors = []
    
    for state in df["Region"].unique():
        state_series = df[
            (df["Region"] == state) &
            (df["Month_Year"] < f"{cutoff}-01-01")
        ]["Net_Generation_MWh"].values.astype(float)
        
        if len(state_series) < 12:  
            print(f"Skipping {state} for cutoff {cutoff} — only {len(state_series)} months")
            continue
            
        tensors.append(torch.tensor(state_series, dtype=torch.float32))
    
    print(f"Prepared {len(tensors)} state series for cutoff {cutoff}")
    return tensors

def finetune_chronos(pipeline,df:pd.DataFrame,cutoff:int):
    inputs=prepare_inputs(df,cutoff)
    
    custom_lora_config = LoraConfig(
        r=16, 
        lora_alpha=32, 
        target_modules=[
            "self_attention.q",
            "self_attention.v",
            "self_attention.k",
            "self_attention.o",
            "output_patch_embedding.output_layer",
        ],
    )
    finetuned_pipeline=pipeline.fit(
        inputs=inputs,
        prediction_length=36,
        finetune_mode="lora",
        lora_config=custom_lora_config,
        learning_rate=1e-5,
        num_steps=200
    )
    
    return finetuned_pipeline

def predict(pipeline,df:pd.DataFrame,cutoff: int)->dict[str, list[float]]:
    predictions={}
    states=df["Region"].unique()
    
    for state in states:
        context = df[
            (df["Region"] == state) & (df["Month_Year"] < "2023-01-01")
        ]["Net_Generation_MWh"].values.astype(float)
        
        if len(context)==0:
            print(f"No data for {state} before cutoff {cutoff}, skipping prediction")
            continue
        
        context_tensor=torch.tensor(context, dtype=torch.float32).unsqueeze(0).unsqueeze(0)
        
        test_months = get_test_months(df, state)
        prediction_length = len(test_months)

        if prediction_length == 0:
            continue
        
        pred=pipeline.predict(context_tensor, prediction_length=prediction_length)
        
        median= pred[0].median(dim=0).squeeze(0).values.tolist()
        predictions[state]=median
        
    return predictions

def store_predictions(predictions: dict[str, list[float]], cutoff: int, df: pd.DataFrame):
    
    conn=psycopg2.connect(DATABASE_URL)
    cursor=conn.cursor()
    
    model_name = f"Chronos-{cutoff}"

    for state, pred_values in predictions.items():
        test_df = get_test_months(df, state).reset_index(drop=True)

        if len(pred_values) != len(test_df):
            print(f"Length mismatch for {state}: {len(pred_values)} preds vs {len(test_df)} months")
            continue

        for i, row in test_df.iterrows():
            month  = row["Month_Year"].strftime("%Y-%m")
            actual = float(row["Net_Generation_MWh"])
            pred   = round(pred_values[i], 2)

            cursor.execute("""
                INSERT INTO predictions (state, month, predicted, actual, model_name)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (state, month, pred, actual, model_name))

    conn.commit()
    cursor.close()
    conn.close()
    print(f"Stored predictions for {model_name}")
        
def run_all_cutoffs(energy_path: str):
    df = load_energy_data(energy_path)

    for cutoff in CUTOFFS:
        print(f"\n{'='*50}")
        print(f"Cutoff: {cutoff}")
        print(f"{'='*50}")

        try:
            finetuned_pipeline = finetune_chronos(pipeline, df, cutoff)
            predictions        = predict(finetuned_pipeline, df, cutoff)
            store_predictions(predictions, df, cutoff)
            print(f"Cutoff {cutoff} complete")

        except Exception as e:
            print(f"Failed for cutoff {cutoff}: {e}")
            continue

    print("\nAll cutoffs complete.")