/**
 * Utilidades para el manejo de coordenadas y cuadrículas de Rust.
 * El tamaño estándar de un cuadrante es 146.3 unidades de Unity.
 */

export const GRID_CELL_SIZE = 150;

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
 * Normaliza una coordenada que puede venir en formato 0..mapSize (markers) 
 * a formato mundo -half..half (equipo/muertes).
 */
export function normalizeToWorld(val: number, mapSize: number): number {
    // Si el valor es mayor que el tamaño del mapa o mayor que mapSize/2 significativamente,
    // es probable que sea una coordenada de marcador (0..mapSize).
    // Nota: los marcadores de Rust+ siempre son positivos.
    if (val > (mapSize / 2) + 100) {
        return val - (mapSize / 2);
    }
    return val;
}

/**
 * Convierte coordenadas de mundo Unity a formato de cuadrícula Rust (Ej: "M14")
 */
export function worldToGrid(x: number, y: number, mapSize: number): string {
    const worldHalf = mapSize / 2;
    
    // El número de celdas se redondea según el estándar de 146.25 unidades
    let numCells = Math.max(1, Math.ceil(mapSize / 146.25));
    if (mapSize >= 3000 && mapSize <= 3500) numCells = 23;
    
    const cellSize = mapSize / numCells;

    // Aseguramos que trabajamos con coordenadas centradas
    const nx = normalizeToWorld(x, mapSize);
    const ny = normalizeToWorld(y, mapSize);

    const gridX = Math.floor((nx + worldHalf) / cellSize);
    const gridY = Math.floor((worldHalf - ny) / cellSize);
    
    const safeX = Math.max(0, gridX);
    const safeY = Math.max(0, gridY);
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

    // X (lng): Izquierda a Derecha (Oeste a Este)
    const lng = ((x + worldHalf + oceanMargin) / totalSize) * 1000;
    
    // Y (lat): En Leaflet Simple CRS [[0,0],[1000,1000]], 0 es el SUR y 1000 es el NORTE.
    // Unity +Y es Norte. La proyección directa (y + worldHalf + margin) / totalSize 
    // nos da 1000 en el Norte y 0 en el Sur.
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
