import { useCallback, useEffect, useState } from "react";

export type Coords = { lat: number; lng: number; accuracy: number | null };
type Status = "idle" | "asking" | "granted" | "denied" | "unavailable";

const STORAGE_KEY = "kcc.coords";

export function useGeolocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setCoords(JSON.parse(raw) as Coords);
        setStatus("granted");
      } catch {
        /* ignore */
      }
    }
  }, []);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    setStatus("asking");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next: Coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
        };
        setCoords(next);
        setStatus("granted");
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 120_000 },
    );
  }, []);

  const clear = useCallback(() => {
    setCoords(null);
    setStatus("idle");
    window.sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  return { coords, status, request, clear };
}

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}
