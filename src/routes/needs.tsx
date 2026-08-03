import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, PackageSearch } from "lucide-react";
import { useMemo, useState } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Hint, InfoTip } from "@/components/InfoTip";
import { useI18n } from "@/lib/i18n";
import { needIcon } from "@/lib/needs";
import { campsByIdsQuery, districtsQuery, needsQuery, type Camp } from "@/lib/queries";

export const Route = createFileRoute("/needs")({
  head: () => ({
    meta: [
      { title: "Relief camp requirements — Kerala Camp Check" },
      {
        name: "description",
        content:
          "What Kerala relief camps need right now: rice, water, blankets, medicines and more, with quantities still pending and the camp to contact.",
      },
      { property: "og:title", content: "Relief camp requirements — Kerala Camp Check" },
      {
        property: "og:description",
        content: "Live list of items relief camps need, with pending quantities and camp details.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NeedsPage,
});

const PAGE = 40;

function NeedsPage() {
  const { t, locale } = useI18n();
  const { data: needs = [], isLoading } = useQuery(needsQuery());
  const { data: districts = [] } = useQuery(districtsQuery());
  const [item, setItem] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [page, setPage] = useState(1);

  const campIds = useMemo(() => Array.from(new Set(needs.map((n) => n.camp_id))), [needs]);
  const { data: camps = [] } = useQuery(campsByIdsQuery(campIds));
  const campList = camps as Camp[];
  const campById = useMemo(() => new Map(campList.map((c) => [c.id, c])), [campList]);

  const rows = useMemo(
    () =>
      needs
        .map((need) => ({ need, camp: campById.get(need.camp_id) ?? null }))
        .filter(({ need, camp }) => {
          if (item && need.item_key !== item) return false;
          if (district && camp?.district_code !== district) return false;
          return true;
        }),
    [needs, campById, item, district],
  );

  const totals = useMemo(() => {
    const map = new Map<string, { needed: number; pledged: number; unit: string; camps: number }>();
    for (const { need, camp } of needs.map((need) => ({ need, camp: campById.get(need.camp_id) ?? null }))) {
      if (district && camp?.district_code !== district) continue;
      const cur = map.get(need.item_key) ?? { needed: 0, pledged: 0, unit: need.unit, camps: 0 };
      cur.needed += need.needed_qty;
      cur.pledged += need.pledged_qty;
      cur.camps += 1;
      map.set(need.item_key, cur);
    }
    return [...map.entries()].sort((a, b) => b[1].needed - b[1].pledged - (a[1].needed - a[1].pledged));
  }, [needs, campById, district]);

  const visible = rows.slice(0, page * PAGE);

  return (
    <div className="space-y-4">
      <div className="sticky top-[5.4rem] z-20 -mx-4 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:top-[3.6rem]">
        <Breadcrumbs items={[{ label: t("crumb.camps"), to: "/" }, { label: t("nav.needs") }]} />
      </div>

      <header className="flex flex-wrap items-center gap-2">
        <h1 className="inline-flex items-center gap-1.5 font-display text-2xl font-bold sm:text-3xl">
          <PackageSearch className="size-6 text-accent" />
          {t("nav.needs")}
        </h1>
        <InfoTip label={t("need.disclaimer")} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setPage(1);
            }}
            aria-label={t("filter.district")}
            className="tap-target rounded-lg border border-border bg-card px-2 text-sm"
          >
            <option value="">{t("filter.allDistricts")}</option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>
                {locale === "ml" && d.name_ml ? d.name_ml : d.name}
              </option>
            ))}
          </select>
          <select
            value={item}
            onChange={(e) => {
              setItem(e.target.value);
              setPage(1);
            }}
            aria-label={t("need.title")}
            className="tap-target rounded-lg border border-border bg-card px-2 text-sm"
          >
            <option value="">{t("needs.allItems")}</option>
            {totals.map(([key]) => (
              <option key={key} value={key}>
                {t(`need.${key}`)}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Item summary */}
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {totals.map(([key, sum]) => {
          const Icon = needIcon(key);
          const remaining = Math.max(0, sum.needed - sum.pledged);
          const active = item === key;
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => {
                  setItem(active ? "" : key);
                  setPage(1);
                }}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  active ? "border-accent bg-accent/10" : "border-border bg-card hover:bg-secondary"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className="size-4 shrink-0 text-accent" />
                  <span className="truncate">{t(`need.${key}`)}</span>
                </span>
                <span className="mt-1 block text-lg font-bold">
                  {remaining} <span className="text-xs font-medium text-muted-foreground">{sum.unit}</span>
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {t("needs.campCount", { count: sum.camps })}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Rows */}
      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">{t("list.loading")}</p>
      ) : visible.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">{t("list.requirementsEmpty")}</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {visible.map(({ need, camp }) => {
            const Icon = needIcon(need.item_key);
            const remaining = Math.max(0, need.needed_qty - need.pledged_qty);
            return (
              <li key={need.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3">
                <div className="min-w-0">
                  <p className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold">
                    <Icon className="size-4 shrink-0 text-accent" />
                    <span className="truncate">{need.label ?? t(`need.${need.item_key}`)}</span>
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                        need.urgency === "critical"
                          ? "bg-critical/10 text-critical"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {remaining} {need.unit}
                    </span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {camp
                      ? [camp.name, camp.district_code, camp.lsg_name].filter(Boolean).join(" › ")
                      : t("needs.unknownCamp")}
                  </p>
                </div>
                <Hint label={t("needs.viewCamp")}>
                  <Link
                    to="/camps/$campId"
                    params={{ campId: need.camp_id }}
                    aria-label={t("needs.viewCamp")}
                    className="tap-target inline-flex items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-secondary"
                  >
                    <Eye className="size-4 text-accent" />
                  </Link>
                </Hint>
              </li>
            );
          })}
        </ul>
      )}

      {visible.length < rows.length ? (
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          className="tap-target w-full rounded-lg border border-border text-sm font-semibold hover:bg-secondary"
        >
          {t("list.loadMore")}
        </button>
      ) : null}
    </div>
  );
}
