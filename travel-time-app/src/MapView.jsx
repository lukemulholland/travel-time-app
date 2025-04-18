import React, { useEffect, useState } from 'react';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';

// Geocoding function using Google Maps Geocoding API
async function geocode(address, apiKey) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const resp = await fetch(url);
  const data = await resp.json();
  if (data && data.results && data.results.length > 0) {
    return {
      lat: data.results[0].geometry.location.lat,
      lon: data.results[0].geometry.location.lng
    };
  }
  return null;
}

export default function MapView({ origin, destinations }) {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: []
  });

  useEffect(() => {
    let isMounted = true;
    async function fetchCoords() {
      setLoading(true);
      const all = [];
      if (origin) {
        const o = await geocode(origin, apiKey);
        if (o) all.push({ ...o, label: 'Origin', address: origin });
      }
      for (const dest of destinations) {
        const d = await geocode(dest.address, apiKey);
        if (d) all.push({ ...d, label: dest.label, address: dest.address });
      }
      if (isMounted) setMarkers(all);
      setLoading(false);
    }
    if (apiKey) fetchCoords();
    return () => { isMounted = false; };
  }, [origin, destinations, apiKey]);

  // Center map on first marker or default location
  const center = markers.length > 0 ? { lat: markers[0].lat, lng: markers[0].lon } : { lat: -33.8688, lng: 151.2093 }; // Sydney default

  if (loadError) return <div>Failed to load Google Maps</div>;
  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <div style={{ height: 400, margin: '20px 0' }}>
      <GoogleMap
        mapContainerStyle={{ height: '100%', width: '100%' }}
        center={center}
        zoom={12}
      >
        {markers.map((m, idx) => (
          <MarkerF
            key={idx}
            position={{ lat: m.lat, lng: m.lon }}
            label={m.label}
          />
        ))}
      </GoogleMap>
      {loading && <div>Loading map...</div>}
    </div>
  );
}

