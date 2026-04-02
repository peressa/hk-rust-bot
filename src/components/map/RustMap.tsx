"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const ImageOverlay = dynamic(
  () => import("react-leaflet").then((mod) => mod.ImageOverlay),
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

export default function RustMap({ 
  mapJpg, 
  mapSize = 4000, 
  markers = [] 
}: { 
  mapJpg?: string, 
  mapSize?: number, 
  markers?: any[] 
}) {
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setL(leaflet);
    });
  }, []);

  if (!L) return <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>Incializando motor de mapa...</div>;

  // Conversion logic: Rust coordinates to Leaflet LatLng
  // Rust uses 0 to mapSize for X and Y.
  // Leaflet uses [-1000, 1000] for simplicity in CRS.Simple or we can define a custom bounds.
  const bounds: any = [[0, 0], [1000, 1000]];
  
  const getPosition = (x: number, y: number) => {
    // Invert Y because Rust (0,0 is bottom left usually or centered) 
    // vs Leaflet (0,0 is top left)
    const lat = (y / mapSize) * 1000;
    const lng = (x / mapSize) * 1000;
    return [lat, lng];
  };

  const getIcon = (type: string) => {
    let color = "var(--primary)";
    if (type === "Player") color = "#22c55e";
    if (type === "Monument") color = "#eab308";

    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
  };

  return (
    <div style={{ height: '100%', width: '100%', background: '#0a0a0b' }}>
      <MapContainer 
        crs={L.CRS.Simple}
        bounds={bounds}
        center={[500, 500]}
        zoom={0} 
        style={{ height: "100%", width: "100%" }}
        attributionControl={false}
      >
        {mapJpg && (
          <ImageOverlay 
            url={`data:image/jpeg;base64,${mapJpg}`}
            bounds={bounds}
          />
        )}
        
        {markers.map((marker, i) => (
          <Marker 
            key={i} 
            position={getPosition(marker.x, marker.y)} 
            icon={getIcon(marker.type)}
          >
            <Popup>
              <div style={{ color: 'black' }}>
                <strong style={{ display: 'block', marginBottom: '0.25rem' }}>{marker.name || marker.type}</strong>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Pos: {Math.round(marker.x)}, {Math.round(marker.y)}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
