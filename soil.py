import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score

# ==========================================
# STEP 1: CREATE MOCK DATA (Simulating a CSV)
# ==========================================
# In your real research, you will replace this with: df = pd.read_csv('soil_data.csv')

def generate_mock_data(n_samples=1000):
    np.random.seed(42) # For reproducibility
    data = {
        'Nitrogen': np.random.randint(0, 140, n_samples),
        'Phosphorus': np.random.randint(5, 145, n_samples),
        'Potassium': np.random.randint(15, 205, n_samples),
        'Temperature': np.random.uniform(8.8, 43.6, n_samples),
        'Humidity': np.random.uniform(14.2, 99.9, n_samples),
        'pH': np.random.uniform(3.5, 9.9, n_samples),
        'Rainfall': np.random.uniform(20.2, 298.5, n_samples)
    }
    
    # Simulate Yield based on a fake biological formula (Logic: Balanced nutrients = higher yield)
    # We add some 'noise' (+ np.random...) because real life isn't perfect
    df = pd.DataFrame(data)
    df['Yield_Ton_Per_Hectare'] = (
        0.05 * df['Nitrogen'] + 
        0.04 * df['Phosphorus'] + 
        0.02 * df['Potassium'] - 
        0.5 * abs(df['pH'] - 6.5) + # Penalty if pH is far from neutral
        np.random.normal(0, 0.5, n_samples) # Random noise
    )
    # Ensure yield isn't negative
    df['Yield_Ton_Per_Hectare'] = df['Yield_Ton_Per_Hectare'].apply(lambda x: max(0, x))
    
    return df

# Load the data
print("🌱 Generating Mock Dataset...")
df = generate_mock_data()
print(f"Data Loaded: {df.shape[0]} rows.")

# ==========================================
# STEP 2: PREPROCESSING & TRAINING
# ==========================================

# Features (X) and Target (y)
X = df[['Nitrogen', 'Phosphorus', 'Potassium', 'Temperature', 'Humidity', 'pH', 'Rainfall']]
y = df['Yield_Ton_Per_Hectare']

# Split Data (80% Training, 20% Testing)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Initialize and Train Model
print("\n🤖 Training Random Forest Model...")
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Evaluate
predictions = model.predict(X_test)
print(f"Model Accuracy (R2 Score): {r2_score(y_test, predictions):.2f}")
print(f"Prediction Error (RMSE): {np.sqrt(mean_squared_error(y_test, predictions)):.2f} tons")

# ==========================================
# STEP 3: THE "NOVELTY" ENGINE (Cost-Benefit)
# ==========================================

def analyze_profitability(soil_sample, crop_market_price, fertilizer_cost_per_unit):
    """
    Takes a single soil sample, predicts yield, and calculates profit.
    """
    # 1. Predict Yield
    sample_df = pd.DataFrame([soil_sample]) # Convert dict to DF
    predicted_yield = model.predict(sample_df)[0]
    
    # 2. Calculate Economics
    # Revenue = Yield * Market Price of Crop
    gross_revenue = predicted_yield * crop_market_price
    
    # Input Cost = Cost of nutrients currently in soil (Simplified for demo)
    # In a full thesis, this would be: Cost of *added* fertilizer to reach this state
    input_cost = (
        (soil_sample['Nitrogen'] * fertilizer_cost_per_unit['N']) +
        (soil_sample['Phosphorus'] * fertilizer_cost_per_unit['P']) +
        (soil_sample['Potassium'] * fertilizer_cost_per_unit['K'])
    )
    
    net_profit = gross_revenue - input_cost
    
    return predicted_yield, gross_revenue, input_cost, net_profit

# ==========================================
# STEP 4: DEMONSTRATION (User Scenario)
# ==========================================

print("\n--- 💰 SIMULATION: Farmer's Profit Analysis ---")

# Current Market Rates (Example: INR)
market_price_rice = 25000  # Price per Ton
fert_costs = {'N': 15, 'P': 22, 'K': 18} # Price per unit of nutrient

# A New Soil Sample from a farmer
new_farmer_soil = {
    'Nitrogen': 90,
    'Phosphorus': 42,
    'Potassium': 43,
    'Temperature': 28,
    'Humidity': 82,
    'pH': 6.5,          # Ideal pH
    'Rainfall': 200
}

pred_yield, revenue, cost, profit = analyze_profitability(new_farmer_soil, market_price_rice, fert_costs)

print(f"Input Soil Data: {new_farmer_soil}")
print(f"-"*30)
print(f"🔮 Predicted Yield: {pred_yield:.2f} Tons/Hectare")
print(f"💵 Est. Gross Revenue: ₹{revenue:,.2f}")
print(f"📉 Est. Input Cost:    ₹{cost:,.2f}")
print(f"📈 NET PROFIT:        ₹{profit:,.2f}")

if profit > 100000:
    print("✅ Recommendation: Highly Profitable! Proceed with planting.")
else:
    print("⚠️ Recommendation: Profit is low. Consider adjusting fertilizers.")


import joblib

# ... (Previous training code from Step 2) ...

# Save the trained model to a file
joblib.dump(model, 'yield_model.pkl')
print("✅ Model saved successfully as 'yield_model.pkl'!")