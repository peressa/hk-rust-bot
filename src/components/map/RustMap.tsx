p"use client";

import React, { useEffect, useState, useRef } from "react";
import { Layers, Users, Zap, EyeOff, Map as MapIcon, ShoppingCart, Pencil, Trash2 } from "lucide-react";
import { indexToLetter, worldToLeaflet } from "@/lib/rustplus/coordUtils";

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
  width?: number;
  height?: number;
  monuments?: any[];
  markers?: any[];
  serverId?: string;
  allowDrawing?: boolean;
}

export default function RustMap({
  mapJpg,
  mapSize = 4000,
  oceanMargin = 0,
  width = 1000,
  height = 1000,
  monuments = [],
  markers = [],
  serverId,
  allowDrawing = true
}: RustMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [L, setL] = useState<any>(null);
  const leafletMap = useRef<any>(null);
  const layersRef = useRef<{ [key: string]: any }>({});

  // Toggles de Capas
  const [showGrid, setShowGrid] = useState(true);
  const [showMonuments, setShowMonuments] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showPlayers, setShowPlayers] = useState(true);
  const [showVending, setShowVending] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  const [drawings, setDrawings] = useState<any[]>([]);
  const lastDrawingsRef = useRef<string>("");

  useEffect(() => {
    let isMounted = true;
    import("leaflet").then((leaflet) => {
      if (isMounted) setL(leaflet);
    });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (mapSize && oceanMargin !== undefined) {
      console.log(`[HK Map Debug] mapSize: ${mapSize}, oceanMargin: ${oceanMargin}, dimensions: ${width}x${height}`);
    }
  }, [mapSize, oceanMargin, width, height]);

  // Sync Drawings from DB
  useEffect(() => {
    if (!serverId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rustplus/drawings?serverId=${serverId}`);
        const data = await res.json();
        const dataStr = JSON.stringify(data);
        if (dataStr !== lastDrawingsRef.current) {
          setDrawings(data);
          lastDrawingsRef.current = dataStr;
        }
      } catch (e) { }
    }, 2000);
    return () => clearInterval(interval);
  }, [serverId]);

  const getPosition = (x: number, y: number): [number, number] => {
    if (mapSize <= 0) return [0, 0];
    const projection = worldToLeaflet(x, y, mapSize, oceanMargin);
    return [projection.lat, projection.lng];
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
    } else if (type === MARKER_TYPES.CH47) {
      color = "#ef4444";
      iconHtml = `<div style="background: ${color}; width: 16px; height: 16px; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 8px; font-weight: 900; border: 1px solid white;">CH</div>`;
      size = 16;
    } else if (type === MARKER_TYPES.EXPLOSION) {
      color = "#ef4444";
      iconHtml = `<div class="raid-pulse" style="background: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`;
      size = 20;
    } else if (type === MARKER_TYPES.VENDING) {
      color = "#eab308";
      iconHtml = `<div style="background: ${color}; width: 10px; height: 10px; border-radius: 50%; border: 1px solid black; box-shadow: 0 0 5px ${color}"></div>`;
      size = 10;
    } else if (type === "Death") {
      iconHtml = `<div style="font-size: 16px; filter: drop-shadow(0px 0px 4px red);">💀</div>`;
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
    if (!leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, {
        crs: L.CRS.Simple,
        minZoom: -2,
        maxZoom: 2,
        zoom: -1,
        center: [500, 500],
        attributionControl: false,
        zoomControl: false
      });
      L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);
    }
  }, [L]);

  // Capa Grilla Táctica con ETIQUETAS PERMANENTES
  useEffect(() => {
    if (!L || !leafletMap.current) return;
    if (layersRef.current['gridGroup']) {
      leafletMap.current.removeLayer(layersRef.current['gridGroup']);
    }

    if (showGrid) {
      const gridGroup = L.layerGroup().addTo(leafletMap.current);
      layersRef.current['gridGroup'] = gridGroup;

      const GRID_SIZE = 146.25;
      const worldHalf = mapSize / 2;
      const numCells = Math.ceil(mapSize / GRID_SIZE);

      for (let i = 0; i < numCells; i++) {
        for (let j = 0; j < numCells; j++) {
          const worldX = -worldHalf + (i * GRID_SIZE);
          const worldY = worldHalf - (j * GRID_SIZE);

          const p1 = worldToLeaflet(worldX, worldY, mapSize, oceanMargin);
          const p2 = worldToLeaflet(worldX + GRID_SIZE, worldY - GRID_SIZE, mapSize, oceanMargin);

          const opts = { color: 'white', weight: 1, opacity: 0.1, dashArray: '5, 10' };

          // Dibujar líneas solo una vez por celda
          // Placeholder logic removed as it was hardcoded to 2000 margin

          // Líneas verticales y horizontales
          L.polyline([[p1.lat, p1.lng], [p2.lat, p1.lng]], opts).addTo(gridGroup);
          L.polyline([[p1.lat, p1.lng], [p1.lat, p2.lng]], opts).addTo(gridGroup);

          // Cerrar la grilla en los bordes finales
          if (i === numCells - 1) L.polyline([[p1.lat, p2.lng], [p2.lat, p2.lng]], opts).addTo(gridGroup);
          if (j === numCells - 1) L.polyline([[p2.lat, p1.lng], [p2.lat, p2.lng]], opts).addTo(gridGroup);

          const gridLabel = `${indexToLetter(i)}${j}`;
          L.marker([p1.lat + (p2.lat - p1.lat) / 2, p1.lng + (p2.lng - p1.lng) / 2], {
            icon: L.divIcon({
              className: 'grid-cell-label',
              html: `<div class="grid-cell-text" style="color: rgba(255,255,255,0.1); font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">${gridLabel}</div>`,
              iconSize: [40, 40]
            }),
            interactive: false
          }).addTo(gridGroup);
        }
      }
    }
  }, [L, mapSize, showGrid]);

  // Imagen Base64
  useEffect(() => {
    if (!L || !leafletMap.current || !mapJpg) return;
    if (layersRef.current['image']) leafletMap.current.removeLayer(layersRef.current['image']);
    layersRef.current['image'] = L.imageOverlay(`data:image/jpeg;base64,${mapJpg}`, [[0, 0], [1000, 1000]], {
      opacity: 1, zIndex: 1
    }).addTo(leafletMap.current);
  }, [L, mapJpg]);

  // Renderizar Dibujos Tácticos
  useEffect(() => {
    if (!L || !leafletMap.current) return;
    if (layersRef.current['drawingsGroup']) leafletMap.current.removeLayer(layersRef.current['drawingsGroup']);

    const drawingsGroup = L.layerGroup().addTo(leafletMap.current);
    layersRef.current['drawingsGroup'] = drawingsGroup;

    drawings.forEach((d: any) => {
      try {
        const points = JSON.parse(d.data);
        if (Array.isArray(points)) {
          L.polyline(points, { color: d.color || '#ce422b', weight: 4, opacity: 0.8 }).addTo(drawingsGroup);
        }
      } catch (e) { }
    });
  }, [L, drawings]);

  // Renderizar Monumentos
  useEffect(() => {
    if (!L || !leafletMap.current) return;
    if (layersRef.current['monumentsGroup']) leafletMap.current.removeLayer(layersRef.current['monumentsGroup']);

    if (showMonuments) {
      const monumentsGroup = L.layerGroup().addTo(leafletMap.current);
      layersRef.current['monumentsGroup'] = monumentsGroup;

      monuments.forEach((mon: any) => {
        const token = mon.token || "";
        const cleanName = token.toUpperCase().replace(/_/g, ' ');
        
        // FILTRO: Ocultar nombres técnicos, túneles y laboratorios para limpiar el mapa
        if (token.includes('assets/') || token.includes('tunnel') || token.includes('underwater') || token.includes('lab')) return;

        // Unificamos a world coordinates usando getPosition
        const pos = getPosition(mon.x, mon.y);
        
        L.marker(pos, {
          icon: L.divIcon({
            className: 'monument-label',
            html: `<div style="color: rgba(255,255,255,0.7); font-size: 11px; font-weight: 700; text-transform: uppercase; white-space: nowrap; text-shadow: 0 0 4px black; letter-spacing: 0.05em; pointer-events: none;">${cleanName}</div>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
          }),
          interactive: false
        }).addTo(monumentsGroup);
      });
    }
  }, [L, monuments, showMonuments, mapSize]);

  // Renderizar Marcadores (Jugadores, Equipos, Eventos)
  useEffect(() => {
    if (!L || !leafletMap.current) return;
    if (layersRef.current['markersGroup']) leafletMap.current.removeLayer(layersRef.current['markersGroup']);

    const markersGroup = L.layerGroup().addTo(leafletMap.current);
    layersRef.current['markersGroup'] = markersGroup;

    markers
      .filter(m => {
        // Filtrar monumentos duplicados (tipo 1 en API de Rust)
        if (m.type === 1 || m.type === "1") return false;
        
        if (m.type === MARKER_TYPES.PLAYER || m.type === "Death") return showPlayers;
        if (m.type === MARKER_TYPES.VENDING) return showVending;
        return showEvents;
      })
      .forEach(marker => {
        const popupHtml = `<div style="padding: 0.5rem; color: white;"><strong style="color: var(--primary)">${marker.name || 'Marcador'}</strong></div>`;
        L.marker(getPosition(marker.x, marker.y), {
          icon: getIcon(L, marker.type || marker.id, marker.name)
        }).addTo(markersGroup).bindPopup(popupHtml, { className: 'custom-popup-rust' });
      });
  }, [L, markers, showEvents, showPlayers, showVending, mapSize]);

  // Manejador de Dibujo y Desactivación de Arrastre
  useEffect(() => {
    if (!L || !leafletMap.current) return;

    if (isDrawingMode) {
      leafletMap.current.dragging.disable();
    } else {
      leafletMap.current.dragging.enable();
    }

    if (!isDrawingMode) return;

    let currentPath: any[] = [];
    let polyline: any = null;

    const onMouseDown = (e: any) => {
      currentPath = [e.latlng];
      polyline = L.polyline(currentPath, { color: 'var(--primary)', weight: 4, opacity: 0.8 }).addTo(leafletMap.current);
    };

    const onMouseMove = (e: any) => {
      if (!polyline) return;
      currentPath.push(e.latlng);
      polyline.setLatLngs(currentPath);
    };

    const onMouseUp = async () => {
      if (!polyline) return;
      const finalPath = currentPath;
      polyline.remove();
      polyline = null;
      currentPath = [];

      // Save to DB
      if (serverId) {
        await fetch('/api/rustplus/drawings', {
          method: 'POST',
          body: JSON.stringify({ serverId, data: finalPath, color: '#ce422b' })
        });
      }
    };

    leafletMap.current.on('mousedown', onMouseDown);
    leafletMap.current.on('mousemove', onMouseMove);
    leafletMap.current.on('mouseup', onMouseUp);

    return () => {
      leafletMap.current.off('mousedown', onMouseDown);
      leafletMap.current.off('mousemove', onMouseMove);
      leafletMap.current.off('mouseup', onMouseUp);
    };
  }, [L, isDrawingMode, serverId]);

  if (!L) return null;

  return (
    <div className="rust-map-wrapper" style={{ height: '100%', width: '100%', background: '#0a0a0b', position: 'relative' }}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', zIndex: 1000, display: 'flex', gap: '0.5rem', background: 'rgba(5, 5, 5, 0.9)', padding: '0.5rem', border: '1px solid var(--border)' }}>
        <MapControlButton active={showGrid} icon={<Layers size={18} />} onClick={() => setShowGrid(!showGrid)} title="Grilla Táctica" />
        <MapControlButton active={showPlayers} icon={<Users size={18} />} onClick={() => setShowPlayers(!showPlayers)} title="Equipo" />
        <MapControlButton active={showVending} icon={<ShoppingCart size={18} />} onClick={() => setShowVending(!showVending)} title="Vending" />
        <div style={{ width: '1px', background: 'var(--border)', margin: '0 0.5rem' }}></div>
        <MapControlButton active={isDrawingMode} icon={<Pencil size={18} />} onClick={() => setIsDrawingMode(!isDrawingMode)} title="Dibujo Táctico" highlight />
        <MapControlButton active={false} icon={<Trash2 size={18} />} onClick={() => serverId && fetch(`/api/rustplus/drawings?serverId=${serverId}`, { method: 'DELETE' })} title="Limpiar Mapa" />
      </div>

      <div ref={mapRef} style={{ height: "100%", width: "100%", cursor: isDrawingMode ? 'crosshair' : 'grab' }} />

      <style jsx global>{`
           .map-control-btn { background: transparent; border: none; color: #555; cursor: pointer; padding: 0.5rem; transition: 0.1s; display: flex; align-items: center; justify-content: center; }
           .map-control-btn:hover { color: #fff; background: rgba(255,255,255,0.05); }
           .map-control-btn.active { color: #fff; }
           .map-control-btn.highlight.active { color: var(--primary); }
           .grid-cell-label { background: none; border: none; pointer-events: none; }
           .custom-popup-rust .leaflet-popup-content-wrapper { background: #050505; color: white; border: 1px solid var(--border); border-radius: 0; }
           .radar-pulse { animation: pulse 2s infinite; }
           @keyframes pulse { 0% { transform: scale(0.5); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }
           .leaflet-container { background: #0a0a0b !important; }
           .grid-cell-text { pointer-events: none; user-select: none; }
           .monument-label div { pointer-events: none; user-select: none; }
           .custom-popup-rust .leaflet-popup-tip { background: #050505; }
        `}</style>
    </div>
  );
}

function MapControlButton({ active, icon, onClick, title, highlight = false }: any) {
  return (
    <button onClick={onClick} title={title} className={`map-control-btn ${active ? 'active' : ''} ${highlight ? 'highlight' : ''}`}>
      {icon}
    </button>
  );
}
