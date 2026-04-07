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
    // FÓRMULA DE PRECISIÓN (Referencia RustPlus-Desktop):
    // 1. Calculamos cuántas celdas de ~150 metros caben en el mapa (redondeando).
    const numCells = Math.max(1, Math.round(mapSize / 150));
    // 2. El tamaño real de cada celda se escala para cubrir el mapSize exacto.
    const cellSize = mapSize / numCells;
    
    const worldHalf = mapSize / 2;
    // 3. Mapeamos la posición relativa al centro (x,y) al índice de la cuadrícula.
    // X (Letras) aumenta de izquierda a derecha.
    // Y (Números) aumenta de arriba (1) hacia abajo.
    const gridX = Math.floor((x + worldHalf) / cellSize);
    const gridY = Math.floor((worldHalf - y) / cellSize);
    
    // Aseguramos que los índices estén dentro del rango válido
    const safeX = Math.max(0, Math.min(gridX, numCells - 1));
    const safeY = Math.max(0, Math.min(gridY, numCells - 1));
    
    // En Rust in-game, la numeración empieza en 1 (A1, B2...).
    return `${indexToLetter(safeX)}${safeY + 1}`;
}

/**
 * Proyecta una coordenada de mundo a coordenadas de Leaflet (0-1000)
 */
export function worldToLeaflet(x: number, y: number, mapSize: number, oceanMargin: number) {
    // ESTÁNDAR DE REFERENCIA (RustPlus-Desktop):
    // El mapa se rinde con un padding fijo de 1000 por lado (Total 2000).
    const PAD_WORLD = 2000;
    const halfPad = PAD_WORLD / 2;
    const totalSize = mapSize + PAD_WORLD;

    // RustPlus-Desktop asume que x,y (de markers/team) están en rango [0, mapSize]
    // o centrados según el origen.
    // Si x es 0 (borde izq de isla), su posición en la imagen es halfPad (1000).
    const lng = ((x + halfPad) / totalSize) * 1000;
    // Y en Leaflet es invertido 0..1000 (arriba..abajo)
    // Pero RustPlus envia Y de abajo hacia arriba.
    const lat = ((y + halfPad) / totalSize) * 1000;
    
    return { lat, lng };
}
