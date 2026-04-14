export const RUST_ITEMS: Record<string, { name: string, iconUrl?: string }> = {
  // Monedas y Recursos base
  "-932201673": { name: "Scrap" },
  "312903422": { name: "Wood" },
  "-892070738": { name: "Stone" },
  "-2099697608": { name: "Metal Fragments" },
  "69511070": { name: "High Quality Metal" },
  "-1154594051": { name: "Sulfur" },
  "28178745": { name: "Gun Powder" },
  "317398316": { name: "Cloth" },
  "-193805271": { name: "Leather" },
  "-151838493": { name: "Low Grade Fuel" },
  "-1045862232": { name: "Auto Turret" },
  "-2104481819": { name: "Wind Turbine" },
  "-1813139150": { name: "Large Solar Panel" },
  "-1422703865": { name: "Large Rechargeable Battery" },
  
  // Componentes
  "-1893979803": { name: "Gears" },
  "140003444": { name: "Metal Pipe" },
  "-1332069796": { name: "Metal Spring" },
  "-1148153401": { name: "Rifle Body" },
  "-710582455": { name: "SMG Body" },
  "-1766663553": { name: "Semiconductor" },
  "-2128714193": { name: "Tech Trash" },
  
  // Armas comunes
  "1545779598": { name: "Assault Rifle (AK)" },
  "-1214542497": { name: "LR-300" },
  "1792816885": { name: "MP5A4" },
  "-1966983995": { name: "Thompson" },
  "-1335436608": { name: "Semi-Automatic Rifle" },
  "-2105470005": { name: "Python Revolver" },
  "-521568297": { name: "Custom SMG" },
  "1588298435": { name: "Semi-Automatic Pistol" },
  
  // Explosivos
  "-41440462": { name: "Explosives" },
  "-1063412582": { name: "C4" },
  "-42023479": { name: "Satchel Charge" },
  "-2127112723": { name: "Rocket" },
  "1571149171": { name: "Explosive 5.56 Ammo" },
  
  // Munición
  "-1681283625": { name: "5.56 Rifle Ammo" },
  "1712070256": { name: "Pistol Ammo" },
  "-1691396643": { name: "Pistol Bullet" },
  "-1351111000": { name: "Timed Explosive" }
};

export function getItemName(itemId: string | number): string {
  const idStr = String(itemId);
  return RUST_ITEMS[idStr]?.name || `Item [${idStr}]`;
}

export function getItemIcon(itemId: string | number): string {
  // CDN oficial de Rust+ para iconos de items
  return `https://files.facepunch.com/rust/itemicons/${itemId}.png`;
}
