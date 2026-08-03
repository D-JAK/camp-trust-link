import { useEffect, useRef, useState } from "react";

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string | null;
  tone?: "active" | "inactive" | "predesignated";
};

const TONE_COLOR: Record<NonNullable<MapPoint["tone"]>, string> = {
  active: "#16a34a",
  inactive: "#dc2626",
  predesignated: "#f6a24a",
};

/**
 * Leaflet is browser-only: it is imported dynamically after mount so SSR never
 * evaluates it.
 */
export function CampMap({
  points,
  center,
  zoom = 9,
  className = "h-[420px]",
  onSelect,
}: {
  points: MapPoint[];
  center?: { lat: number; lng: number } | null;
  zoom?: number;
  className?: string;
  onSelect?: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(
        [center?.lat ?? 10.2, center?.lng ?? 76.3],
        zoom,
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    void (async () => {
      const L = await import("leaflet");
      const map = mapRef.current;
      const layer = layerRef.current;
      if (cancelled || !map || !layer) return;
      layer.clearLayers();

      points.forEach((point) => {
        const color = TONE_COLOR[point.tone ?? "active"];
        const marker = L.marker([point.lat, point.lng], {
          icon: L.divIcon({
            className: "",
            html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};box-shadow:0 0 0 3px rgba(255,255,255,.9),0 1px 4px rgba(0,0,0,.4)"></span>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          }),
          title: point.title,
        });
        marker.bindPopup(
          `<strong>${escapeHtml(point.title)}</strong>${
            point.subtitle ? `<br/><span>${escapeHtml(point.subtitle)}</span>` : ""
          }`,
        );
        if (onSelect) marker.on("click", () => onSelect(point.id));
        marker.addTo(layer);
      });

      if (points.length > 1) {
        map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])).pad(0.2));
      } else if (points.length === 1) {
        map.setView([points[0]!.lat, points[0]!.lng], Math.max(zoom, 15));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [points, ready, zoom, onSelect]);

  return <div ref={containerRef} className={`w-full ${className}`} aria-label="Map of relief camps" />;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}

export function googleMapsHref(lat: number | null, lng: number | null, fallbackQuery: string) {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery)}`;
}
