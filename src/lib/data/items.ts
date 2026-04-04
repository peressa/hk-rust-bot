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
  
  // Armas comunes
  "1545779598": { name: "Assault Rifle (AK)" },
  "-1214542497": { name: "LR-300" },
  "1792816885": { name: "MP5A4" },
  "-1966983995": { name: "Thompson" },
  "-1335436608": { name: "Semi-Automatic Rifle" },
  
  // Explosivos
  "-41440462": { name: "Explosives" },
  "-1063412582": { name: "C4" },
  "-42023479": { name: "Satchel Charge" },
  "-2127112723": { name: "Rocket" },
  
  // Munición
  "-1681283625": { name: "5.56 Rifle Ammo" },
  "1712070256": { name: "Pistol Ammo" }
};

export function getItemName(itemId: string | number): string {
  const idStr = String(itemId);
  return RUST_ITEMS[idStr]?.name || `Item [${idStr}]`;
}
