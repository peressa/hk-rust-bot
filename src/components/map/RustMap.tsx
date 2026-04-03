"use client";

import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, ImageOverlay, Marker, Popup, Polyline } from "react-leaflet";

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

interface RustMapProps {
  mapJpg?: string;
  mapSize?: number;
  markers?: any[];
}

export default function RustMap({ 
  mapJpg, 
  mapSize = 4000, 
  markers = [] 
}: RustMapProps) {
  const [L, setL] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const GRID_SIZE = 146.3; // Constante de Rust para cuadrículas de mapa

  useEffect(() => {
    // Import Leaflet CSS and JS on the client side
    import("leaflet").then((leaflet) => {
      import("leaflet/dist/leaflet.css");
      setL(leaflet);
      setMounted(true);
    });
  }, []);

  // Use useMemo for bounds to prevent re-renders of MapContainer
  const bounds: any = useMemo(() => [[0, 0], [1000, 1000]], []);
  
  if (!mounted || !L) {
    return (
      <div style={{ 
        height: '100%', 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#0a0a0b',
        color: 'var(--text-muted)',
        gap: '1rem'
      }}>
        <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
        <span>Incializando motor de mapa...</span>
      </div>
    );
  }

  const getPosition = (x: number, y: number): [number, number] => {
    // Rust coord (x,y) -> Leaflet (lat,lng). 
    // Invertimos Y porque en Leaflet Simple CRS, [0,0] suele ser arriba-izquierda o abajo-izquierda.
    // Nosotros usamos [lat, lng] donde 1000 es el tope.
    // Rust (0,0) es abajo izquierda. Leaflet Simple CRS [0,0] es abajo izquierda por defecto.
    const lng = (x / mapSize) * 1000;
    const lat = (y / mapSize) * 1000; 
    return [lat, lng];
  };

  // Generar líneas de cuadrícula
  const gridLines = useMemo(() => {
    const lines = [];
    const numCells = Math.ceil(mapSize / GRID_SIZE);
    const step = (GRID_SIZE / mapSize) * 1000;

    for (let i = 0; i <= numCells; i++) {
      const pos = i * step;
      if (pos > 1005) break;
      
      // Letras (X)
      const charCode = 65 + (i % 26);
      const suffix = i >= 26 ? Math.floor(i / 26) : "";
      const label = String.fromCharCode(charCode) + suffix;

      lines.push({ type: 'v', pos, label });
      lines.push({ type: 'h', pos: 1000 - pos, label: i.toString() });
    }
    return lines;
  }, [mapSize]);

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

  const imageLoaded = mapJpg && mapJpg.length > 100;

  return (
    <div className="rust-map-wrapper" style={{ height: '100%', width: '100%', background: '#0a0a0b', position: 'relative' }}>
      <MapContainer 
        crs={L.CRS.Simple}
        bounds={bounds}
        center={[500, 500]}
        zoom={0}
        minZoom={-2}
        maxZoom={4}
        style={{ height: "100%", width: "100%", backgroundColor: '#0a0a0b' }}
        attributionControl={false}
      >
        <style>{`
          .leaflet-container { background: #0a0a0b !important; }
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
          .grid-label-text { 
            color: rgba(255,255,255,0.4); 
            font-size: 11px; 
            font-weight: bold; 
            text-shadow: 1px 1px 2px black;
            font-family: 'JetBrains Mono', monospace;
          }
          .leaflet-popup-content-wrapper { background: var(--surface); color: white; border: 1px solid var(--border); border-radius: 8px; }
          .leaflet-popup-tip { background: var(--surface); border: 1px solid var(--border); }
        `}</style>

        {/* Tactical Grid Layer */}
        {gridLines.filter(l => l.type === 'v').map((l, i) => (
          <Polyline 
            key={`v-line-${i}`}
            positions={[[0, l.pos], [1000, l.pos]]}
            pathOptions={{ color: 'white', weight: 0.5, opacity: imageLoaded ? 0.1 : 0.4, dashArray: '5, 10' }}
          />
        ))}
        {gridLines.filter(l => l.type === 'h').map((l, i) => (
          <Polyline 
            key={`h-line-${i}`}
            positions={[[l.pos, 0], [l.pos, 1000]]}
            pathOptions={{ color: 'white', weight: 0.5, opacity: imageLoaded ? 0.1 : 0.4, dashArray: '5, 10' }}
          />
        ))}

        {/* Coordenadas en los bordes */}
        {gridLines.filter(l => l.type === 'v').map((l, i) => (
          <Marker 
            key={`v-label-${i}`}
            position={[5, l.pos + 2]}
            icon={L.divIcon({
              className: 'grid-label',
              html: `<span class="grid-label-text">${l.label}</span>`,
              iconSize: [20, 20]
            })}
          />
        ))}
        {gridLines.filter(l => l.type === 'h' && parseInt(l.label) > 0).map((l, i) => (
          <Marker 
            key={`h-label-${i}`}
            position={[l.pos + 2, 5]}
            icon={L.divIcon({
              className: 'grid-label',
              html: `<span class="grid-label-text">${l.label}</span>`,
              iconSize: [20, 20]
            })}
          />
        ))}

        {imageLoaded && (
          <ImageOverlay 
            url={`data:image/jpeg;base64,${mapJpg}`}
            bounds={bounds}
            opacity={1}
            zIndex={1}
          />
        )}
        
        {markers
          .filter(marker => marker && typeof marker.x === 'number' && typeof marker.y === 'number' && !isNaN(marker.x) && !isNaN(marker.y))
          .map((marker, i) => (
          <Marker 
            key={`${marker.steamId || marker.id || i}-${i}`} 
            position={getPosition(marker.x, marker.y)} 
            icon={getIcon(marker.type || marker.id, marker.name)}
          >
            <Popup>
              <div style={{ color: 'white', padding: '0.25rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--primary)' }}>
                  {marker.name || `Tipo: ${marker.type || 'Desconocido'}`}
                </strong>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span>X: {Math.round(marker.x)} | Y: {Math.round(marker.y)}</span>
                  {marker.grid && <span>Cuadrante: {marker.grid}</span>}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
