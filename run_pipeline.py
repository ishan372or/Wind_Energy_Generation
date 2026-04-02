from pipelines.training_pipeline import training_pipeline
import logging
import mlflow
import dagshub

dagshub.init(repo_owner='ishan372or',repo_name='Wind_Energy_Prediction_end_to_end',mlflow=True)

weather_paths = {
    "California": r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\California weather.csv",
    "Colorado": r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\colorado weather.csv",
    "Illinois": r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\Illinois weather.csv",
    "Iowa": r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\Iowa weather.csv",
    "Kansas": r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\kansas weather.csv",
    "Minnesota": r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\Minnesota weather.csv",
    "North Dakota": r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\North Dakota weather.csv",
    "Oklahoma": r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\Oklahoma weather.csv",
    "Texas": r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\Texas weather.csv",
    "Washington": r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\Washington weather.csv",
}

if __name__=="__main__":
    training_pipeline(weather_paths=weather_paths,energy_path=r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\Net_Energy_Generation\Top 10 States net Generation.csv")
    