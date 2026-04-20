from src.chronos_predict import run_all_cutoffs

ENERGY_PATH = "raw/Net_Energy_Generation/Top 10 States net Generation.csv"

if __name__ == "__main__":
    run_all_cutoffs(ENERGY_PATH)