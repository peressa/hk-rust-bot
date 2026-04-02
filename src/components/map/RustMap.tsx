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

// RustPlus Marker Types
const MARKER_TYPES = {
  PLAYER: "Player",
  EXPLOSION: 2,
  VENDING: 3,
  CH47: 4,
  CARGO: 5,
  GENERIC: 6,
  HELI: 7
};

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

  const bounds: any = [[0, 0], [1000, 1000]];
  
  const getPosition = (x: number, y: number): [number, number] => {
    const lng = (x / mapSize) * 1000;
    const lat = (y / mapSize) * 1000; 
    return [lat, lng];
  };

  const getIcon = (type: any, name: string) => {
    let color = "var(--primary)";
    let iconHtml = "";
    let size = 12;

    if (type === MARKER_TYPES.PLAYER) {
      color = "#22c55e";
      iconHtml = `<div class="marker-player" style="background: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color}"></div>`;
      size = 14;
    } else if (type === MARKER_TYPES.HELI) {
      color = "#f97316";
      iconHtml = `<div class="marker-heli" style="display: flex; align-items: center; justify-content: center; position: relative;">
                    <div class="radar-pulse" style="position: absolute; width: 40px; height: 40px; background: rgba(249, 115, 22, 0.2); border-radius: 50%;"></div>
                    <div style="background: ${color}; width: 16px; height: 16px; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 8px; font-weight: 900; z-index: 2; border: 1px solid white;">H</div>
                  </div>`;
      size = 40;
    } else if (type === MARKER_TYPES.CARGO) {
      color = "#3b82f6";
      iconHtml = `<div class="marker-cargo" style="display: flex; align-items: center; justify-content: center;">
                    <div style="background: ${color}; width: 24px; height: 12px; border-radius: 4px; border: 2px solid white; box-shadow: 0 0 10px ${color}; display: flex; align-items: center; justify-content: center; color: white; font-size: 6px; font-weight: 900;">CARGO</div>
                  </div>`;
      size = 24;
    } else if (type === MARKER_TYPES.EXPLOSION) {
      color = "#ef4444";
      iconHtml = `<div class="marker-raid" style="display: flex; align-items: center; justify-content: center;">
                    <div class="raid-pulse" style="background: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>
                  </div>`;
      size = 20;
    } else if (type === MARKER_TYPES.VENDING) {
      color = "#eab308";
      iconHtml = `<div style="background: ${color}; width: 8px; height: 8px; border-radius: 2px; border: 1px solid white;"></div>`;
      size = 8;
    } else {
        // Fallback for monuments or others
        color = "#94a3b8";
        iconHtml = `<div style="background: ${color}; width: 10px; height: 10px; border-radius: 50%; border: 1px solid white;"></div>`;
        size = 10;
    }

    return L.divIcon({
      className: 'custom-div-icon',
      html: iconHtml,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
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
        <style>{`
          .radar-pulse { animation: pulse 2s infinite; }
          .raid-pulse { animation: raid-blink 0.5s infinite; }
          @keyframes pulse {
            0% { transform: scale(0.5); opacity: 0.8; }
            100% { transform: scale(2.5); opacity: 0; }
          }
          @keyframes raid-blink {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.5); }
            100% { opacity: 1; transform: scale(1); }
          }
          .custom-div-icon { background: none; border: none; }
        `}</style>

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
            icon={getIcon(marker.type || marker.id, marker.name)}
          >
            <Popup>
              <div style={{ color: 'black' }}>
                <strong style={{ display: 'block', marginBottom: '0.25rem' }}>{marker.name || `Tipo: ${marker.type}`}</strong>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Cuadrante: {marker.grid || 'N/A'}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
