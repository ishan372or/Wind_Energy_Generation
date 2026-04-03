from zenml import step
import logging
import pandas as pd
from datetime import datetime
import requests
import os
from dotenv import load_dotenv

load_dotenv()

STATE_MAP = {
    "CA": "California",
    "CO": "Colorado",
    "IL": "Illinois",
    "IA": "Iowa",
    "KS": "Kansas",
    "MN": "Minnesota",
    "ND": "North Dakota",
    "OK": "Oklahoma",
    "TX": "Texas",
    "WA": "Washington",
}

ENERGY_PATH = os.getenv("ENERGY_PATH", "raw/Net_Energy_Generation/Top 10 States net Generation.csv")

@step
def fetch_energy_data():
    try:
        api_key=os.getenv("EIA_API_KEY")
        df=pd.read_csv(ENERGY_PATH)
        df["Month_Year_dt"]=pd.to_datetime(df["Month_Year"],format="%b-%Y")
        latest_in_csv=df["Month_Year_dt"].max()
        
        last_month=datetime.now().replace(day=1) - pd.DateOffset(months=1)
        missing_months=pd.date_range(start=latest_in_csv + pd.DateOffset(months=1), end=last_month, freq='MS')
        
        for month_dt in missing_months:
            period_str=month_dt.strftime("%Y-%m")
            month_year_str=month_dt.strftime("%b-%Y")
            
            logging.info(f"Fetching data for {month_year_str}")
            
            url= "https://api.eia.gov/v2/electricity/electric-power-operational-data/data/"    
            
            params= {
                "api_key":                  api_key,
                "frequency":                "monthly",
                "data[0]":                  "generation",
                "facets[fueltypeid][]":     "WND",
                "facets[sectorid][]":       "99",
                "facets[location][]":       list(STATE_MAP.keys()), 
                "start":                    period_str,
                "end":                      period_str,
                "sort[0][column]":          "period",
                "sort[0][direction]":       "desc",
                "length":                   100
            }
            response= requests.get(url=url,params=params,timeout=30)
            response.raise_for_status()
            
            rows= response.json().get("response", {}).get("data", [])
            
            df_energy=pd.read_csv(ENERGY_PATH)
    
            if not rows:
                raise ValueError(f"No EIA data returned for period {period}")
    
            logging.info(f"EIA returned {len(rows)} rows for {month_year}")
            
            new_rows=[]
            for row in rows:
                location= row["location"]
                state_name= STATE_MAP.get(location)
                month_year= row["period"]
                generation= row["generation"]
                
                if not state_name:
                    logging.warning(f"Unknown state code {location} in EIA data, skipping")
                    continue
                
                region_label = f"{state_name} : all sectors"
                
                already_exists= (df["Region"]==region_label) & (df["Month_Year"]==month_year).any()
                
                if already_exists:
                    logging.info(f"Data for {region_label} in {month_year} already exists, skipping")
                    continue
                
                new_rows.append({
                    "Region": region_label,
                    "Month_Year": month_year,
                    "Net_Generation_MWh": generation
                })
                
                logging.info(f"Adding data for {region_label} in {month_year}: {generation} MWh")
            
            if new_rows:
                updated_df= pd.concat([df_energy, pd.DataFrame(new_rows)], ignore_index=True)
                updated_df.to_csv(energy_path, index=False)
                logging.info(f"Appended {len(new_rows)} new rows to energy CSV")
            else:
                logging.info("All states already up to date — nothing appended")
    
            return energy_path
        
    except Exception as e:
        logging.error(f"Error occurred while fetching energy data: {e}")
        raise e
