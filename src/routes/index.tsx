import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Compass, Filter, RefreshCw, Search, ShieldCheck, X } from "lucide-react";
import { useMemo } from "react";
import { CampCard } from "@/components/CampCard";
import { isPreDesignated } from "@/components/badges";
import { WeatherPanel } from "@/components/WeatherPanel";
import { useI18n } from "@/lib/i18n";
import { haversineKm, matchesQuery } from "@/lib/format";
import { campsQuery, districtsQuery, lsgQuery, taluksQuery, type Camp } from "@/lib/queries";
import { useGeolocation } from "@/lib/useGeolocation";
import { cn } from "@/lib/utils";

type Search = {
  district: string;
  taluk: string;
  lsg: string;
  status: "active" | "inactive" | "predesignated" | "all";
  verified: boolean;
  q: string;
};

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    district: typeof search["district"] === "string" ? search["district"] : "",
    taluk: typeof search["taluk"] === "string" ? search["taluk"] : "",
    lsg: typeof search["lsg"] === "string" ? search["lsg"] : "",
    status:
      search["status"] === "inactive" ||
      search["status"] === "predesignated" ||
      search["status"] === "all"
        ? search["status"]
        : "active",
    verified: search["verified"] === true || search["verified"] === "true",
    q: typeof search["q"] === "string" ? search["q"].slice(0, 80) : "",
  }),
  head: () => ({
    meta: [
      { title: "Find an open relief camp in Kerala — Camp Check" },
      {
        name: "description",
        content:
          "Find the nearest relief camp in Kerala during a flood. Every camp shows who confirmed it and when. Community-sourced, not an official government portal.",
      },
      { property: "og:title", content: "Find an open relief camp in Kerala" },
      {
        property: "og:description",
        content:
          "Nearest relief camps with verification status, phone numbers and last-confirmed times. Community-sourced.",
      },
    ],
  }),
  component: CampListPage,
});

const urgencyRank: Record<string, number> = { critical: 0, high: 1, normal: 2 };

