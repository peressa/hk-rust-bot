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

/**
 * Convierte coordenadas de mundo Unity a formato de cuadrícula Rust (Ej: "M14")
 * @param x Coordenada X del mundo
 * @param y Coordenada Y del mundo
 * @param mapSize Tamaño del mapa (ej: 4000)
 * @returns String formateado (ej: "A0", "B1")
 */
export function worldToGrid(x: number, y: number, mapSize: number): string {
    // En Rust oficial: 
    // X (Letras) aumenta de izquierda a derecha.
    // Y (Números) aumenta de ARRIBA hacia ABAJO.
    // A0 es la esquina superior izquierda.
    const gridX = Math.floor(x / GRID_SIZE);
    const gridY = Math.floor((mapSize - y) / GRID_SIZE);
    
    return `${indexToLetter(gridX)}${gridY}`;
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
