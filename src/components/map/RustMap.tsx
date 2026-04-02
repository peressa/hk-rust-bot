"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

export default function RustMap({ markers = [] }: { markers?: any[] }) {
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setL(leaflet);
    });
  }, []);

  if (!L) return <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>Cargando mapa...</div>;

  const customIcon = L.icon({
    iconUrl: '/logo.png', // Or a custom marker icon
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  return (
    <div style={{ height: '600px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
      <MapContainer 
        center={[0, 0]} 
        zoom={2} 
        style={{ height: "100%", width: "100%", background: '#0a0a0b' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://stamen-tiles-{s}.a.bestyk.ru/toner/{z}/{x}/{y}{r}.png" // Placeholder or Rust official tiles if available
        />
        {markers.map((marker, i) => (
          <Marker key={i} position={marker.pos} icon={customIcon}>
            <Popup>
              <div style={{ color: 'black' }}>
                <strong>{marker.name}</strong><br />
                {marker.description}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
