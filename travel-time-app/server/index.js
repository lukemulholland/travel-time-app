// Express backend to proxy travel time API requests
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config({ path: __dirname + '/.env' });
console.log('MAPS_API_KEY:', process.env.MAPS_API_KEY);

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// POST /api/travel-times
// Body: { origin: string, destinations: string[] }
app.post('/api/travel-times', async (req, res) => {
  const { origin, destinations } = req.body;
  const apiKey = process.env.MAPS_API_KEY;
  console.log('MAPS_API_KEY in handler:', apiKey);
  if (!apiKey) return res.status(500).json({ error: 'API key not set' });
  if (!origin || !destinations || !Array.isArray(destinations)) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    // Google Maps Distance Matrix API for driving
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json`;
    const paramsDriving = {
      origins: origin,
      destinations: destinations.join('|'),
      mode: 'driving',
      key: apiKey
    };
    const paramsTransit = {
      ...paramsDriving,
      mode: 'transit',
    };

    // Run both requests in parallel
    const [drivingRes, transitRes] = await Promise.all([
      axios.get(url, { params: paramsDriving }),
      axios.get(url, { params: paramsTransit })
    ]);
    const drivingData = drivingRes.data;
    const transitData = transitRes.data;
    console.log('Driving API response:', JSON.stringify(drivingData, null, 2));
    console.log('Transit API response:', JSON.stringify(transitData, null, 2));

    if (drivingData.status !== 'OK') {
      return res.status(500).json({ error: drivingData.error_message || 'Driving API error' });
    }
    if (transitData.status !== 'OK') {
      return res.status(500).json({ error: transitData.error_message || 'Transit API error' });
    }

    const results = destinations.map((dest, i) => {
      const driveEl = drivingData.rows[0].elements[i];
      const transitEl = transitData.rows[0].elements[i];
      return {
        destination: dest,
        driving: {
          duration: driveEl.status === 'OK' ? driveEl.duration.text : 'N/A',
          distance: driveEl.status === 'OK' ? driveEl.distance.text : 'N/A',
          status: driveEl.status
        },
        transit: {
          duration: transitEl.status === 'OK' ? transitEl.duration.text : 'N/A',
          distance: transitEl.status === 'OK' ? transitEl.distance.text : 'N/A',
          status: transitEl.status
        }
      };
    });
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
