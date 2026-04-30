# Wind Energy Forecasting Platform

A research-grade, end-to-end machine learning system for forecasting **monthly wind energy generation** across the top 10 wind-producing U.S. states. This project combines MLOps practices, traditional ML models, and a fine-tuned time series foundation model to analyze how historical data impacts forecasting performance.

---

## Overview

This platform predicts wind energy generation (in MWh) using:

- Historical energy production data  
- Weather parameters  
- Time-series modeling techniques  

It is designed with a modular pipeline that can be retrained on other regions (e.g., India) when high-quality data becomes available.

---

## Motivation

India was the initial target due to its growing wind energy sector. However:

- No **clean, standardized monthly state-level datasets** are publicly available  
- Lack of **historically deep time series** limits model training  

In contrast, U.S. data from EIA provides:

- Decades of consistent monthly records  
- Reliable structure for ML training and evaluation  

The system is built to be **data-source agnostic**, making it easy to adapt once better datasets are available.

---

## Architecture

### Backend & Infrastructure

- **Flask REST API** – Serves predictions  
- **Supabase (PostgreSQL)** – Stores processed data  
- **ZenML** – Orchestrates ML pipelines  
- **MLflow (via DagShub)** – Experiment tracking  

### Data Sources

- **EIA (U.S. Energy Information Administration)** – Monthly energy generation  
- **NASA POWER** – Weather features (wind speed, temperature, etc.)

---

## Models

### Traditional ML Models

Trained on engineered tabular features:

- XGBoost  
- LightGBM  
- CatBoost  
- ElasticNet  

**Features include:**

- Weather parameters  
- Lag features  
- One-hot encoded state labels  

---

### Foundation Model: Chronos-2

Fine-tuned on raw time series (MWh values).

#### Experiment Setup

Five variants trained using different historical cutoffs:

- 2016  
- 2018  
- 2020  
- 2022  
- 2023  

#### Key Result

- **Chronos-2022 achieved best performance**  
- **MAPE: 8.5%**

---

## Key Insight

More data ≠ better performance.

The **2023 model underperformed** due to:

- Short-term anomalies (policy shifts, extreme weather)  
- Overfitting to recent irregularities  

The **2022 cutoff** provided:

- Sufficient seasonal cycles  
- Better generalization  
- Reduced recency bias  

> Optimal performance comes from balancing historical depth with signal quality, not simply maximizing data volume.

---

## Features

- End-to-end ML pipeline with reproducibility  
- Model comparison and experiment tracking  
- REST API for real-time predictions  
- Modular design for easy dataset replacement  
- Research-driven evaluation of data sufficiency  

---

## Live Demo

- Live App: https://lnkd.in/gynJgDHp  

---

## Repository

- GitHub: https://lnkd.in/gRc7nerr  

---

## Future Work

- Extend to Indian wind energy forecasting when data improves  
- Incorporate deep learning architectures (e.g., Transformers, LSTMs)  
- Add probabilistic forecasting (uncertainty estimation)  
- Improve feature engineering with spatial correlations  

---