import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Default marker icon fix for leaflet in React
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = new L.Icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = defaultIcon;

// Geocoding function using Nominatim (OpenStreetMap)
async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  const resp = await fetch(url);
  const data = await resp.json();
  if (data && data.length > 0) {
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon)
    };
  }
  return null;
}

export default function MapView({ origin, destinations }) {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchCoords() {
      setLoading(true);
      const all = [];
      if (origin) {
        const o = await geocode(origin);
        if (o) all.push({ ...o, label: 'Origin', address: origin });
      }
      for (const dest of destinations) {
        const d = await geocode(dest.address);
        if (d) all.push({ ...d, label: dest.label, address: dest.address });
      }
      if (isMounted) setMarkers(all);
      setLoading(false);
    }
    fetchCoords();
    return () => { isMounted = false; };
  }, [origin, destinations]);

  // Center map on first marker or default location
  const center = markers.length > 0 ? [markers[0].lat, markers[0].lon] : [-33.8688, 151.2093]; // Sydney default

  return (
    <div style={{ height: 400, margin: '20px 0' }}>
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m, idx) => (
          <Marker key={idx} position={[m.lat, m.lon]} icon={defaultIcon}>
            <Popup>
              <b>{m.label}</b><br />{m.address}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {loading && <div>Loading map...</div>}
    </div>
  );
}
