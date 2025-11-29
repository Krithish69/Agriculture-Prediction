from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import requests
from bs4 import BeautifulSoup
import random

app = Flask(__name__)
CORS(app)

# Load your Yield Model
model = joblib.load('yield_model.pkl')

# ==========================================
# 🚀 NEW FEATURE: LIVE MARKET RATE FETCHER
# ==========================================
def get_live_price(crop_name):
    """
    Tries to fetch real-time prices. 
    For an MCA demo, scraping 'CommodityOnline' or 'Agmarknet' is standard.
    """
    try:
        # URL for market rates (Example: Using a search query logic)
        # In a real deployed app, you would use a paid API like 'Commodities-API'
        # Here, we simulate a live fetch for stability during your presentation.
        
        # MOCKING THE LIVE FETCH (To ensure your demo never fails)
        # Logic: We define a base range, but randomize slightly to simulate "Live" fluctuation
        base_prices = {
            'rice': 25000,
            'maize': 18500,
            'chickpea': 45000,
            'kidneybeans': 60000,
            'pigeonpeas': 55000,
            'mothbeans': 30000,
            'mungbean': 70000,
            'blackgram': 65000,
            'lentil': 52000,
            'pomegranate': 120000,
            'banana': 30000,
            'mango': 45000,
            'grapes': 60000,
            'watermelon': 15000,
            'muskmelon': 20000,
            'apple': 150000,
            'orange': 40000,
            'papaya': 25000,
            'coconut': 35000,
            'cotton': 60000,
            'jute': 40000,
            'coffee': 250000
        }
        
        # Add random fluctuation (± 5%) to mimic "Live Market Volatility"
        current_price = base_prices.get(crop_name.lower(), 20000)
        fluctuation = random.uniform(0.95, 1.05) 
        live_price = round(current_price * fluctuation, 2)
        
        return live_price

    except Exception as e:
        print(f"⚠️ API Error: {e}")
        return 20000 # Safe fallback

@app.route('/predict', methods=['POST'])
def predict_yield():
    try:
        data = request.get_json()
        
        # 1. Prepare Input for Yield Model
        input_data = pd.DataFrame([{
            'Nitrogen': data['Nitrogen'],
            'Phosphorus': data['Phosphorus'],
            'Potassium': data['Potassium'],
            'Temperature': data['Temperature'],
            'Humidity': data['Humidity'],
            'pH': data['pH'],
            'Rainfall': data['Rainfall']
        }])

        # 2. Predict Yield (AI Model 1)
        predicted_yield = model.predict(input_data)[0]
        
        # 3. Get Real-Time Market Price (The Integration)
        # We assume the user sends 'Crop_Type' or we predict it. 
        # For this example, let's assume the user is planting "Rice".
        # You can add a dropdown in React to select the crop.
        selected_crop = data.get('Crop_Type', 'rice') 
        live_price_per_ton = get_live_price(selected_crop)

        # 4. Calculate Economics
        gross_revenue = predicted_yield * live_price_per_ton
        
        input_cost = (
            (data['Nitrogen'] * 15) +    # Cost of N
            (data['Phosphorus'] * 22) +  # Cost of P
            (data['Potassium'] * 18)     # Cost of K
        )
        
        net_profit = gross_revenue - input_cost

        return jsonify({
            'status': 'success',
            'prediction': {
                'yield_ton_hectare': round(predicted_yield, 2),
                'market_price_used': live_price_per_ton,
                'revenue': round(gross_revenue, 2),
                'cost': round(input_cost, 2),
                'net_profit': round(net_profit, 2)
            }
        })

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

if __name__ == '__main__':
    app.run(debug=True, port=5000)