function CampListPage() {
  const { t, locale } = useI18n();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const { coords, status: geoStatus, request, clear } = useGeolocation();

  const camps = useQuery(campsQuery());
  const { data: districts = [] } = useQuery(districtsQuery());
  const { data: taluks = [] } = useQuery(taluksQuery());
  const { data: lsgBodies = [] } = useQuery(lsgQuery());

  const setSearch = (patch: Partial<Search>) =>
    navigate({ search: (prev: Search) => ({ ...prev, ...patch }), replace: true });

  const districtRow = districts.find((d) => d.code === search.district);
  const weatherPoint = coords
    ? { lat: coords.lat, lng: coords.lng, name: t("list.nearYou") }
    : districtRow?.latitude != null && districtRow.longitude != null
      ? {
          lat: Number(districtRow.latitude),
          lng: Number(districtRow.longitude),
          name: locale === "ml" && districtRow.name_ml ? districtRow.name_ml : districtRow.name,
        }
      : null;

  const rows = useMemo(() => {
    const list = (camps.data ?? []).filter((camp: Camp) => {
      if (search.district && camp.district_code !== search.district) return false;
      if (search.taluk && camp.taluk !== search.taluk) return false;
      if (search.lsg && camp.lsg_name !== search.lsg) return false;
      const preDesignated = isPreDesignated(camp);
      if (search.status === "predesignated" && !preDesignated) return false;
      if (search.status === "active" && camp.status !== "active") return false;
      if (search.status === "inactive" && (camp.status !== "inactive" || preDesignated)) return false;
      if (search.verified && camp.verification_state !== "verified") return false;
      if (
        search.q &&
        !matchesQuery(
          [camp.name, camp.name_ml, camp.lsg_name, camp.village_or_locality, camp.landmark, camp.taluk],
          search.q,
        )
      )
        return false;
      return true;
    });

    const withDistance = list.map((camp) => ({
      camp,
      distanceKm:
        coords && camp.latitude != null && camp.longitude != null
          ? haversineKm(coords, { lat: Number(camp.latitude), lng: Number(camp.longitude) })
          : null,
    }));

    // PUB-15: critical, then high, then distance, then most recently confirmed.
    withDistance.sort((a, b) => {
      const ua = urgencyRank[a.camp.urgency !== "normal" ? a.camp.urgency : (a.camp.reported_urgency ?? "normal")] ?? 2;
      const ub = urgencyRank[b.camp.urgency !== "normal" ? b.camp.urgency : (b.camp.reported_urgency ?? "normal")] ?? 2;
      if (ua !== ub) return ua - ub;
      if (a.distanceKm !== null && b.distanceKm !== null && a.distanceKm !== b.distanceKm)
        return a.distanceKm - b.distanceKm;
      if (a.distanceKm !== null && b.distanceKm === null) return -1;
      if (a.distanceKm === null && b.distanceKm !== null) return 1;
      return (
        new Date(b.camp.status_last_confirmed_at ?? 0).getTime() -
        new Date(a.camp.status_last_confirmed_at ?? 0).getTime()
      );
    });

    return withDistance;
  }, [camps.data, coords, search]);

  const talukOptions = taluks.filter((row) => !search.district || row.district_code === search.district);
  const lsgOptions = lsgBodies.filter((row) => !search.district || row.district_code === search.district);
  const filtersActive =
    search.district || search.taluk || search.lsg || search.q || search.verified || search.status !== "active";

  const selectClass =
    "tap-target w-full rounded-lg border border-border bg-surface px-3 text-sm font-medium outline-none focus-visible:border-accent";

  return (
    <div className="space-y-4">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            {coords ? t("list.nearYou") : t("list.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("list.count", { count: rows.length })}</p>
        </div>
        <button
          type="button"
          onClick={() => camps.refetch()}
          className="tap-target inline-flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-secondary"
        >
          <RefreshCw className={cn("size-4", camps.isFetching && "animate-spin")} />
          <span className="hidden sm:inline">{t("action.refresh")}</span>
        </button>
      </header>

      {/* PUB-1 / PUB-3: location prompt, with district fallback that is never an error state */}
      {!coords ? (
        <section className="panel p-4">
          <h2 className="text-sm font-semibold">{t("location.prompt")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("location.why")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={request}
              className="tap-target inline-flex items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground"
            >
              <Compass className={cn("size-4", geoStatus === "asking" && "animate-spin")} />
              {geoStatus === "asking" ? t("location.searching") : t("action.useLocation")}
            </button>
            {geoStatus === "denied" || geoStatus === "unavailable" ? (
              <span className="self-center text-xs text-unverified">{t("location.denied")}</span>
            ) : null}
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={clear}
          className="tap-target inline-flex items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold hover:bg-secondary"
        >
          <Compass className="size-4 text-accent" />
          {t("action.changeLocation")}
        </button>
      )}

      {weatherPoint ? (
        <WeatherPanel lat={weatherPoint.lat} lng={weatherPoint.lng} placeName={weatherPoint.name} />
      ) : null}

      <section className="panel space-y-3 p-4" aria-label={t("filter.search")}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search.q}
            onChange={(event) => setSearch({ q: event.target.value })}
            placeholder={t("filter.search")}
            className="tap-target w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm outline-none focus-visible:border-accent"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <select
            className={selectClass}
            value={search.district}
            onChange={(event) => setSearch({ district: event.target.value, taluk: "", lsg: "" })}
            aria-label={t("filter.district")}
          >
            <option value="">{t("filter.allDistricts")}</option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>
                {locale === "ml" && d.name_ml ? d.name_ml : d.name}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={search.taluk}
            onChange={(event) => setSearch({ taluk: event.target.value, lsg: "" })}
            aria-label={t("filter.taluk")}
          >
            <option value="">{t("filter.allTaluks")}</option>
            {talukOptions.map((row) => (
              <option key={row.id} value={row.name}>
                {row.name}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={search.lsg}
            onChange={(event) => setSearch({ lsg: event.target.value })}
            aria-label={t("filter.lsg")}
          >
            <option value="">{t("filter.allLsg")}</option>
            {lsgOptions.map((row) => (
              <option key={row.id} value={row.name}>
                {row.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(["active", "predesignated", "inactive", "all"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setSearch({ status: value })}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-semibold",
                search.status === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-secondary",
              )}
            >
              {t(
                value === "active"
                  ? "filter.statusActive"
                  : value === "predesignated"
                    ? "filter.statusPredesignated"
                    : value === "inactive"
                      ? "filter.statusInactive"
                      : "filter.statusAll",
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSearch({ verified: !search.verified })}
            aria-pressed={search.verified}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold",
              search.verified
                ? "border-verified bg-verified text-verified-foreground"
                : "border-border hover:bg-secondary",
            )}
          >
            <ShieldCheck className="size-4" />
            {t("filter.verifiedOnly")}
          </button>
          {filtersActive ? (
            <button
              type="button"
              onClick={() =>
                navigate({ search: { district: "", taluk: "", lsg: "", status: "active", verified: false, q: "" } })
              }
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
            >
              <X className="size-4" />
              {t("filter.reset")}
            </button>
          ) : null}
        </div>
      </section>

      {camps.isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("list.loading")}</p>
      ) : rows.length === 0 ? (
        <div className="panel p-8 text-center">
          <Filter className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-3 font-semibold">{t("list.empty")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("list.emptyHint")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map(({ camp, distanceKm }) => (
            <li key={camp.id}>
              <CampCard camp={camp} distanceKm={distanceKm} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
