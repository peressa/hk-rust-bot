"use client";

import React, { useEffect, useState, useRef } from "react";
import { Layers, Users, Zap, EyeOff, Map as MapIcon, ShoppingCart, Pencil, Trash2 } from "lucide-react";
import { indexToLetter, worldToLeaflet } from "@/lib/rustplus/coordUtils";

// Tipos de marcadores según el proto AppMarkerType (enteros)
const MARKER_TYPES = {
  PLAYER: 1,       // Player
  EXPLOSION: 2,    // Explosion
  VENDING: 3,      // VendingMachine
  CH47: 4,         // CH47
  CARGO: 5,        // CargoShip
  CRATE: 6,        // Crate
  GENERIC: 7,      // GenericRadius
  HELI: 8          // PatrolHelicopter
};

interface RustMapProps {
  mapJpg?: string;
  mapSize?: number;
  oceanMargin?: number;
  width?: number;
  height?: number;
  monuments?: any[];
  markers?: any[];
  team?: any[];
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
  team = [],
  serverId,
  allowDrawing = true
}: RustMapProps) {
  // Usar el margen de océano real. El valor 1000 era un fallback que causaba desplazamientos.
  const effectiveOceanMargin = oceanMargin || 0;
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

  // Log primeros marcadores para diagnóstico de coordenadas
  useEffect(() => {
    if (!markers || markers.length === 0) return;
    const sample = markers.slice(0, 5).map(m => ({
      type: m.type,
      name: m.name,
      rawX: m.x,
      rawY: m.y,
      projected: worldToLeaflet(m.x, m.y, mapSize, oceanMargin)
    }));
    console.log(`[HK Map Debug] Markers sample (mapSize=${mapSize}, ocean=${oceanMargin}):`, JSON.stringify(sample));
  }, [markers, mapSize, oceanMargin]);

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

  const getPosition = (x: number, y: number, currentMapSize: number, forceNormalize: boolean = false): [number, number] => {
    let nx = x;
    let ny = y;
    
    // Normalización: Si es un marcador (monumento/tienda) viene en 0..mapSize -> pasar a -half..half
    // Si ya es negativo o forceNormalize es false para jugadores, se queda igual.
    if (forceNormalize && nx >= 0 && ny >= 0) {
      nx = nx - (currentMapSize / 2);
      ny = ny - (currentMapSize / 2);
    }

    const projection = worldToLeaflet(nx, ny, currentMapSize, effectiveOceanMargin);
    const lat = projection.lat;
    const lng = projection.lng;
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
        maxBounds: [[0, 0], [1000, 1000]],
        maxBoundsViscosity: 1.0,
        zoomControl: false,
        attributionControl: false
      }).setView([500, 500], -1);
      L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);
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

      const worldHalf = mapSize / 2;
      
      // Cálculo dinámico para coincidir con coordUtils.ts
      let numCells = Math.ceil(mapSize / 146.25);
      if (mapSize >= 3000 && mapSize <= 4000) numCells = 24; 
      
      const cellSizeGrid = mapSize / numCells;
      const margin = effectiveOceanMargin;

      const lineOpts = { color: 'rgba(255,255,255,0.12)', weight: 1, opacity: 1, dashArray: '3, 6' };

      // Líneas Verticales + etiquetas de columna (letras: A, B, C...)
      for (let i = 0; i <= numCells; i++) {
        const x = -worldHalf + (i * cellSizeGrid);
        const pTop    = worldToLeaflet(x, worldHalf, mapSize, margin);
        const pBottom = worldToLeaflet(x, -worldHalf, mapSize, margin);

        L.polyline([[pTop.lat, pTop.lng], [pBottom.lat, pBottom.lng]], lineOpts).addTo(gridGroup);

        if (i < numCells) {
          const char = indexToLetter(i);
          // Etiqueta sobre la línea superior del grid
          const pLabel = worldToLeaflet(x + cellSizeGrid / 2, worldHalf, mapSize, margin);
          L.marker([pLabel.lat, pLabel.lng], {
            icon: L.divIcon({
              className: '',
              html: `<div style="color:rgba(255,255,255,0.35);font-size:11px;font-weight:800;line-height:1;transform:translateX(-50%);pointer-events:none;">${char}</div>`,
              iconSize: [0, 0],
              iconAnchor: [0, 0]
            }),
            interactive: false
          }).addTo(gridGroup);
        }
      }

      // Líneas Horizontales + etiquetas de fila (números: 0, 1, 2...)
      for (let j = 0; j <= numCells; j++) {
        const y = worldHalf - (j * cellSizeGrid);
        const pLeft  = worldToLeaflet(-worldHalf, y, mapSize, margin);
        const pRight = worldToLeaflet(worldHalf, y, mapSize, margin);

        L.polyline([[pLeft.lat, pLeft.lng], [pLeft.lat, pRight.lng]], lineOpts).addTo(gridGroup);

        if (j < numCells) {
          // Etiqueta a la izquierda de la línea
          const pLabel = worldToLeaflet(-worldHalf, y - cellSizeGrid / 2, mapSize, margin);
          L.marker([pLabel.lat, pLabel.lng], {
            icon: L.divIcon({
              className: '',
              html: `<div style="color:rgba(255,255,255,0.35);font-size:11px;font-weight:800;line-height:1;transform:translateY(-50%);pointer-events:none;">${j}</div>`,
              iconSize: [0, 0],
              iconAnchor: [0, 0]
            }),
            interactive: false
          }).addTo(gridGroup);
        }
      }
    }
  }, [L, mapSize, oceanMargin, showGrid]);

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

        // Filtrar ruido técnico (túneles, laboratorios, paths de assets)
        if (
          token.startsWith('assets/') ||
          token.includes('tunnel') ||
          token.includes('underwater') ||
          token.includes('lab')
        ) return;

        // Limpiar el nombre: quitar sufijos técnicos generados por Rust+
        let cleanName = token
          .replace(/_/g, ' ')
          .replace(/\bdisplay name\b/gi, '')
          .replace(/\bdisplayname\b/gi, '')
          .replace(/\bmonument name\b/gi, '')
          .replace(/\bmonument\b/gi, '')
          .replace(/\bname\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim()
          .toUpperCase();

        if (!cleanName) return;

        // Importante: los monumentos y markers del API suelen venir en 0..mapSize
        const pos = getPosition(mon.x, mon.y, mapSize, true);

        L.marker(pos, {
          icon: L.divIcon({
            className: 'monument-label',
            html: `<div style="
              color: rgba(255,255,255,0.9);
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
              white-space: nowrap;
              text-shadow: 0 0 6px black, 0 0 3px black;
              letter-spacing: 0.1em;
              pointer-events: none;
              transform: translateX(-50%);
            ">${cleanName}</div>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
          }),
          interactive: false
        }).addTo(monumentsGroup);
      });
    }
  }, [L, monuments, showMonuments, mapSize, oceanMargin]);

  // Renderizar Marcadores (Jugadores, Equipos, Eventos)
  useEffect(() => {
    if (!L || !leafletMap.current) return;
    if (layersRef.current['markersGroup']) leafletMap.current.removeLayer(layersRef.current['markersGroup']);

    const markersGroup = L.layerGroup().addTo(leafletMap.current);
    layersRef.current['markersGroup'] = markersGroup;

    markers
      .filter(m => {
        // Tipo 0 = Undefined, ignorar
        if (!m.type || m.type === 0) return false;
        // Jugadores del equipo y marcadores de muerte → toggle showPlayers
        if (m.type === MARKER_TYPES.PLAYER || m.type === 'Death') return showPlayers;
        if (m.type === MARKER_TYPES.VENDING) return showVending;
        return showEvents; // EXPLOSION, CH47, CARGO, CRATE, GENERIC, HELI
      })
      .forEach(marker => {
        const popupHtml = `<div style="padding:0.5rem;color:white;"><strong style="color:var(--primary)">${marker.name || 'Marcador'}</strong></div>`;
        const shouldNormalize = marker.type !== MARKER_TYPES.PLAYER && marker.type !== 'Death';
        const pos = getPosition(marker.x, marker.y, mapSize, shouldNormalize);
        L.marker(pos, {
          icon: getIcon(L, marker.type, marker.name)
        }).addTo(markersGroup).bindPopup(popupHtml, { className: 'custom-popup-rust' });
      });

    // Renderizar Team Members (Vienen en data.team separadamente)
    if (showPlayers && team) {
      team.filter(tm => tm.isAlive && tm.x !== undefined).forEach(tm => {
        const pos = getPosition(tm.x, tm.y, mapSize);
        const color = tm.isOnline ? "#22c55e" : "#555";
        const iconHtml = `
          <div style="position: relative; width: 16px; height: 16px;">
            ${tm.isOnline ? `<div class="radar-pulse" style="position: absolute; inset: -4px; border: 2px solid ${color}; border-radius: 50%; pointer-events: none; z-index: 1;"></div>` : ''}
            <div style="background: ${color}; width: 100%; height: 100%; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color}; display: flex; align-items: center; justify-content: center; font-size: 8px; color: white; font-weight: 800; position: relative; z-index: 2;">
              ${tm.name?.charAt(0)}
            </div>
          </div>
        `;
        
        L.marker(pos, {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: iconHtml,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          })
        }).addTo(markersGroup).bindPopup(`<div style="padding:0.5rem;color:white;"><strong>${tm.name}</strong><br/>${tm.isOnline ? 'EN LÍNEA' : 'DESCONECTADO'}</div>`, { className: 'custom-popup-rust' });
      });
    }
  }, [L, markers, team, showEvents, showPlayers, showVending, mapSize, oceanMargin]);

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

      {/* DEBUG BADGE — eliminar después de confirmar que el mapa está correcto */}
      <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', zIndex: 2000, background: 'rgba(0,0,0,0.85)', border: '1px solid #ce422b', padding: '0.25rem 0.5rem', fontSize: '10px', fontFamily: 'monospace', color: '#ce422b', pointerEvents: 'none' }}>
        map={mapSize} ocean={effectiveOceanMargin} img={width}x{height}
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
           .leaflet-container { 
             background: #0a0a0b !important; 
           }
           .grid-cell-text { pointer-events: none; user-select: none; }
           .monument-label div { pointer-events: none; user-select: none; }
           .custom-popup-rust .leaflet-popup-tip { background: #050505; }
           
           /* Tactical Overlay Effects */
           .rust-map-wrapper::after {
             content: "";
             position: absolute;
             top: 0; left: 0; width: 100%; height: 100%;
             background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), 
                         linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03));
             background-size: 100% 3px, 3px 100%;
             pointer-events: none;
             z-index: 500;
             opacity: 0.3;
           }
           
           .rust-map-wrapper::before {
             content: "";
             position: absolute;
             top: 0; left: 0; width: 100%; height: 100%;
             background: radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.4) 100%);
             pointer-events: none;
             z-index: 501;
           }
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
