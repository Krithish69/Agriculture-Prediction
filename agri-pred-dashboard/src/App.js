import React, { useState } from 'react';
import './App.css';

function App() {
  // State for form inputs
  const [formData, setFormData] = useState({
    Nitrogen: 50, Phosphorus: 50, Potassium: 50,
    Temperature: 26, Humidity: 80, pH: 6.5, Rainfall: 200
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: parseFloat(e.target.value) });
  };

  // Submit to Flask API
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setResult(data.prediction);
      } else {
        setError('Error processing data.');
      }
    } catch (err) {
      setError('Failed to connect to server. Is Flask running?');
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <header className="navbar">
        <h1>🌾 Smart Soil Analytics & Yield Forecaster</h1>
      </header>

      <div className="main-content">
        
        {/* --- LEFT PANEL: INPUT FORM --- */}
        <div className="card input-section">
          <h2>🌱 Soil Parameters</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid-container">
              <label>Nitrogen (N)
                <input type="number" name="Nitrogen" value={formData.Nitrogen} onChange={handleChange} required />
              </label>
              <label>Phosphorus (P)
                <input type="number" name="Phosphorus" value={formData.Phosphorus} onChange={handleChange} required />
              </label>
              <label>Potassium (K)
                <input type="number" name="Potassium" value={formData.Potassium} onChange={handleChange} required />
              </label>
              <label>Temperature (°C)
                <input type="number" name="Temperature" value={formData.Temperature} onChange={handleChange} required />
              </label>
              <label>Humidity (%)
                <input type="number" name="Humidity" value={formData.Humidity} onChange={handleChange} required />
              </label>
              <label>pH Level
                <input type="number" step="0.1" name="pH" value={formData.pH} onChange={handleChange} required />
              </label>
              <label>Rainfall (mm)
                <input type="number" name="Rainfall" value={formData.Rainfall} onChange={handleChange} required />
              </label>
            </div>
            <button type="submit" className="analyze-btn" disabled={loading}>
              {loading ? 'Analyzing Soil...' : 'Predict Yield & Profit'}
            </button>
          </form>
          {error && <p className="error-msg">{error}</p>}
        </div>

        {/* --- RIGHT PANEL: RESULTS --- */}
        <div className="card result-section">
          {!result ? (
            <div className="placeholder">
              <h3>Ready to Analyze</h3>
              <p>Enter soil details to generate an AI-driven cost-benefit report.</p>
            </div>
          ) : (
            <div className="report fade-in">
              <h2>📊 Analysis Report</h2>
              
              <div className="highlight-box">
                <span className="label">Predicted Yield</span>
                <span className="value">{result.yield_ton_hectare} <small>Tons/Ha</small></span>
              </div>

              <div className="financial-breakdown">
                <div className="money-item revenue">
                  <span>Est. Revenue</span>
                  <strong>₹{result.revenue.toLocaleString()}</strong>
                </div>
                <div className="money-item cost">
                  <span>Input Cost</span>
                  <strong>₹{result.cost.toLocaleString()}</strong>
                </div>
              </div>

              <div className={`profit-box ${result.net_profit > 0 ? 'profit' : 'loss'}`}>
                <span>NET PROFIT PROJECTION</span>
                <h1>₹{result.net_profit.toLocaleString()}</h1>
                <p>{result.net_profit > 0 ? "✅ Sustainable Farming" : "⚠️ High Risk Warning"}</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;