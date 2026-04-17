

/**
 * Convierte un índice numérico a letras (0 -> A, 1 -> B, 25 -> Z, 26 -> AA...)
 */
export function indexToLetter(index: number): string {
    let letter = "";
    let i = index;
    while (i >= 0) {
        letter = String.fromCharCode(65 + (i % 26)) + letter;
        i = Math.floor(i / 26) - 1;
    }
    return letter;
}

export const GRID_CELL_SIZE = 146.25;

/**
 * Normaliza una coordenada que puede venir en formato 0..mapSize (marcadores) 
 * a formato mundo -half..half (equipo/muertes).
 */
export function normalizeToWorld(val: number, mapSize: number): number {
    return val;
}

/**
 * Convierte coordenadas de mundo Unity a formato de cuadrícula Rust (Ej: "M14")
 */
export function worldToGrid(x: number, y: number, mapSize: number): string {
    const cellSize = 146.25;
    const numCells = Math.floor(mapSize / cellSize);
    const half = (numCells * cellSize) / 2;
    
    // Centrar coordenadas si vienen de API (0..mapSize)
    const nx = (x > mapSize * 0.6) ? (x - mapSize / 2) : x;
    const ny = (y > mapSize * 0.6) ? (y - mapSize / 2) : y;

    const gridX = Math.floor((nx + half) / cellSize);
    const gridY = Math.floor((half - ny) / cellSize);
    
    const safeX = Math.max(0, Math.min(gridX, numCells - 1));
    const safeY = Math.max(0, Math.min(gridY, numCells - 1));
    return `${indexToLetter(safeX)}${safeY}`;
}

/**
 * Proyecta una coordenada de mundo a coordenadas de Leaflet (0-1000)
 * North = Top (0), South = Bottom (1000)
 * @param x Coordenada X (Este/Oeste)
 * @param y Coordenada Y (Norte/Sur)
 * @param mapSize Tamaño del mapa (unidades Unity)
 * @param oceanMargin Margen de océano en cada lado (unidades Unity). Por defecto 0.
 */
export function worldToLeaflet(x: number, y: number, mapSize: number, oceanMargin: number = 0) {
    const worldHalf = mapSize / 2;
    const totalSize = mapSize + (oceanMargin * 2);

    // Normalizar a 0..1 y luego a 0..1000
    // Asumimos que x, y vienen centrados (-half..half)
    const lng = ((x + worldHalf + oceanMargin) / totalSize) * 1000;
    const lat = ((y + worldHalf + oceanMargin) / totalSize) * 1000;
    
    return { lat, lng };
}

/**
 * Obtiene el nombre de la región cardinal basada en el cuadrante (Arriba, Abajo, Derecha, Izquierda, Centro)
 */
export function getRegionName(x: number, y: number, mapSize: number): string {
    const worldHalf = mapSize / 2;
    const edgeMargin = mappingEdgeMargin(mapSize); // Margen dinámico para considerar "Borde"
    
    // Prioridad a bordes cardinales puros (útil para Deepsea)
    if (y > worldHalf - edgeMargin) return "Arriba (Norte)";
    if (y < -worldHalf + edgeMargin) return "Abajo (Sur)";
    if (x > worldHalf - edgeMargin) return "Derecha (Este)";
    if (x < -worldHalf + edgeMargin) return "Izquierda (Oeste)";

    const third = mapSize / 6;
    
    let lat = "";
    let lon = "";
    
    if (y > third) lat = "Arriba";
    else if (y < -third) lat = "Abajo";
    
    if (x > third) lon = "Derecha";
    else if (x < -third) lon = "Izquierda";
    
    if (!lat && !lon) return "Centro";
    if (!lat) return lon;
    if (!lon) return lat;
    
    return `${lat} a la ${lon}`;
}

function mappingEdgeMargin(mapSize: number): number {
    if (mapSize <= 3000) return 200;
    if (mapSize <= 4500) return 400;
    return 600;
}
