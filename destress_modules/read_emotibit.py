# read_emotibit.py
import numpy as np
from tensorflow.keras.models import load_model
import joblib
import pandas as pd
import time

# Load trained model and scaler
model = load_model('stress_model.h5')
scaler = joblib.load('scaler.pkl')

def get_stress_level():
    try:
        # Read latest row from Emotibit CSV (or serial stream)
        data = pd.read_csv("emotibit_live.csv")
        latest = data.iloc[-1]

        eda = latest['EDA']
        hr = latest['HR']
        hrv = latest['HRV']
        temp = latest['TEMP']

        # Prepare input
        X = np.array([[eda, hr, hrv, temp]])
        X_scaled = scaler.transform(X)
        stress_level = model.predict(X_scaled)[0][0]

        # Clip to 1–10
        stress_level = np.clip(stress_level, 1, 10)
        return round(float(stress_level), 1)
    
    except Exception as e:
        print(f"Error reading data: {e}")
        return 5.0  # default medium stress
