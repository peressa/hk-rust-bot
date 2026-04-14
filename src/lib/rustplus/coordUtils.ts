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
    // ESTÁNDAR DE PRECISIÓN RUST+:
    // El mapa se rinde con un padding fijo de 1000 unidades Unity por cada lado.
    const PAD_SIDE = 1000;
    const worldHalf = mapSize / 2;
    const totalWorldSize = mapSize + (PAD_SIDE * 2);

    // Normalizar coordenadas (x,y suelen venir centradas en 0,0)
    // Desplazamos x,y para que el rango sea [0, totalWorldSize]
    // lng (X) de Izquierda a Derecha.
    // lat (Y) de Abajo a Arriba (Rust Y es latitud).
    const lng = ((x + worldHalf + PAD_SIDE) / totalWorldSize) * 1000;
    const lat = ((y + worldHalf + PAD_SIDE) / totalWorldSize) * 1000;
    
    return { lat, lng };
}
