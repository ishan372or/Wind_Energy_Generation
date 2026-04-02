import numpy as np
import pandas as pd
from zenml import step
import logging

class CleanData():
    def __init__(self,df_weather,state:str):
        self.df_weather=df_weather
        self.state=state
    
    def cleaning_data_weather(self):
        self.df_weather=self.df_weather.melt(
            id_vars=["PARAMETER", "YEAR"],
            var_name="MONTH",
            value_name="Value"
        )

        months=[ "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
            "JUL", "AUG", "SEP", "OCT", "NOV", "DEC" ]
        
        self.df_weather=self.df_weather[self.df_weather['MONTH'].isin(months)].copy()
        self.df_weather["Month_Year"]=self.df_weather["MONTH"]+" "+self.df_weather["YEAR"].astype(str)
        self.df_weather["Month_Year"]=pd.to_datetime(
            self.df_weather["Month_Year"], format="%b %Y", errors="coerce"
        )
        self.df_weather.drop(['MONTH','YEAR'], axis=1, inplace=True)
        
        self.df_weather['Region']=self.state
        
        logging.info(f"Weather for {self.state} Data Cleaned")
        
        return self.df_weather

@step
def clean_weather_data(weather_df:pd.DataFrame,state:str) ->pd.DataFrame:
    
    try:
        clean=CleanData(weather_df,state)
        df_cleaned=clean.cleaning_data_weather()
        return df_cleaned
    except Exception as e:
        logging.error(f"Error while cleaning the data for {state}:{e}")
        raise e
    

@step
def merge_weather_energy(
    weather_df_list: list[pd.DataFrame],
    energy_df: pd.DataFrame) -> pd.DataFrame:
    
    weather_df=pd.concat(weather_df_list,ignore_index=True)
    
    weather_df=weather_df.pivot_table(
        index=['Region','Month_Year'],
        columns='PARAMETER',
        values='Value'
    ).reset_index()

    energy_df["Region"]=energy_df["Region"].str.split(":").str[0].str.strip()
    
    final_df = pd.merge(
        weather_df,
        energy_df,
        on=["Region", "Month_Year"],
        how="inner"
    )

    return final_df
    
        