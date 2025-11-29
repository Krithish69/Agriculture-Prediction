from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np

app = Flask(__name__)
# Enable CORS so your React frontend (port 3000) can talk to this Flask backend (port 5000)
CORS(app)

# 1. Load the saved model
print("⏳ Loading model...")
model = joblib.load('yield_model.pkl')
print("✅ Model loaded!")

# Market Data (In a real app, this would come from a Database or Live API)
MARKET_PRICES = {
    'crop_price_per_ton': 25000,   # e.g., Rice
    'fertilizer_cost': {'N': 15, 'P': 22, 'K': 18} # Cost per kg
}

@app.route('/predict', methods=['POST'])
def predict_yield():
    try:
        # Get JSON data from the frontend (React)
        data = request.get_json()
        
        # Extract features
        # We create a DataFrame because the model expects feature names
        input_data = pd.DataFrame([{
            'Nitrogen': data['Nitrogen'],
            'Phosphorus': data['Phosphorus'],
            'Potassium': data['Potassium'],
            'Temperature': data['Temperature'],
            'Humidity': data['Humidity'],
            'pH': data['pH'],
            'Rainfall': data['Rainfall']
        }])

        # 1. Make Prediction
        predicted_yield = model.predict(input_data)[0]

        # 2. Calculate Economics (Your "Novelty" Logic)
        revenue = predicted_yield * MARKET_PRICES['crop_price_per_ton']
        
        input_cost = (
            (data['Nitrogen'] * MARKET_PRICES['fertilizer_cost']['N']) +
            (data['Phosphorus'] * MARKET_PRICES['fertilizer_cost']['P']) +
            (data['Potassium'] * MARKET_PRICES['fertilizer_cost']['K'])
        )
        
        profit = revenue - input_cost

        # 3. Return JSON response
        return jsonify({
            'status': 'success',
            'prediction': {
                'yield_ton_hectare': round(predicted_yield, 2),
                'revenue': round(revenue, 2),
                'cost': round(input_cost, 2),
                'net_profit': round(profit, 2)
            }
        })

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

if __name__ == '__main__':
    app.run(debug=True, port=5000)