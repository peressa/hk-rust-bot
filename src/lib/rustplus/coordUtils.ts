/**
 * Utilidades para el manejo de coordenadas y cuadrículas de Rust.
 * El tamaño estándar de un cuadrante es 146.3 unidades de Unity.
 */

export const GRID_SIZE = 146.3;

/**
 * Convierte un índice numérico a letras (0 -> A, 1 -> B, 25 -> Z, 26 -> AA...)
 */
export function indexToLetter(index: number): string {
    const charCode = 65 + (index % 26);
    const suffix = index >= 26 ? Math.floor(index / 26) : "";
    return String.fromCharCode(charCode) + suffix;
}

/**
 * Convierte coordenadas de mundo Unity a formato de cuadrícula Rust (Ej: "M14")
 * @param x Coordenada X del mundo
 * @param y Coordenada Y del mundo
 * @param mapSize Tamaño del mapa (ej: 4000)
 * @returns String formateado (ej: "A0", "B1")
 */
export function worldToGrid(x: number, y: number, mapSize: number): string {
    // RustPlus para marcadores/team suele usar ya coordenadas en base 0 respecto al área jugable.
    const gridX = Math.floor(x / GRID_SIZE);
    const gridY = Math.floor(y / GRID_SIZE);
    
    // Invertimos Y porque en Rust la cuadrícula 0 suele estar al norte (superior).
    const numCells = Math.ceil(mapSize / GRID_SIZE);
    const invertedY = (numCells - 1) - gridY;
    
    return `${indexToLetter(gridX)}${invertedY}`;
}

/**
 * Proyecta una coordenada de mundo a coordenadas de Leaflet (0-1000)
 */
export function worldToLeaflet(x: number, y: number, mapSize: number, oceanMargin: number) {
    const totalSize = mapSize + (oceanMargin * 2);
    
    const lng = ((x + oceanMargin) / totalSize) * 1000;
    const lat = ((y + oceanMargin) / totalSize) * 1000;
    
    return { lat, lng };
}
