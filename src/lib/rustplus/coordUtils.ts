

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

// Tamaño exacto de celda de grilla en Rust (fuente: TerrainTexturing.cs)
export const GRID_CELL_SIZE = 146.28571428571428;


/**
 * Convierte coordenadas de mundo Unity a formato de cuadrícula Rust (Ej: "M14")
 * 
 * En Rust, las coordenadas del mundo van de -mapSize/2 a mapSize/2.
 * La grilla A0, B0... cubre exactamente el área de tierra (mapSize unidades).
 * Las filas comienzan en 0, no en 1.
 * 
 * @param x Coordenada X (centrada en 0, rango -half..half)
 * @param y Coordenada Y (centrada en 0, rango -half..half) 
 * @param mapSize Tamaño del mundo (solo tierra, sin océano)
 */
export function worldToGrid(x: number, y: number, mapSize: number): string {
    const cellSize = GRID_CELL_SIZE;
    const half = mapSize / 2;

    // Si las coordenadas vienen en 0..mapSize, centrarlas
    const nx = (x > mapSize * 0.6) ? (x - half) : x;
    const ny = (y > mapSize * 0.6) ? (y - half) : y;

    // Columna: desde -half (izquierda/oeste) hacia +half (derecha/este)
    const colIndex = Math.floor((nx + half) / cellSize);
    // Fila: desde +half (arriba/norte) hacia -half (abajo/sur)
    const rowIndex = Math.floor((half - ny) / cellSize);

    // Calcular límites de la grilla basado en el tamaño del mapa
    const maxIndex = Math.floor(mapSize / cellSize);

    if (colIndex < 0 || rowIndex < 0 || colIndex >= maxIndex || rowIndex >= maxIndex) return "Water";
    
    // Rust usa filas 0-indexed (A0, B0, C0...)
    return `${indexToLetter(colIndex)}${rowIndex}`;
}

/**
 * Proyecta coordenadas de píxel del mapa (0..totalSize) a coordenadas de Leaflet (0..1000).
 * 
 * La imagen JPG del mapa cubre toda el área: tierra + océano por ambos lados.
 * totalSize = mapSize + 2 * oceanMargin (en píxeles/unidades Unity, 1:1).
 * 
 * Las coordenadas de monumentos y markers del proto Rust+ vienen en este
 * sistema de píxeles (0..totalSize), con (0,0) en la esquina inferior-izquierda.
 * 
 * @param x Coordenada X en píxeles del mapa (0..totalSize)
 * @param y Coordenada Y en píxeles del mapa (0..totalSize)
 * @param totalSize Tamaño total del mapa en píxeles (width del proto = mapSize + 2*oceanMargin)
 */
export function mapPixelToLeaflet(x: number, y: number, totalSize: number) {
    // Normalizar a 0..1 y luego a 0..1000
    // En Leaflet CRS.Simple: lat crece hacia arriba (norte), lng crece hacia la derecha (este)
    const lng = (x / totalSize) * 1000;
    const lat = (y / totalSize) * 1000;
    
    return { lat, lng };
}

/**
 * Proyecta una coordenada de mundo centrada (-half..half) a Leaflet (0..1000).
 * Tiene en cuenta el oceanMargin para posicionar correctamente dentro de la imagen total.
 * 
 * @param x Coordenada X centrada (-half..half)
 * @param y Coordenada Y centrada (-half..half)
 * @param mapSize Tamaño del mundo (solo tierra)
 * @param oceanMargin Margen de océano en cada lado
 */
export function worldToLeaflet(x: number, y: number, mapSize: number, oceanMarginPx: number = 0, imageWidthPx: number = 1000) {
    const worldHalf = mapSize / 2;
    const landWidthPx = imageWidthPx - (2 * oceanMarginPx);
    const pixelsPerMeter = landWidthPx / mapSize;
    const landPixelX = (x + worldHalf) * pixelsPerMeter;
    const landPixelY = (y + worldHalf) * pixelsPerMeter;
    const finalPixelX = landPixelX + oceanMarginPx;
    const finalPixelY = landPixelY + oceanMarginPx;
    const lng = (finalPixelX / imageWidthPx) * 1000;
    const lat = (finalPixelY / imageWidthPx) * 1000;
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
