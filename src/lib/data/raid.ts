export interface RaidCost {
  c4: number;
  rocket: number;
  satchel: number;
  explosiveAmmo: number;
}

export const RAID_TARGETS: Record<string, { name: string, costs: RaidCost }> = {
  "wood_door": {
    name: "Puerta de Madera",
    costs: { c4: 1, rocket: 1, satchel: 2, explosiveAmmo: 18 }
  },
  "sheet_door": {
    name: "Puerta de Chapa (Sheet)",
    costs: { c4: 1, rocket: 1, satchel: 4, explosiveAmmo: 63 }
  },
  "garage_door": {
    name: "Puerta de Garaje",
    costs: { c4: 1, rocket: 2, satchel: 9, explosiveAmmo: 150 }
  },
  "armored_door": {
    name: "Puerta Blindada (HQM)",
    costs: { c4: 2, rocket: 4, satchel: 15, explosiveAmmo: 250 }
  },
  "stone_wall": {
    name: "Pared de Piedra",
    costs: { c4: 2, rocket: 4, satchel: 10, explosiveAmmo: 185 }
  },
  "metal_wall": {
    name: "Pared de Metal",
    costs: { c4: 4, rocket: 8, satchel: 23, explosiveAmmo: 400 }
  },
  "armored_wall": {
    name: "Pared Blindada (HQM)",
    costs: { c4: 8, rocket: 15, satchel: 46, explosiveAmmo: 799 }
  },
  "external_stone": {
    name: "Muro Externo Piedra",
    costs: { c4: 2, rocket: 4, satchel: 10, explosiveAmmo: 185 }
  }
};
