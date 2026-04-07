"use client";

import React, { useEffect, useState, useRef } from "react";
import { Layers, Users, Zap, EyeOff, Map as MapIcon, ShoppingCart } from "lucide-react";
import { GRID_SIZE, indexToLetter } from "@/lib/rustplus/coordUtils";

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
  oceanMargin?: number;
  monuments?: any[];
  markers?: any[];
}

export default function RustMap({
  mapJpg,
  mapSize = 4000,
  oceanMargin = 0,
  monuments = [],
  markers = []
}: RustMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [L, setL] = useState<any>(null);
  const leafletMap = useRef<any>(null);
  const layersRef = useRef<{ [key: string]: any }>({});
  const gridLinesRef = useRef<any[]>([]);

  // Toggles de Capas
  const [showGrid, setShowGrid] = useState(true);
  const [showMonuments, setShowMonuments] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showPlayers, setShowPlayers] = useState(true);
  const [showVending, setShowVending] = useState(false);

  const GRID_SIZE = 146.3;
  // Factor crítico de corrección geográfica
  const totalMapSize = mapSize + (oceanMargin * 2);

  useEffect(() => {
    let isMounted = true;
    import("leaflet").then((leaflet) => {
      if (isMounted) setL(leaflet);
    }).catch(err => console.error("No se pudo cargar Leaflet:", err));
    return () => { isMounted = false; };
  }, []);

  const getPosition = (x: number, y: number): [number, number] => {
    if (totalMapSize <= 0) return [0, 0];
    const worldHalf = mapSize / 2;
    // En Rust+, las coordenadas son centradas en (0,0). 
    // Mapeamos a la imagen que incluye el mar.
    const lng = ((x + worldHalf + oceanMargin) / totalMapSize) * 1000;
    const lat = ((y + worldHalf + oceanMargin) / totalMapSize) * 1000;
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
    } else if (type === MARKER_TYPES.CH47) {
      color = "#ef4444";
      iconHtml = `<div class="marker-ch47" style="display: flex; align-items: center; justify-content: center; position: relative;">
                    <div style="background: ${color}; width: 16px; height: 16px; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 8px; font-weight: 900; z-index: 2; border: 1px solid white;">CH</div>
                  </div>`;
      size = 16;
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
                    <div style="background: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 1px solid black; box-shadow: 0 0 5px ${color}"></div>
                  </div>`;
      size = 12;
    } else if (type === "Death") {
      color = "#dc2626";
      iconHtml = `<div style="display: flex; align-items: center; justify-content: center; font-size: 16px; background: transparent; filter: drop-shadow(0px 0px 4px red);">💀</div>`;
      size = 20;
    } else {
      color = "#a855f7";
      iconHtml = `<div style="background: ${color}; width: 14px; height: 14px; border-radius: 4px; border: 1px solid white;"></div>`;
      size = 14;
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
    if (!L || !mapRef.current) return;
    try {
      if (!leafletMap.current) {
        leafletMap.current = L.map(mapRef.current, {
          crs: L.CRS.Simple,
          minZoom: -2,
          maxZoom: 4,
          zoom: -1,
          center: [500, 500],
          attributionControl: false,
          zoomControl: false // Ocultamos el nativo para estética
        });

        // Agregar control abajo derecha
        L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);
      }
    } catch (err) {
      console.error("Error inicializando Leaflet:", err);
    }
  }, [L]);

  // Capa Grilla Táctica
  useEffect(() => {
    if (!L || !leafletMap.current) return;
    if (layersRef.current['gridGroup']) {
      leafletMap.current.removeLayer(layersRef.current['gridGroup']);
    }

    if (showGrid) {
      const gridGroup = L.layerGroup().addTo(leafletMap.current);
      layersRef.current['gridGroup'] = gridGroup;
      gridLinesRef.current = [];

      // FÓRMULA DE PRECISIÓN DINÁMICA: Ajustamos la rejilla para que encaje 
      // un número entero de celdas en el mapa.
      const totalCells = Math.max(1, Math.round(mapSize / 150));
      const offset = (oceanMargin / totalMapSize) * 1000;
      const effectiveStep = (1000 - (offset * 2)) / totalCells;

      // Dibujar líneas y etiquetas centrales por celda
      for (let i = 0; i < totalCells; i++) {
        for (let j = 0; j < totalCells; j++) {
          const xPos = offset + (i * effectiveStep);
          const yPos = offset + (j * effectiveStep);

          const opts = { color: 'white', weight: 1, opacity: 0.1, dashArray: '5, 10' };

          if (j === 0) { // Líneas Verticales
            gridLinesRef.current.push(L.polyline([[offset, xPos], [1000 - offset, xPos]], opts).addTo(gridGroup));
            if (i === totalCells - 1) {
              gridLinesRef.current.push(L.polyline([[offset, xPos + effectiveStep], [1000 - offset, xPos + effectiveStep]], opts).addTo(gridGroup));
            }
          }
          if (i === 0) { // Líneas Horizontales
            const yLine = 1000 - yPos;
            gridLinesRef.current.push(L.polyline([[yLine, offset], [yLine, 1000 - offset]], opts).addTo(gridGroup));
            if (j === totalCells - 1) {
              gridLinesRef.current.push(L.polyline([[1000 - (yPos + effectiveStep), offset], [1000 - (yPos + effectiveStep), 1000 - offset]], opts).addTo(gridGroup));
            }
          }

          // En Rust in-game, el primer cuadrante es A1.
          const gridLabel = `${indexToLetter(i)}${j + 1}`;

          L.marker([1000 - (yPos + effectiveStep / 2), xPos + (effectiveStep / 2)], {
            icon: L.divIcon({
              className: 'grid-cell-label',
              html: `<div class="grid-cell-text" style="opacity: 0.1">${gridLabel}</div>`,
              iconSize: [30, 30]
            }),
            interactive: false
          }).addTo(gridGroup);
        }
      }

      // Etiquetas Exteriores en Bordes
      for (let i = 0; i < totalCells; i++) {
        const xPos = offset + (i * effectiveStep);
        const yPos = offset + (i * effectiveStep);

        // Letras arriba (X)
        L.marker([1000 - offset + 15, xPos + (effectiveStep / 2)], {
          icon: L.divIcon({ className: 'grid-label-outer', html: `<span>${indexToLetter(i)}</span>`, iconSize: [20, 20] })
        }).addTo(gridGroup);

        // Números izquierda (Y) - Empieza en 1
        L.marker([1000 - (yPos + effectiveStep / 2), offset - 15], {
          icon: L.divIcon({ className: 'grid-label-outer', html: `<span>${i + 1}</span>`, iconSize: [20, 20] })
        }).addTo(gridGroup);
      }
    }
  }, [L, mapSize, oceanMargin, showGrid, totalMapSize]);

  // Imagen Base64
  useEffect(() => {
    if (!L || !leafletMap.current) return;
    if (mapJpg && mapJpg.length > 100) {
      if (layersRef.current['image']) leafletMap.current.removeLayer(layersRef.current['image']);
      layersRef.current['image'] = L.imageOverlay(`data:image/jpeg;base64,${mapJpg}`, [[0, 0], [1000, 1000]], {
        opacity: 1, zIndex: 1
      }).addTo(leafletMap.current);
    }
  }, [L, mapJpg]);

  // Renderizar Monumentos
  useEffect(() => {
    if (!L || !leafletMap.current) return;
    if (layersRef.current['monumentsGroup']) leafletMap.current.removeLayer(layersRef.current['monumentsGroup']);

    if (showMonuments && monuments.length > 0) {
      const monumentsGroup = L.layerGroup().addTo(leafletMap.current);
      layersRef.current['monumentsGroup'] = monumentsGroup;

      monuments.forEach(mon => {
        if (!mon.name) return; // Fix if it's token based
        // Omitir cuevas y elementos basura si queremos el mapa limpio
        if (mon.name.toLowerCase().includes("cave") || mon.name.toLowerCase().includes("swamp")) return;

        const displayName = mon.name.replace(/_/g, ' ').toUpperCase();
        const iconHtml = `<div class="monument-label">${displayName}</div>`;
        L.marker(getPosition(mon.x, mon.y), {
          icon: L.divIcon({ className: 'custom-div-icon', html: iconHtml })
        }).addTo(monumentsGroup);
      });
    }
  }, [L, monuments, showMonuments, oceanMargin, mapSize, totalMapSize]);

  // Renderizar Marcadores Interactivos (Equipos, Vending, Eventos)
  useEffect(() => {
    if (!L || !leafletMap.current) return;
    if (layersRef.current['markersGroup']) leafletMap.current.removeLayer(layersRef.current['markersGroup']);

    const markersGroup = L.layerGroup().addTo(leafletMap.current);
    layersRef.current['markersGroup'] = markersGroup;

    markers
      .filter(m => {
        if (m.type === MARKER_TYPES.PLAYER || m.type === "Death") return showPlayers;
        if (m.type === MARKER_TYPES.VENDING) return showVending;
        return showEvents;
      })
      .filter(m => m && typeof m.x === 'number' && typeof m.y === 'number')
      .forEach(marker => {
        const popupHtml = `
          <div style="color: white; padding: 0.25rem;">
            <strong style="display: block; margin-bottom: 0.25rem; color: var(--primary);">
              ${marker.name || ('Tipo: ' + (marker.type || 'Desconocido'))}
            </strong>
          </div>
        `;
        const leafletMarker = L.marker(getPosition(marker.x, marker.y), {
          icon: getIcon(L, marker.type || marker.id, marker.name)
        }).addTo(markersGroup);
        leafletMarker.bindPopup(popupHtml, { className: 'custom-popup-rust' });
      });
  }, [L, markers, showEvents, showPlayers, showVending, oceanMargin, mapSize, totalMapSize]);

  if (!L) {
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0b', color: 'var(--text-muted)' }}>
        <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
        <span style={{ marginTop: '1rem' }}>Iniciando motor de radar...</span>
      </div>
    );
  }

  return (
    <div className="rust-map-wrapper" style={{ height: '100%', width: '100%', background: '#0a0a0b', position: 'relative' }}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="" />

      {/* HUD de Controles Flotantes */}
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1000, display: 'flex', gap: '0.5rem', background: 'rgba(10, 10, 11, 0.8)', padding: '0.5rem', borderRadius: '12px', border: '1px solid var(--border)', backdropFilter: 'blur(10px)' }}>
        <button onClick={() => setShowPlayers(!showPlayers)} className="btn-icon" style={{ color: showPlayers ? '#22c55e' : '#555', padding: '0.5rem' }} title="Equipo">
          <Users size={18} />
        </button>
        <button onClick={() => setShowEvents(!showEvents)} className="btn-icon" style={{ color: showEvents ? '#ef4444' : '#555', padding: '0.5rem' }} title="Eventos Activos">
          <Zap size={18} />
        </button>
        <button onClick={() => setShowMonuments(!showMonuments)} className="btn-icon" style={{ color: showMonuments ? 'white' : '#555', padding: '0.5rem' }} title="Radtowns">
          <MapIcon size={18} />
        </button>
        <button onClick={() => setShowVending(!showVending)} className="btn-icon" style={{ color: showVending ? '#eab308' : '#555', padding: '0.5rem' }} title="Máquinas Expendedoras">
          <ShoppingCart size={18} />
        </button>
        <div style={{ width: '1px', background: 'var(--border)', margin: '0 0.25rem' }}></div>
        <button onClick={() => setShowGrid(!showGrid)} className="btn-icon" style={{ color: showGrid ? 'rgba(255,255,255,0.7)' : '#555', padding: '0.5rem' }} title="Grilla Táctica">
          <Layers size={18} />
        </button>
      </div>

      <div ref={mapRef} style={{ height: "100%", width: "100%", backgroundColor: '#0a0a0b' }} />

      <style key="leaflet-overrides">{`
        .leaflet-container { background: #0a0a0b !important; }
        .btn-icon { background: transparent; border: none; cursor: pointer; transition: 0.2s; border-radius: 8px; }
        .btn-icon:hover { background: rgba(255,255,255,0.1); }
        .radar-pulse { animation: pulse 2s infinite; }
        .raid-pulse { animation: raid-blink 0.5s infinite; }
        @keyframes pulse { 0% { transform: scale(0.5); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }
        @keyframes raid-blink { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.5); } }
        .custom-div-icon { background: none; border: none; display: flex; align-items: center; justify-content: center; }
        .grid-label-text { color: rgba(255,255,255,0.6); font-size: 14px; font-weight: 900; text-shadow: 2px 2px 4px black; font-family: 'JetBrains Mono', monospace; }
        .monument-label { color: rgba(255,255,255,0.85); font-size: 9px; font-weight: 800; text-shadow: 1px 1px 3px black, -1px -1px 3px black; text-align: center; white-space: nowrap; transform: translate(-50%, -50%); letter-spacing: 0.5px; }
        .grid-cell-label { background: none; border: none; pointer-events: none; }
        .grid-cell-text { color: rgba(255,255,255,0.03); font-size: 10px; font-weight: 900; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-family: 'JetBrains Mono', monospace; }
        .grid-label-outer { color: rgba(255,255,255,0.6); font-size: 14px; font-weight: 800; text-shadow: 2px 2px 4px black; }
        .custom-popup-rust .leaflet-popup-content-wrapper { background: var(--surface); color: white; border: 1px solid var(--border); border-radius: 8px; }
        .custom-popup-rust .leaflet-popup-tip { background: var(--surface); border: 1px solid var(--border); }
      `}</style>
    </div>
  );
}
