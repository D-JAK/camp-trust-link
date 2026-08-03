export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

const IST = "Asia/Kolkata";

export function formatIst(value: string | number | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function hoursSince(value: string | null | undefined): number | null {
  if (!value) return null;
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return null;
  return (Date.now() - then) / 3_600_000;
}

export type Staleness = "fresh" | "caution" | "warning" | "never";

export function stalenessOf(lastConfirmedAt: string | null | undefined): Staleness {
  const h = hoursSince(lastConfirmedAt);
  if (h === null) return "never";
  if (h > 72) return "warning";
  if (h > 24) return "caution";
  return "fresh";
}

/** Tolerant search key: strips punctuation and common transliteration variance. */
export function searchKey(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\u0d00-\u0d7f ]/g, " ")
    .replace(/\b(govt|government)\b/g, "govt")
    .replace(/\b(ghss|gvhss|hss|hs|lps|ups|up|lp)\b/g, "")
    .replace(/(?:zh|dh|th|kh|gh|ch|sh|bh|ph)/g, (m) => m[0]!)
    .replace(/y$/g, "i")
    .replace(/i(?= |$)/g, "i")
    .replace(/([a-z])\1+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesQuery(haystacks: Array<string | null | undefined>, query: string): boolean {
  const q = searchKey(query);
  if (!q) return true;
  const terms = q.split(" ").filter(Boolean);
  const hay = haystacks.filter(Boolean).map((h) => searchKey(String(h))).join(" ");
  const raw = haystacks.filter(Boolean).join(" ").toLowerCase();
  return terms.every((term) => hay.includes(term) || raw.includes(term));
}

export function normalisePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const ten = digits.length > 10 ? digits.slice(-10) : digits;
  if (!/^[6-9]\d{9}$/.test(ten)) return null;
  return `+91${ten}`;
}

export function displayPhone(e164: string): string {
  const digits = e164.replace(/\D/g, "").slice(-10);
  return digits.length === 10 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : e164;
}
