import { ChevronDown, Search, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { AMENITIES, type AmenityKey } from "@/lib/amenities";
import { useI18n } from "@/lib/i18n";
import type { District, LsgBody, Taluk } from "@/lib/queries";
import { cn } from "@/lib/utils";

export type CampFilterValues = {
  district: string;
  taluk: string;
  lsg: string;
  status: "active" | "inactive" | "predesignated" | "all";
  verified: boolean;
  q: string;
  amenities: string[];
};

const selectClass =
  "tap-target w-full rounded-lg border border-border bg-surface px-3 text-sm font-medium outline-none focus-visible:border-accent";

export function CampFilters({
  value,
  onChange,
  onReset,
  districts,
  taluks,
  lsgBodies,
}: {
  value: CampFilterValues;
  onChange: (patch: Partial<CampFilterValues>) => void;
  onReset: () => void;
  districts: District[];
  taluks: Taluk[];
  lsgBodies: LsgBody[];
}) {
  const { t, locale } = useI18n();
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);
  const talukOptions = taluks.filter((row) => !value.district || row.district_code === value.district);
  const lsgOptions = lsgBodies.filter((row) => !value.district || row.district_code === value.district);
  const filtersActive =
    value.district ||
    value.taluk ||
    value.lsg ||
    value.q ||
    value.verified ||
    value.status !== "active" ||
    value.amenities.length > 0;

  const toggleAmenity = (key: AmenityKey) =>
    onChange({
      amenities: value.amenities.includes(key)
        ? value.amenities.filter((item) => item !== key)
        : [...value.amenities, key],
    });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={value.q}
          onChange={(event) => onChange({ q: event.target.value })}
          placeholder={t("filter.search")}
          aria-label={t("filter.search")}
          className="tap-target w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm outline-none focus-visible:border-accent"
        />
      </div>

      <div className="grid gap-2">
        <select
          className={selectClass}
          value={value.district}
          onChange={(event) => onChange({ district: event.target.value, taluk: "", lsg: "" })}
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
          value={value.taluk}
          onChange={(event) => onChange({ taluk: event.target.value, lsg: "" })}
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
          value={value.lsg}
          onChange={(event) => onChange({ lsg: event.target.value })}
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
        {(["active", "predesignated", "inactive", "all"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange({ status: option })}
            className={cn(
              "rounded-lg border px-3 py-2 text-xs font-semibold",
              value.status === option
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-secondary",
            )}
          >
            {t(
              option === "active"
                ? "filter.statusActive"
                : option === "predesignated"
                  ? "filter.statusPredesignated"
                  : option === "inactive"
                    ? "filter.statusInactive"
                    : "filter.statusAll",
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange({ verified: !value.verified })}
          aria-pressed={value.verified}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold",
            value.verified
              ? "border-verified bg-verified text-verified-foreground"
              : "border-border hover:bg-secondary",
          )}
        >
          <ShieldCheck className="size-4" />
          {t("filter.verifiedOnly")}
        </button>
      </div>

      <div className="rounded-lg border border-border">
        <button
          type="button"
          onClick={() => setAmenitiesOpen((open) => !open)}
          aria-expanded={amenitiesOpen}
          className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("filter.amenities")}
            {value.amenities.length > 0 ? ` (${value.amenities.length})` : ""}
          </span>
          <ChevronDown
            className={cn("size-4 shrink-0 text-muted-foreground transition-transform", amenitiesOpen && "rotate-180")}
          />
        </button>
        <div className={cn("px-3 pb-3", !amenitiesOpen && "hidden")}>
        <p className="text-xs text-muted-foreground">{t("filter.amenitiesHint")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {AMENITIES.map(({ key, icon: Icon }) => {
            const selected = value.amenities.includes(key);
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleAmenity(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
                  selected ? "border-accent bg-accent text-accent-foreground" : "border-border hover:bg-secondary",
                )}
              >
                <Icon className="size-3.5" />
                {t(`amenity.${key}`)}
              </button>
            );
          })}
        </div>
        </div>
      </div>

      {filtersActive ? (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
        >
          <X className="size-4" />
          {t("filter.reset")}
        </button>
      ) : null}
    </div>
  );
}
