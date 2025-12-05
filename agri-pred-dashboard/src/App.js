import React, { useState } from "react";
import "./App.css";

function App() {
  const [formData, setFormData] = useState({
    Nitrogen: 50,
    Phosphorus: 50,
    Potassium: 50,
    Temperature: 26,
    Humidity: 80,
    pH: 6.5,
    Rainfall: 200,
    Input_Cost: 0,
    Crop_Type: "rice", 
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [locationName, setLocationName] = useState(""); 
  const [error, setError] = useState("");


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocationClick = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser.");
      return;
    }

    setLocationStatus("Locating...");
    setLocationName(""); 

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLocationStatus("Fetching weather & location details...");

        try {
          const weatherPromise = fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,rain&timezone=auto`
          );

          const locationPromise = fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
          );
          const [weatherRes, locationRes] = await Promise.all([
            weatherPromise,
            locationPromise,
          ]);
          const weatherData = await weatherRes.json();
          const locationData = await locationRes.json();

          if (weatherData.current) {
            setFormData((prev) => ({
              ...prev,
              Temperature: weatherData.current.temperature_2m,
              Humidity: weatherData.current.relative_humidity_2m,
              Rainfall:
                weatherData.current.rain > 0
                  ? weatherData.current.rain
                  : prev.Rainfall,
            }));
          }

          const city = locationData.locality || locationData.city || "";
          const state = locationData.principalSubdivision || "";
          const country = locationData.countryName || "";

          const formattedLocation = [city, state, country]
            .filter(Boolean)
            .join(", ");
          setLocationName(formattedLocation);

          setLocationStatus("✅ Data updated successfully!");
        } catch (error) {
          console.error("Fetch failed:", error);
          setLocationStatus("Failed to fetch data.");
        }

        setTimeout(() => setLocationStatus(""), 3000);
      },
      (error) => {
        setLocationStatus(
          "Unable to retrieve location. Please allow permissions."
        );
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
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
        Input_Cost: parseFloat(formData.Input_Cost) || 0,
      };

      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.status === "success") {
        const serverResult = data.prediction || {};
        const userCost = parseFloat(formData.Input_Cost) || 0;

        if (userCost > 0) {
          const yieldTon = parseFloat(serverResult.yield_ton_hectare) || 0;
          const marketPrice = parseFloat(serverResult.market_price_used) || 0;
          const revenue = Math.round(yieldTon * marketPrice * 100) / 100;
          const modified = {
            ...serverResult,
            cost: userCost,
            revenue: revenue,
            net_profit: Math.round((revenue - userCost) * 100) / 100,
          };
          setResult(modified);
        } else {
          setResult(serverResult);
        }
      } else {
        setError("Error processing data.");
      }
    } catch (err) {
      setError("Failed to connect to server. Is Flask running?");
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <header className="navbar">
        <h1>🌾 Smart Soil Analytics & Yield Forecaster</h1>
      </header>

      <div className="main-content">
        <div className="card input-section">
          <h2>🌱 Soil Parameters</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid-container">
              <label className="full-width">
                Crop to Plant
                <select
                  name="Crop_Type"
                  value={formData.Crop_Type}
                  onChange={handleChange}
                  className="dropdown"
                >
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

              <div className="location-wrapper full-width">
                <button
                  type="button"
                  className="location-btn"
                  onClick={handleLocationClick}
                >
                  <span>📍</span> Auto-Detect Weather
                </button>

                {locationStatus && (
                  <p className="status-msg">{locationStatus}</p>
                )}

                {locationName && (
                  <div className="location-verified">
                    <small>Verified Location:</small>
                    <strong>{locationName}</strong>
                  </div>
                )}
              </div>

              <label>
                Nitrogen (N)
                <input
                  type="number"
                  name="Nitrogen"
                  value={formData.Nitrogen}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Phosphorus (P)
                <input
                  type="number"
                  name="Phosphorus"
                  value={formData.Phosphorus}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Potassium (K)
                <input
                  type="number"
                  name="Potassium"
                  value={formData.Potassium}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Temperature (°C)
                <input
                  type="number"
                  name="Temperature"
                  value={formData.Temperature}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Humidity (%)
                <input
                  type="number"
                  name="Humidity"
                  value={formData.Humidity}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Rainfall (mm)
                <input
                  type="number"
                  name="Rainfall"
                  value={formData.Rainfall}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Input Cost (₹)
                <input
                  type="number"
                  step="0.01"
                  name="Input_Cost"
                  value={formData.Input_Cost}
                  onChange={handleChange}
                  placeholder="Enter your total input cost"
                />
              </label>

              <label>
                pH Level
                <input
                  type="number"
                  step="0.1"
                  name="pH"
                  value={formData.pH}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <button type="submit" className="analyze-btn" disabled={loading}>
              {loading ? "Analyzing Soil..." : "Predict Yield & Profit"}
            </button>
          </form>
          {error && <p className="error-msg">{error}</p>}
        </div>
        
        <div className="card result-section">
          {!result ? (
            <div className="placeholder">
              <h3>Ready to Analyze</h3>
              <p>
                Select a crop and enter soil details to generate an AI-driven
                cost-benefit report.
              </p>
            </div>
          ) : (
            <div className="report fade-in">
              <h2>📊 Analysis Report</h2>

              <div className="highlight-box">
                <span className="label">Predicted Yield</span>
                <span className="value">
                  {result.yield_ton_hectare} <small>Tons/Ha</small>
                </span>
              </div>

              <div className="financial-breakdown">
                <div className="money-item">
                  <span>Market Rate (Live)</span>
                  <strong>
                    ₹{result.market_price_used.toLocaleString()}{" "}
                    <small>/ton</small>
                  </strong>
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

              <div
                className={`profit-box ${
                  result.net_profit > 0 ? "profit" : "loss"
                }`}
              >
                <span>NET PROFIT PROJECTION</span>
                <h1>₹{result.net_profit.toLocaleString()}</h1>
                <p>
                  {result.net_profit > 0
                    ? "✅ Sustainable Farming"
                    : "⚠️ High Risk Warning"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
