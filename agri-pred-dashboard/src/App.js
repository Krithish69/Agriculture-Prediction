import React, { useState } from 'react';

function App() {
  // --- STATE MANAGEMENT ---
  const [formData, setFormData] = useState({
    Nitrogen: 50, Phosphorus: 50, Potassium: 50,
    Temperature: 26, Humidity: 80, pH: 6.5, Rainfall: 200,
    Crop_Type: 'rice' // Default crop
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState(''); 
  const [locationName, setLocationName] = useState(''); // Stores the city/state name
  const [error, setError] = useState('');

  // --- HANDLERS ---

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Logic to get GPS + Weather + Location Name
  const handleLocationClick = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser.");
      return;
    }

    setLocationStatus("Locating...");
    setLocationName(""); // Reset previous location name

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLocationStatus("Fetching weather & location details...");

        try {
          // 1. Fetch Weather Data (Open-Meteo)
          const weatherPromise = fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,rain&timezone=auto`);
          
          // 2. Fetch Location Name (BigDataCloud - Free Reverse Geocoding)
          const locationPromise = fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);

          // Execute both requests in parallel
          const [weatherRes, locationRes] = await Promise.all([weatherPromise, locationPromise]);
          const weatherData = await weatherRes.json();
          const locationData = await locationRes.json();

          // Update Form with Weather
          if (weatherData.current) {
            setFormData(prev => ({
              ...prev,
              Temperature: weatherData.current.temperature_2m,
              Humidity: weatherData.current.relative_humidity_2m,
              // Only update rain if it's actually raining, otherwise keep manual/default
              Rainfall: weatherData.current.rain > 0 ? weatherData.current.rain : prev.Rainfall 
            }));
          }

          // Update Location Name
          // API returns fields like: locality, city, principalSubdivision, countryName
          const city = locationData.locality || locationData.city || "";
          const state = locationData.principalSubdivision || "";
          const country = locationData.countryName || "";
          
          // Format: "Ghaziabad, Uttar Pradesh, India"
          const formattedLocation = [city, state, country].filter(Boolean).join(', ');
          setLocationName(formattedLocation);
          
          setLocationStatus("✅ Data updated successfully!");

        } catch (error) {
          console.error("Fetch failed:", error);
          setLocationStatus("Failed to fetch data.");
        }
        
        // Hide status message after 3 seconds
        setTimeout(() => setLocationStatus(''), 3000);
      },
      (error) => {
        setLocationStatus("Unable to retrieve location. Please allow permissions.");
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const payload = {
        ...formData,
        Nitrogen: parseFloat(formData.Nitrogen),
        Phosphorus: parseFloat(formData.Phosphorus),
        Potassium: parseFloat(formData.Potassium),
        Temperature: parseFloat(formData.Temperature),
        Humidity: parseFloat(formData.Humidity),
        pH: parseFloat(formData.pH),
        Rainfall: parseFloat(formData.Rainfall),
      };

      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
              
              <label className="full-width">Crop to Plant
                <select name="Crop_Type" value={formData.Crop_Type} onChange={handleChange} className="dropdown">
                  <option value="rice">Rice</option>
                  <option value="maize">Maize</option>
                  <option value="chickpea">Chickpea</option>
                  <option value="kidneybeans">Kidney Beans</option>
                  <option value="pigeonpeas">Pigeon Peas</option>
                  <option value="mothbeans">Moth Beans</option>
                  <option value="mungbean">Mung Bean</option>
                  <option value="blackgram">Black Gram</option>
                  <option value="lentil">Lentil</option>
                  <option value="pomegranate">Pomegranate</option>
                  <option value="banana">Banana</option>
                  <option value="mango">Mango</option>
                  <option value="grapes">Grapes</option>
                  <option value="watermelon">Watermelon</option>
                  <option value="muskmelon">Muskmelon</option>
                  <option value="apple">Apple</option>
                  <option value="orange">Orange</option>
                  <option value="papaya">Papaya</option>
                  <option value="coconut">Coconut</option>
                  <option value="cotton">Cotton</option>
                  <option value="jute">Jute</option>
                  <option value="coffee">Coffee</option>
                </select>
              </label>

              {/* LOCATION BUTTON SECTION */}
              <div className="location-wrapper full-width">
                <button type="button" className="location-btn" onClick={handleLocationClick}>
                  <span>📍</span> Auto-Detect Weather
                </button>
                
                {/* Status Message (e.g., "Fetching...") */}
                {locationStatus && <p className="status-msg">{locationStatus}</p>}
                
                {/* Verified Location Name (e.g., "Ghaziabad, Uttar Pradesh") */}
                {locationName && (
                  <div className="location-verified">
                    <small>Verified Location:</small>
                    <strong>{locationName}</strong>
                  </div>
                )}
              </div>

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
              <label>Rainfall (mm)
                <input type="number" name="Rainfall" value={formData.Rainfall} onChange={handleChange} required />
              </label>
              
              <label>pH Level
                <input type="number" step="0.1" name="pH" value={formData.pH} onChange={handleChange} required />
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
              <p>Select a crop and enter soil details to generate an AI-driven cost-benefit report.</p>
            </div>
          ) : (
            <div className="report fade-in">
              <h2>📊 Analysis Report</h2>
              
              <div className="highlight-box">
                <span className="label">Predicted Yield</span>
                <span className="value">{result.yield_ton_hectare} <small>Tons/Ha</small></span>
              </div>

              <div className="financial-breakdown">
                <div className="money-item">
                  <span>Market Rate (Live)</span>
                  <strong>₹{result.market_price_used.toLocaleString()} <small>/ton</small></strong>
                </div>
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