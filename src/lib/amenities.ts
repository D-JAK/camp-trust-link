import {
  BedDouble,
  Blocks,
  Droplets,
  HeartPulse,
  PawPrint,
  Plug,
  ShowerHead,
  Signal,
  Soup,
  Toilet,
  Accessibility,
  Shirt,
  type LucideIcon,
} from "lucide-react";

export type AmenityKey =
  | "food"
  | "drinking_water"
  | "toilets"
  | "bathing"
  | "medical"
  | "power"
  | "mobile_network"
  | "bedding"
  | "clothes"
  | "children_space"
  | "accessible"
  | "pets_allowed";

export const AMENITIES: { key: AmenityKey; icon: LucideIcon }[] = [
  { key: "food", icon: Soup },
  { key: "drinking_water", icon: Droplets },
  { key: "toilets", icon: Toilet },
  { key: "bathing", icon: ShowerHead },
  { key: "medical", icon: HeartPulse },
  { key: "power", icon: Plug },
  { key: "mobile_network", icon: Signal },
  { key: "bedding", icon: BedDouble },
  { key: "clothes", icon: Shirt },
  { key: "children_space", icon: Blocks },
  { key: "accessible", icon: Accessibility },
  { key: "pets_allowed", icon: PawPrint },
];

export const AMENITY_KEYS = AMENITIES.map((amenity) => amenity.key);

export function amenityIcon(key: string): LucideIcon | null {
  return AMENITIES.find((amenity) => amenity.key === key)?.icon ?? null;
}
