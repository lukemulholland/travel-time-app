import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [origin, setOrigin] = useState('');
  const [destInput, setDestInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  // Load destinations from localStorage on startup
  const [destinations, setDestinations] = useState(() => {
    try {
      const saved = localStorage.getItem('destinations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }); // [{ address, label }]
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Add destination address with label
  const addDestination = () => {
    const address = destInput.trim();
    const label = labelInput.trim();
    if (address && label && !destinations.some(d => d.address === address && d.label === label)) {
      setDestinations(prev => [...prev, { address, label }]);
      setDestInput('');
      setLabelInput('');
    }
  };

  // Remove destination
  const removeDestination = (idx) => {
    setDestinations(prev => prev.filter((_, i) => i !== idx));
  };

  // Save destinations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('destinations', JSON.stringify(destinations));
  }, [destinations]);

  // Submit origin and calculate travel times
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResults(null);
    if (!origin.trim() || destinations.length === 0) {
      setError('Please enter an origin and at least one destination.');
      return;
    }
    setLoading(true);
    try {
      const resp = await axios.post('/api/travel-times', {
        origin,
        destinations: destinations.map(d => d.address)
      });
      if (resp.data.error) {
        setError(resp.data.error);
        setResults(null);
      } else if (!resp.data.results || !Array.isArray(resp.data.results)) {
        setError('Unexpected server response.');
        setResults(null);
      } else {
        setResults(resp.data.results); // results is now an array of { destination, driving: {...}, transit: {...} }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch travel times.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h2>Travel Time Calculator</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="origin-input"><b>Enter your starting address:</b></label>
        <input
          id="origin-input"
          type="text"
          value={origin}
          onChange={e => setOrigin(e.target.value)}
          placeholder="e.g. 123 Main St, City"
        />
        <div className="destinations-list">
          <label><b>Destination Addresses:</b></label>
          {destinations.map((dest, idx) => (
            <div key={idx} className="destination-item">
              <span><b>{dest.label}</b>: {dest.address}</span>
              <button type="button" onClick={() => removeDestination(idx)}>Remove</button>
            </div>
          ))}
          <div style={{ display: 'flex', marginTop: 8, gap: 8 }}>
            <input
              type="text"
              value={labelInput}
              onChange={e => setLabelInput(e.target.value)}
              placeholder="Label (e.g. Home)"
              style={{ flex: 1 }}
            />
            <input
              type="text"
              value={destInput}
              onChange={e => setDestInput(e.target.value)}
              placeholder="Add destination address"
              style={{ flex: 2 }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDestination(); } }}
            />
            <button type="button" onClick={addDestination}>Add</button>
          </div>
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', marginTop: 16 }}>
          {loading ? 'Calculating...' : 'Calculate Travel Times'}
        </button>
      </form>
      {error && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
      {results && (
        <table className="results-table">
          <thead>
            <tr>
              <th rowSpan={2}>Destination</th>
              <th colSpan={2}>By Car</th>
              <th colSpan={2}>By Public Transport</th>
            </tr>
            <tr>
              <th>Time</th>
              <th>Distance</th>
              <th>Time</th>
              <th>Distance</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row, idx) => (
              <tr key={idx}>
                <td>{destinations[idx]?.label || row.destination}</td>
                <td>{row.driving?.duration ?? 'N/A'}</td>
                <td>{row.driving?.distance ?? 'N/A'}</td>
                <td>{row.transit?.duration ?? 'N/A'}</td>
                <td>{row.transit?.distance ?? 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
