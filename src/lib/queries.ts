import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Camp = Tables<"camps">;
export type District = Tables<"districts">;
export type Taluk = Tables<"taluks">;
export type LsgBody = Tables<"lsg_bodies">;
export type EmergencyContact = Tables<"emergency_contacts">;

export const campsQuery = () =>
  queryOptions({
    queryKey: ["camps"],
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    queryFn: async (): Promise<Camp[]> => {
      const { data, error } = await supabase
        .from("camps")
        .select("*")
        .in("verification_state", ["unverified", "verified"])
        .order("updated_at", { ascending: false })
        .limit(2000);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

export const campQuery = (id: string) =>
  queryOptions({
    queryKey: ["camp", id],
    queryFn: async (): Promise<Camp | null> => {
      const { data, error } = await supabase
        .from("camps")
        .select("*")
        .eq("id", id)
        .in("verification_state", ["unverified", "verified"])
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

export const districtsQuery = () =>
  queryOptions({
    queryKey: ["districts"],
    staleTime: Infinity,
    queryFn: async (): Promise<District[]> => {
      const { data, error } = await supabase.from("districts").select("*").order("sort_order");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

export const taluksQuery = () =>
  queryOptions({
    queryKey: ["taluks"],
    staleTime: Infinity,
    queryFn: async (): Promise<Taluk[]> => {
      const { data, error } = await supabase.from("taluks").select("*").order("name");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

export const lsgQuery = () =>
  queryOptions({
    queryKey: ["lsg"],
    staleTime: Infinity,
    queryFn: async (): Promise<LsgBody[]> => {
      const { data, error } = await supabase.from("lsg_bodies").select("*").order("name");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

export const emergencyContactsQuery = () =>
  queryOptions({
    queryKey: ["emergency-contacts"],
    staleTime: Infinity,
    queryFn: async (): Promise<EmergencyContact[]> => {
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

export type WeatherReading = {
  temperature: number;
  weatherCode: number;
  rainLast24h: number;
  rainNext24h: number;
  observedAt: string;
};

export const weatherQuery = (lat: number | null, lng: number | null) =>
  queryOptions({
    queryKey: ["weather", lat, lng],
    enabled: lat !== null && lng !== null,
    staleTime: 15 * 60_000,
    retry: 0,
    queryFn: async (): Promise<WeatherReading> => {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
        `&current=temperature_2m,weather_code&hourly=precipitation&past_days=1&forecast_days=2&timezone=Asia%2FKolkata`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("weather unavailable");
      const json = (await res.json()) as {
        current: { temperature_2m: number; weather_code: number; time: string };
        hourly: { time: string[]; precipitation: number[] };
      };
      const now = Date.now();
      let past = 0;
      let next = 0;
      json.hourly.time.forEach((t, i) => {
        const ts = new Date(t).getTime();
        const mm = json.hourly.precipitation[i] ?? 0;
        if (ts <= now && ts > now - 86_400_000) past += mm;
        if (ts > now && ts <= now + 86_400_000) next += mm;
      });
      return {
        temperature: json.current.temperature_2m,
        weatherCode: json.current.weather_code,
        rainLast24h: Math.round(past * 10) / 10,
        rainNext24h: Math.round(next * 10) / 10,
        observedAt: json.current.time,
      };
    },
  });
