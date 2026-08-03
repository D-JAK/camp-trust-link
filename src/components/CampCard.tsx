import { Link } from "@tanstack/react-router";
import { ChevronRight, MapPin, Navigation, Phone, Users } from "lucide-react";
import {
  isPreDesignated,
  PreDesignatedBadge,
  StalenessNote,
  StatusBadge,
  UrgencyBadge,
  VerificationBadge,
} from "@/components/badges";
import { googleMapsHref } from "@/components/CampMap";
import { amenityIcon } from "@/lib/amenities";
import { useI18n } from "@/lib/i18n";
import { formatIst, stalenessOf } from "@/lib/format";
import type { Camp, CampNeed } from "@/lib/queries";
import { NeedChips } from "@/components/NeedChips";

export function CampCard({
  camp,
  distanceKm,
  needs = [],
}: {
  camp: Camp;
  distanceKm?: number | null;
  needs?: CampNeed[];
}) {
  const { t, locale } = useI18n();
  const title = locale === "ml" && camp.name_ml ? camp.name_ml : camp.name;
  const secondary = locale === "ml" && camp.name_ml ? camp.name : camp.name_ml;
  const urgency = camp.urgency !== "normal" ? camp.urgency : (camp.reported_urgency ?? "normal");
  const urgencyIsReported = camp.urgency === "normal" && camp.reported_urgency !== null;
  const lat = camp.latitude != null ? Number(camp.latitude) : null;
  const lng = camp.longitude != null ? Number(camp.longitude) : null;

  return (
    <article className="panel group overflow-hidden transition-colors hover:border-accent/60">
      <Link
        to="/camps/$campId"
        params={{ campId: camp.id }}
        className="block p-4 focus-visible:bg-secondary/40 sm:p-5"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold sm:text-lg">{title}</h3>
            {secondary ? <p className="truncate text-sm text-muted-foreground">{secondary}</p> : null}
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {[camp.district_code, camp.taluk, camp.lsg_name, camp.village_or_locality]
                .filter(Boolean)
                .join(" › ")}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {typeof distanceKm === "number" ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground">
                <MapPin className="size-3.5" />
                {distanceKm.toFixed(1)} km
              </span>
            ) : null}
            <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <VerificationBadge state={camp.verification_state} />
          {isPreDesignated(camp) ? <PreDesignatedBadge /> : <StatusBadge status={camp.status} />}
          <UrgencyBadge level={urgency} reported={urgencyIsReported} />
          {camp.checkin_count > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground">
              <Users className="size-3.5" />
              {t("checkin.count", { count: camp.checkin_count })}
            </span>
          ) : null}
        </div>

        {(camp.amenities ?? []).length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {(camp.amenities ?? []).slice(0, 6).map((key) => {
              const Icon = amenityIcon(key);
              return (
                <li
                  key={key}
                  className="inline-flex items-center gap-1 rounded-md bg-verified/10 px-2 py-1 text-[11px] font-medium text-verified"
                >
                  {Icon ? <Icon className="size-3" /> : null}
                  {t(`amenity.${key}`)}
                </li>
              );
            })}
          </ul>
        ) : null}

        {needs.length > 0 ? (
          <div className="mt-3 rounded-lg border border-border bg-secondary/40 p-2">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              {t("need.title")}
            </p>
            <NeedChips needs={needs} limit={5} />
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">
            {t("detail.lastConfirmed")}: {formatIst(camp.status_last_confirmed_at)} IST
          </span>
          <StalenessNote staleness={stalenessOf(camp.status_last_confirmed_at)} />
        </div>
      </Link>

      <div className="flex items-stretch gap-px border-t border-border bg-border">
        {camp.camp_phone_primary ? (
          <a
            href={`tel:${camp.camp_phone_primary}`}
            className="flex flex-1 items-center justify-center gap-1.5 bg-card py-2.5 text-xs font-semibold hover:bg-secondary"
          >
            <Phone className="size-3.5 text-accent" />
            {camp.camp_phone_primary}
          </a>
        ) : null}
        <a
          href={googleMapsHref(lat, lng, `${camp.name}, ${camp.lsg_name}, Kerala`)}
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center justify-center gap-1.5 bg-card py-2.5 text-xs font-semibold hover:bg-secondary"
        >
          <Navigation className="size-3.5 text-accent" />
          {t("map.openGoogle")}
        </a>
      </div>
    </article>
  );
}
