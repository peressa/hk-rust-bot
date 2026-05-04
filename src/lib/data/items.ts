export const RUST_ITEMS: Record<string, { name: string, iconUrl?: string }> = {
  // Base Resources
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
  "1854565415": { name: "Animal Fat" },
  
  // Tactical Gear
  "-1045862232": { name: "Auto Turret" },
  "-2104481819": { name: "Wind Turbine" },
  "-1813139150": { name: "Large Solar Panel" },
  "-1422703865": { name: "Large Rechargeable Battery" },
  "407268323": { name: "SAM Site" },
  "1653139589": { name: "Flame Turret" },
  
  // Components
  "-1893979803": { name: "Gears" },
  "140003444": { name: "Metal Pipe" },
  "-1332069796": { name: "Metal Spring" },
  "-1148153401": { name: "Rifle Body" },
  "-710582455": { name: "SMG Body" },
  "-1766663553": { name: "Semiconductor" },
  "-2128714193": { name: "Tech Trash" },
  "-1725510067": { name: "Road Signs" },
  "149049951": { name: "Sheet Metal" },
  "-1289412400": { name: "Empty Propane Tank" },
  "1263820272": { name: "Tarp" },
  "1263820271": { name: "Sewing Kit" },
  "1263820270": { name: "Rope" },
  
  // Weapons
  "1545779598": { name: "Assault Rifle (AK)" },
  "-1214542497": { name: "LR-300" },
  "1792816885": { name: "MP5A4" },
  "-1966983995": { name: "Thompson" },
  "-1335436608": { name: "Semi-Automatic Rifle" },
  "-2105470005": { name: "Python Revolver" },
  "-521568297": { name: "Custom SMG" },
  "1588298435": { name: "Semi-Automatic Pistol" },
  "-1312393920": { name: "Bolt Action Rifle" },
  "-1234735557": { name: "L96" },
  "795236088": { name: "M249" },
  "-411516043": { name: "Spas-12 Shotgun" },
  "-778367299": { name: "Pump Shotgun" },
  "-1506521408": { name: "Double Barrel Shotgun" },
  
  // Tools & Supplies
  "-158204335": { name: "Chainsaw" },
  "-158204334": { name: "Jackhammer" },
  "-158204333": { name: "Salvaged Icepick" },
  "-158204332": { name: "Salvaged Axe" },
  "1071055393": { name: "Medical Syringe" },
  "-2075828807": { name: "Medkit" },
  
  // Explosives & Ammo
  "-41440462": { name: "Explosives" },
  "-1063412582": { name: "Timed Explosive (C4)" },
  "-42023479": { name: "Satchel Charge" },
  "-2127112723": { name: "Rocket" },
  "1571149171": { name: "Explosive 5.56 Ammo" },
  "-1681283625": { name: "5.56 Rifle Ammo" },
  "1712070256": { name: "Pistol Ammo" },
  "-121377445": { name: "Incen. 5.56 Ammo" },
  "-1351111000": { name: "Timed Explosive" }
};

export function getItemName(itemId: string | number): string {
  const idStr = String(itemId);
  return RUST_ITEMS[idStr]?.name || `Item [${idStr}]`;
}

export function getItemIcon(itemId: string | number): string {
  return `https://files.facepunch.com/rust/itemicons/${itemId}.png`;
}
