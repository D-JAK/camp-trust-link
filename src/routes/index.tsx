import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  Compass,
  Filter,
  LayoutGrid,
  List as ListIcon,
  Map as MapIcon,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";
import { CampCard } from "@/components/CampCard";
import { CampFilters } from "@/components/CampFilters";
import { CampMap, type MapPoint } from "@/components/CampMap";
import { CampRow } from "@/components/CampRow";
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
  amenities: string;
  view: "card" | "list";
  tab: "camps" | "requirements";
  page: number;
};

const PAGE_SIZE = 20;
const emptySearch: Search = {
  district: "",
  taluk: "",
  lsg: "",
  status: "active",
  verified: false,
  q: "",
  amenities: "",
  view: "card",
  tab: "camps",
  page: 1,
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
    amenities: typeof search["amenities"] === "string" ? search["amenities"].slice(0, 200) : "",
    view: search["view"] === "list" ? "list" : "card",
    tab: search["tab"] === "requirements" ? "requirements" : "camps",
    page: Number(search["page"]) > 0 ? Math.floor(Number(search["page"])) : 1,
  }),
  head: () => ({
    meta: [
      { title: "Find an open relief camp in Kerala — Camp Check" },
      {
        name: "description",
        content:
          "Find the nearest relief camp in Kerala during a flood. Every camp shows who confirmed it and when. Community-sourced, not an official government portal.",
      },
      { property: "og:title", content: "Find an open relief camp in Kerala — Camp Check" },
      {
        property: "og:description",
        content:
          "Find the nearest relief camp in Kerala during a flood. Every camp shows who confirmed it and when. Community-sourced, not an official government portal.",
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
  const [showMap, setShowMap] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const camps = useQuery(campsQuery(search.district || null));
  const { data: districts = [] } = useQuery(districtsQuery());
  const { data: taluks = [] } = useQuery(taluksQuery());
  const { data: lsgBodies = [] } = useQuery(lsgQuery());

  const amenityFilters = useMemo<string[]>(
    () => search.amenities.split(",").filter(Boolean),
    [search.amenities],
  );

  const setSearch = (patch: Partial<Search>) =>
    navigate({ search: (prev: Search) => ({ ...prev, page: 1, ...patch }), replace: true });

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
      if (amenityFilters.length > 0) {
        const available = camp.amenities ?? [];
        if (!amenityFilters.every((key: string) => available.includes(key))) return false;
      }
      if (search.tab === "requirements") {
        const level = camp.urgency !== "normal" ? camp.urgency : (camp.reported_urgency ?? "normal");
        if (level === "normal") return false;
      }
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
  }, [camps.data, coords, search, amenityFilters]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, search.page), pageCount);
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const mapPoints = useMemo<MapPoint[]>(
    () =>
      rows
        .filter(({ camp }) => camp.latitude != null && camp.longitude != null)
        .slice(0, 400)
        .map(({ camp }) => ({
          id: camp.id,
          lat: Number(camp.latitude),
          lng: Number(camp.longitude),
          title: camp.name,
          subtitle: [camp.lsg_name, camp.taluk].filter(Boolean).join(", "),
          tone: isPreDesignated(camp) ? "predesignated" : camp.status === "active" ? "active" : "inactive",
        })),
    [rows],
  );

  const filterValues = {
    district: search.district,
    taluk: search.taluk,
    lsg: search.lsg,
    status: search.status,
    verified: search.verified,
    q: search.q,
    amenities: amenityFilters,
  };

  const filterPanel = (
    <CampFilters
      value={filterValues}
      onChange={(patch) => {
        const { amenities, ...rest } = patch;
        setSearch({
          ...rest,
          ...(amenities ? { amenities: amenities.join(",") } : {}),
        });
      }}
      onReset={() => navigate({ search: { ...emptySearch, view: search.view, tab: search.tab } })}
      districts={districts}
      taluks={taluks}
      lsgBodies={lsgBodies}
    />
  );

  return (
    <div className="space-y-4">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            {coords ? t("list.nearYou") : t("list.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("list.count", { count: rows.length })}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMap((value) => !value)}
            aria-pressed={showMap}
            className={cn(
              "tap-target inline-flex items-center gap-2 rounded-lg border px-3 text-sm font-semibold",
              showMap ? "border-accent bg-accent text-accent-foreground" : "border-border hover:bg-secondary",
            )}
          >
            <MapIcon className="size-4" />
            <span className="hidden sm:inline">{showMap ? t("map.hide") : t("map.show")}</span>
          </button>
          <button
            type="button"
            onClick={() => camps.refetch()}
            className="tap-target inline-flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-secondary"
          >
            <RefreshCw className={cn("size-4", camps.isFetching && "animate-spin")} />
            <span className="hidden sm:inline">{t("action.refresh")}</span>
          </button>
        </div>
      </header>

      {/* Camps ⇄ Requirements switch, plus view mode */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label={t("tab.camps")}
          className="inline-flex rounded-full border border-border bg-surface p-1"
        >
          {(["camps", "requirements"] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              type="button"
              aria-selected={search.tab === tab}
              onClick={() => setSearch({ tab })}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                search.tab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary",
              )}
            >
              {t(tab === "camps" ? "tab.camps" : "tab.requirements")}
            </button>
          ))}
        </div>

        <div className="inline-flex items-center gap-1 rounded-lg border border-border p-1">
          {(
            [
              ["card", LayoutGrid, "view.card"],
              ["list", ListIcon, "view.list"],
            ] as const
          ).map(([mode, Icon, label]) => (
            <button
              key={mode}
              type="button"
              aria-pressed={search.view === mode}
              aria-label={t(label)}
              onClick={() => navigate({ search: (prev: Search) => ({ ...prev, view: mode }), replace: true })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold",
                search.view === mode ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60",
              )}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{t(label)}</span>
            </button>
          ))}
        </div>
      </div>

      {showMap ? (
        <section className="panel overflow-hidden">
          {mapPoints.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">{t("map.noPoints")}</p>
          ) : (
            <CampMap
              points={mapPoints}
              center={coords ? { lat: coords.lat, lng: coords.lng } : null}
              onSelect={(id) => navigate({ to: "/camps/$campId", params: { campId: id } })}
            />
          )}
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        {/* Collapsible filter sidebar */}
        <section className="panel lg:sticky lg:top-4">
          <button
            type="button"
            onClick={() => setFiltersOpen((value) => !value)}
            aria-expanded={filtersOpen}
            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-semibold"
          >
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-accent" />
              {t("filter.title")}
            </span>
            <ChevronDown className={cn("size-4 transition-transform", !filtersOpen && "-rotate-90")} />
          </button>
          {filtersOpen ? <div className="border-t border-border p-4">{filterPanel}</div> : null}
        </section>

        <div className="space-y-4">
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

          {search.tab === "requirements" ? (
            <p className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
              {t("tab.requirementsHint")}
            </p>
          ) : null}

          {camps.isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{t("list.loading")}</p>
          ) : rows.length === 0 ? (
            <div className="panel p-8 text-center">
              <Filter className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-3 font-semibold">
                {t(search.tab === "requirements" ? "list.requirementsEmpty" : "list.empty")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {search.status !== "active" && !search.district ? t("list.pickDistrict") : t("list.emptyHint")}
              </p>
            </div>
          ) : (
            <>
              <ul className={cn(search.view === "list" ? "space-y-2" : "grid gap-3 xl:grid-cols-2")}>
                {pageRows.map(({ camp, distanceKm }) => (
                  <li key={camp.id}>
                    {search.view === "list" ? (
                      <CampRow camp={camp} distanceKm={distanceKm} />
                    ) : (
                      <CampCard camp={camp} distanceKm={distanceKm} />
                    )}
                  </li>
                ))}
              </ul>

              {pageCount > 1 ? (
                <nav className="flex items-center justify-between gap-3" aria-label={t("page.label")}>
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() =>
                      navigate({ search: (prev: Search) => ({ ...prev, page: page - 1 }), replace: true })
                    }
                    className="tap-target inline-flex items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-secondary disabled:opacity-40"
                  >
                    {t("page.prev")}
                  </button>
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("page.of", { page, pages: pageCount })}
                  </span>
                  <button
                    type="button"
                    disabled={page >= pageCount}
                    onClick={() =>
                      navigate({ search: (prev: Search) => ({ ...prev, page: page + 1 }), replace: true })
                    }
                    className="tap-target inline-flex items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-secondary disabled:opacity-40"
                  >
                    {t("page.next")}
                  </button>
                </nav>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
