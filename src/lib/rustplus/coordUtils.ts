/**
 * Utilidades para el manejo de coordenadas y cuadrículas de Rust.
 * El tamaño estándar de un cuadrante es 146.3 unidades de Unity.
 */

export const GRID_SIZE = 150;

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
 * Convierte coordenadas de mundo Unity a formato de cuadrícula Rust (Ej: "M14")
 */
export function worldToGrid(x: number, y: number, mapSize: number): string {
    const worldHalf = mapSize / 2;
    
    // X aumenta hacia el Este (Derecha) -> A, B, C...
    const gridX = Math.floor((x + worldHalf) / GRID_CELL_SIZE);
    
    // Y disminuye hacia el Sur (Abajo). In-game el 0 está en el Norte.
    const gridY = Math.floor((worldHalf - y) / GRID_CELL_SIZE);
    
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

    // X (lng): Izquierda a Derecha
    // El punto central del mundo (0,0) está en (mapSize/2 + margin) / totalSize
    const lng = ((x + worldHalf + oceanMargin) / totalSize) * 1000;
    
    // Y (lat): En Leaflet Simple CRS, 0 es TOP, 1000 es BOTTOM.
    // Unity +Y es Norte (Top). Por tanto lat = 1000 - (proyección normal).
    const latNormal = ((y + worldHalf + oceanMargin) / totalSize) * 1000;
    const lat = 1000 - latNormal;
    
    return { lat, lng };
}

/**
 * Obtiene el nombre de la región cardinal basada en el cuadrante (Norte, Sur, Este, Oeste, Centro)
 */
export function getRegionName(x: number, y: number, mapSize: number): string {
    const third = mapSize / 4;
    
    let lat = "";
    let lon = "";
    
    if (y > third) lat = "Top";
    else if (y < -third) lat = "Bottom";
    
    if (x > third) lon = "Right";
    else if (x < -third) lon = "Left";
    
    if (!lat && !lon) return "Center";
    if (!lat) return lon;
    if (!lon) return lat;
    
    return `${lat} ${lon}`;
}
