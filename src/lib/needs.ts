import {
  Baby,
  Bath,
  Bed,
  Bike,
  Droplets,
  Footprints,
  HeartPulse,
  Package,
  Shirt,
  Soup,
  SprayCan,
  Utensils,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** Catalogue of relief items a camp can ask for. */
export const NEED_ITEMS: { key: string; icon: LucideIcon; unit: string }[] = [
  { key: "rice", icon: Package, unit: "kg" },
  { key: "cooked_food", icon: Soup, unit: "meals" },
  { key: "drinking_water", icon: Droplets, unit: "cans" },
  { key: "blankets", icon: Bed, unit: "pcs" },
  { key: "mats", icon: Bed, unit: "pcs" },
  { key: "clothes", icon: Shirt, unit: "sets" },
  { key: "sanitary_pads", icon: Bath, unit: "packs" },
  { key: "baby_food", icon: Baby, unit: "packs" },
  { key: "medicines", icon: HeartPulse, unit: "kits" },
  { key: "toiletries", icon: SprayCan, unit: "kits" },
  { key: "utensils", icon: Utensils, unit: "sets" },
  { key: "footwear", icon: Footprints, unit: "pairs" },
  { key: "power_backup", icon: Zap, unit: "units" },
  { key: "transport", icon: Bike, unit: "trips" },
];

export const NEED_KEYS = NEED_ITEMS.map((item) => item.key);

export function needIcon(key: string): LucideIcon {
  return NEED_ITEMS.find((item) => item.key === key)?.icon ?? Package;
}
