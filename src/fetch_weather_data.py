from zenml import step
import logging
import pandas as pd
import requests
from datetime import datetime
from dateutil.relativedelta import relativedelta

STATE_PATH_MAP = {
    "CA": r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\California weather.csv",
    "CO": r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\colorado weather.csv",
    "IL": r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\Illinois weather.csv",
    "IA": r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\Iowa weather.csv",
    "KS": r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\kansas weather.csv",
    "MN": r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\Minnesota weather.csv",
    "ND": r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\North Dakota weather.csv",
    "OK": r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\Oklahoma weather.csv",
    "TX": r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\Texas weather.csv",
    "WA": r"C:\Users\Ishan Khan\OneDrive\Desktop\windEnergyend to end\raw\weather\Washington weather.csv",
}

COORDINATE_MAP = {
    "CA": [36.5328,  -119.2702],
    "CO": [39.0523,  -105.7821],
    "IL": [40.6331,   -89.3985],
    "IA": [41.8780,   -93.0977],
    "KS": [39.0119,   -98.4842],
    "MN": [46.7296,   -94.6859],
    "ND": [47.5515,  -101.0020],
    "OK": [35.0078,   -97.0929],
    "TX": [31.9686,   -99.9018],
    "WA": [47.7511,  -120.7401],
}

MONTH_COLS = {
    1: "JAN", 2: "FEB",  3: "MAR", 4: "APR",
    5: "MAY", 6: "JUN",  7: "JUL", 8: "AUG",
    9: "SEP", 10: "OCT", 11: "NOV", 12: "DEC"
}

PARAMETERS = "PS,T2M,T2M_MAX,T2M_MIN,T2M_RANGE,WD10M,WD50M,WS10M,WS10M_MAX,WS10M_MIN,WS10M_RANGE,WS50M,WS50M_MAX,WS50M_MIN,WS50M_RANGE"

NASA_POWER_MAX_YEAR = 2025


def load_csv_with_header(path: str):
    with open(path, "r") as f:
        lines = f.readlines()

    end_header_idx = None
    for i, line in enumerate(lines):
        if "-END HEADER-" in line:
            end_header_idx = i
            break

    if end_header_idx is None:
        raise ValueError(f"Header end marker not found in {path}")

    header_lines = lines[:end_header_idx + 1]
    df = pd.read_csv(path, skiprows=end_header_idx + 1)
    return header_lines, df


def find_last_valid_month(df: pd.DataFrame) -> pd.Timestamp:
    latest_year = int(df["YEAR"].max())
    year_df = df[df["YEAR"] == latest_year]

    last_valid_month = None
    for month_num, month_col in MONTH_COLS.items():
        if not (year_df[month_col] == -999.0).any():
            last_valid_month = pd.Timestamp(
                year=latest_year, month=month_num, day=1
            )

    if last_valid_month is None:
        last_valid_month = pd.Timestamp(year=latest_year - 1, month=12, day=1)

    return last_valid_month


def parse_nasa_response(rows: dict, last_valid: pd.Timestamp, last_month: pd.Timestamp) -> dict:
    param_year_data = {}

    for parameter, month_values in rows.items():
        for period, value in month_values.items():
            year      = int(period[:4])
            month_num = int(period[4:])
            
            if month_num not in MONTH_COLS:
                continue

            month_col = MONTH_COLS[month_num]
            row_date  = pd.Timestamp(year=year, month=month_num, day=1)

            if row_date <= last_valid or row_date > last_month:
                continue

            key = (parameter, year)
            if key not in param_year_data:
                param_year_data[key] = {
                    "PARAMETER": parameter,
                    "YEAR":      year,
                    "JAN": -999.0, "FEB": -999.0, "MAR": -999.0,
                    "APR": -999.0, "MAY": -999.0, "JUN": -999.0,
                    "JUL": -999.0, "AUG": -999.0, "SEP": -999.0,
                    "OCT": -999.0, "NOV": -999.0, "DEC": -999.0,
                    "ANN": -999.0
                }

            param_year_data[key][month_col] = value

    return param_year_data


@step
def fetch_weather_data():
    last_month = datetime.now().replace(day=1) - relativedelta(months=1)

    for state, path in STATE_PATH_MAP.items():
        try:
            logging.info(f"Processing weather data for {state}...")

            header_lines, df = load_csv_with_header(path)

            last_valid = find_last_valid_month(df)
            logging.info(f"{state} — last valid month in CSV: {last_valid.strftime('%b %Y')}")

            capped_last_month = min(
                last_month,
                pd.Timestamp(year=NASA_POWER_MAX_YEAR, month=12, day=1)
            )

            if last_valid >= capped_last_month:
                logging.info(f"{state} — already up to date, skipping")
                continue

            start_year = last_valid.year
            end_year   = min(capped_last_month.year, NASA_POWER_MAX_YEAR)

            coordinate = COORDINATE_MAP[state]
            url = (
                f"https://power.larc.nasa.gov/api/temporal/monthly/point"
                f"?parameters={PARAMETERS}"
                f"&community=RE"
                f"&longitude={coordinate[1]}"
                f"&latitude={coordinate[0]}"
                f"&start={start_year}"
                f"&end={end_year}"
                f"&format=JSON"
            )

            response = requests.get(url=url, timeout=30)
            response.raise_for_status()

            rows = response.json().get("properties", {}).get("parameter", {})
            if not rows:
                logging.error(f"No data returned from NASA POWER for {state}")
                continue

            param_year_data = parse_nasa_response(rows, last_valid, capped_last_month)

            if not param_year_data:
                logging.info(f"{state} — no new data to append")
                continue

            new_df = pd.DataFrame(list(param_year_data.values()))

            updated_df = df.copy()

            for _, new_row in new_df.iterrows():
                mask = (
                    (updated_df["PARAMETER"] == new_row["PARAMETER"]) &
                    (updated_df["YEAR"] == new_row["YEAR"])
                )
                if mask.any():
                    for month_col in MONTH_COLS.values():
                        if new_row[month_col] != -999.0:
                            updated_df.loc[mask, month_col] = new_row[month_col]
                else:
                    updated_df = pd.concat(
                        [updated_df, pd.DataFrame([new_row])],
                        ignore_index=True
                    )

            with open(path, "w") as f:
                f.writelines(header_lines)

            updated_df.to_csv(path, mode="a", index=False)
            logging.info(f"{state} — weather CSV updated successfully")

        except Exception as e:
            logging.error(f"Error processing weather data for {state}: {e}")
            continue