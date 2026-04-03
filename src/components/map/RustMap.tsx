"use client";

import React, { useEffect, useState, useRef } from "react";
// Importación estricta de Leaflet en cliente
import dynamic from "next/dynamic";

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

// Leaflet necesita acceso al DOM real, por lo que usamos un wrapper
// Este componente se carga de forma segura solo en cliente.
export default function RustMap({ 
  mapJpg, 
  mapSize = 4000, 
  markers = [] 
}: RustMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [L, setL] = useState<any>(null);
  const leafletMap = useRef<any>(null);
  const layersRef = useRef<{ [key: string]: any }>({});
  const gridLinesRef = useRef<any[]>([]);

  const GRID_SIZE = 146.3;

  useEffect(() => {
    let isMounted = true;
    import("leaflet").then((leaflet) => {
      import("leaflet/dist/leaflet.css");
      if (isMounted) {
        setL(leaflet);
      }
    });

    return () => { isMounted = false; };
  }, []);

  const getPosition = (x: number, y: number): [number, number] => {
    const lng = (x / mapSize) * 1000;
    const lat = (y / mapSize) * 1000; 
    return [lat, lng];
  };

  const getIcon = (leaflet: any, type: any, name: string) => {
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
      iconHtml = `<div class="marker-vending" style="display: flex; align-items: center; justify-content: center; position: relative;">
                    <div style="background: ${color}; width: 14px; height: 14px; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: black; font-size: 8px; font-weight: 900; z-index: 2; border: 1px solid white;">V</div>
                  </div>`;
      size = 14;
    } else {
        iconHtml = `<div style="background: ${color}; width: 10px; height: 10px; border-radius: 50%; border: 1px solid white;"></div>`;
        size = 10;
    }

    return leaflet.divIcon({
      className: 'custom-div-icon',
      html: iconHtml,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  };

  // Inicializar mapa subyacente
  useEffect(() => {
    if (!L || !mapRef.current || leafletMap.current) return;

    leafletMap.current = L.map(mapRef.current, {
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 4,
      zoom: -1,
      center: [500, 500],
      attributionControl: false,
    });

    // Capa base táctica
    const numCells = Math.ceil(mapSize / GRID_SIZE);
    const step = (GRID_SIZE / mapSize) * 1000;
    
    const gridGroup = L.layerGroup().addTo(leafletMap.current);
    gridLinesRef.current = [];

    for (let i = 0; i <= numCells; i++) {
      const pos = i * step;
      if (pos > 1005) break;

      const opts = { color: 'white', weight: 0.5, opacity: 0.4, dashArray: '5, 10' };

      // Vertical
      gridLinesRef.current.push(L.polyline([[0, pos], [1000, pos]], opts).addTo(gridGroup));
      // Horizontal
      const hPos = 1000 - pos;
      gridLinesRef.current.push(L.polyline([[hPos, 0], [hPos, 1000]], opts).addTo(gridGroup));

      const charCode = 65 + (i % 26);
      const suffix = i >= 26 ? Math.floor(i / 26) : "";
      const vLabel = String.fromCharCode(charCode) + suffix;

      L.marker([5, pos + 2], {
        icon: L.divIcon({ className: 'grid-label', html: `<span class="grid-label-text">${vLabel}</span>`, iconSize: [20, 20] })
      }).addTo(gridGroup);

      if (parseInt(i.toString()) > 0) {
        L.marker([hPos + 2, 5], {
          icon: L.divIcon({ className: 'grid-label', html: `<span class="grid-label-text">${i}</span>`, iconSize: [20, 20] })
        }).addTo(gridGroup);
      }
    }
  }, [L, mapSize]);

  // Actualizar la imagen Base64 del mapa
  useEffect(() => {
    if (!L || !leafletMap.current) return;
    
    if (mapJpg && mapJpg.length > 100) {
      if (layersRef.current['image']) {
        leafletMap.current.removeLayer(layersRef.current['image']);
      }

      layersRef.current['image'] = L.imageOverlay(`data:image/jpeg;base64,${mapJpg}`, [[0,0], [1000,1000]], {
        opacity: 1, zIndex: 1
      }).addTo(leafletMap.current);
      
      // Bajar opacidad de la grilla blanca para que se vea la imagen mejor
      gridLinesRef.current.forEach(line => line.setStyle({ opacity: 0.15 }));
    } else {
      if (layersRef.current['image']) {
        leafletMap.current.removeLayer(layersRef.current['image']);
        layersRef.current['image'] = null;
      }
      gridLinesRef.current.forEach(line => line.setStyle({ opacity: 0.4 }));
    }
  }, [L, mapJpg]);

  // Actualizar los Marcadores (Puntos de jugadores, máquinas expendedoras, etc.)
  useEffect(() => {
    if (!L || !leafletMap.current) return;
    
    if (layersRef.current['markersGroup']) {
      leafletMap.current.removeLayer(layersRef.current['markersGroup']);
    }

    const markersGroup = L.layerGroup().addTo(leafletMap.current);
    layersRef.current['markersGroup'] = markersGroup;

    markers
      .filter(m => m && typeof m.x === 'number' && typeof m.y === 'number' && !isNaN(m.x) && !isNaN(m.y))
      .forEach(marker => {
        const popupHtml = `
          <div style="color: white; padding: 0.25rem;">
            <strong style="display: block; margin-bottom: 0.25rem; color: var(--primary);">
              ${marker.name || `Tipo: ${marker.type || 'Desconocido'}`}
            </strong>
            <div style="font-size: 0.75rem; opacity: 0.8; display: flex; flex-direction: column;">
              <span>X: ${Math.round(marker.x)} | Y: ${Math.round(marker.y)}</span>
              ${marker.grid ? `<span>Cuadrante: ${marker.grid}</span>` : ''}
            </div>
          </div>
        `;

        const leafletMarker = L.marker(getPosition(marker.x, marker.y), {
          icon: getIcon(L, marker.type || marker.id, marker.name)
        }).addTo(markersGroup);

        leafletMarker.bindPopup(popupHtml, { className: 'custom-popup-rust' });
      });
  }, [L, markers, mapSize]);

  if (!L) {
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0b', color: 'var(--text-muted)' }}>
        <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
        <span style={{ marginTop: '1rem' }}>Iniciando motor de mapa HK...</span>
      </div>
    );
  }

  return (
    <div className="rust-map-wrapper" style={{ height: '100%', width: '100%', background: '#0a0a0b', position: 'relative' }}>
      <div ref={mapRef} style={{ height: "100%", width: "100%", backgroundColor: '#0a0a0b' }} />
      <style key="leaflet-overrides">{`
        .leaflet-container { background: #0a0a0b !important; }
        .radar-pulse { animation: pulse 2s infinite; }
        .raid-pulse { animation: raid-blink 0.5s infinite; }
        @keyframes pulse { 0% { transform: scale(0.5); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }
        @keyframes raid-blink { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.5); } }
        .custom-div-icon { background: none; border: none; }
        .grid-label-text { color: rgba(255,255,255,0.4); font-size: 11px; font-weight: bold; text-shadow: 1px 1px 2px black; font-family: 'JetBrains Mono', monospace; }
        .custom-popup-rust .leaflet-popup-content-wrapper { background: var(--surface); color: white; border: 1px solid var(--border); border-radius: 8px; }
        .custom-popup-rust .leaflet-popup-tip { background: var(--surface); border: 1px solid var(--border); }
      `}</style>
    </div>
  );
}
