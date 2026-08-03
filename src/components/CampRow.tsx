import { Link } from "@tanstack/react-router";
import { ChevronRight, MapPin, Navigation, Phone, Users } from "lucide-react";
import { isPreDesignated, PreDesignatedBadge, StatusBadge, UrgencyBadge, VerificationBadge } from "@/components/badges";
import { googleMapsHref } from "@/components/CampMap";
import { amenityIcon } from "@/lib/amenities";
import { formatIst } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Camp } from "@/lib/queries";

/** Dense one-line row used by the list (table-like) view of the camp list. */
export function CampRow({ camp, distanceKm }: { camp: Camp; distanceKm?: number | null }) {
  const { t, locale } = useI18n();
  const title = locale === "ml" && camp.name_ml ? camp.name_ml : camp.name;
  const urgency = camp.urgency !== "normal" ? camp.urgency : (camp.reported_urgency ?? "normal");
  const lat = camp.latitude != null ? Number(camp.latitude) : null;
  const lng = camp.longitude != null ? Number(camp.longitude) : null;
  const amenities = (camp.amenities ?? []).slice(0, 4);

  return (
    <article className="panel flex items-center gap-3 px-3 py-2.5 transition-colors hover:border-accent/60">
      <Link
        to="/camps/$campId"
        params={{ campId: camp.id }}
        className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-3"
      >
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{title}</h3>
            {isPreDesignated(camp) ? <PreDesignatedBadge /> : <VerificationBadge state={camp.verification_state} />}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {[camp.district_code, camp.taluk, camp.lsg_name].filter(Boolean).join(" › ")}
            {" · "}
            {formatIst(camp.status_last_confirmed_at)}
          </p>
          {amenities.length > 0 ? (
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {amenities.map((key) => {
                const Icon = amenityIcon(key);
                return (
                  <li
                    key={key}
                    className="inline-flex items-center gap-1 rounded-md bg-verified/10 px-1.5 py-0.5 text-[11px] font-medium text-verified"
                  >
                    {Icon ? <Icon className="size-3" /> : null}
                    {t(`amenity.${key}`)}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {typeof distanceKm === "number" ? (
            <span className="hidden items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground sm:inline-flex">
              <MapPin className="size-3.5" />
              {distanceKm.toFixed(1)} km
            </span>
          ) : null}
          {camp.checkin_count > 0 ? (
            <span className="hidden items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground sm:inline-flex">
              <Users className="size-3.5" />
              {camp.checkin_count}
            </span>
          ) : null}
          {!isPreDesignated(camp) ? <StatusBadge status={camp.status} /> : null}
          <UrgencyBadge level={urgency} reported={camp.urgency === "normal" && camp.reported_urgency !== null} />
          <ChevronRight className="size-4 text-muted-foreground" />
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-1">
        {camp.camp_phone_primary ? (
          <a
            href={`tel:${camp.camp_phone_primary}`}
            aria-label={t("action.call")}
            className="grid size-9 place-items-center rounded-lg border border-border hover:bg-secondary"
          >
            <Phone className="size-4 text-accent" />
          </a>
        ) : null}
        <a
          href={googleMapsHref(lat, lng, `${camp.name}, ${camp.lsg_name}, Kerala`)}
          target="_blank"
          rel="noreferrer"
          aria-label={t("map.openGoogle")}
          className="grid size-9 place-items-center rounded-lg border border-border hover:bg-secondary"
        >
          <Navigation className="size-4 text-accent" />
        </a>
      </div>
    </article>
  );
}
