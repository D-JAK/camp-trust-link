import { useQuery } from "@tanstack/react-query";
import { CloudRain, Thermometer } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatIst } from "@/lib/format";
import { weatherQuery } from "@/lib/queries";

export function WeatherPanel({
  lat,
  lng,
  placeName,
}: {
  lat: number | null;
  lng: number | null;
  placeName: string;
}) {
  const { t } = useI18n();
  const { data, isError } = useQuery(weatherQuery(lat, lng));

  // WX-6: hide the module entirely rather than show stale or placeholder weather.
  if (isError || !data) return null;

  return (
    <section className="panel p-4" aria-label={t("weather.title")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{t("weather.title")}</h2>
          <p className="text-xs text-muted-foreground">{placeName}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-2xl font-semibold">
          <Thermometer className="size-5 text-accent" />
          {Math.round(data.temperature)}°C
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-secondary p-3">
          <dt className="text-xs text-muted-foreground">{t("weather.rain24")}</dt>
          <dd className="mt-0.5 inline-flex items-center gap-1.5 font-semibold">
            <CloudRain className="size-4 text-accent" />
            {data.rainLast24h} mm
          </dd>
        </div>
        <div className="rounded-lg bg-secondary p-3">
          <dt className="text-xs text-muted-foreground">{t("weather.rainNext")}</dt>
          <dd className="mt-0.5 inline-flex items-center gap-1.5 font-semibold">
            <CloudRain className="size-4 text-accent" />
            {data.rainNext24h} mm
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">
        {t("weather.source")} · {formatIst(data.observedAt)} IST
      </p>
    </section>
  );
}
