import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Building2,
  Flag,
  MapPin,
  Navigation,
  Phone,
  PhoneCall,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { EmergencyContacts } from "@/components/EmergencyContacts";
import {
  isPreDesignated,
  PreDesignatedBadge,
  StalenessNote,
  StatusBadge,
  UrgencyBadge,
  VerificationBadge,
} from "@/components/badges";
import { useI18n } from "@/lib/i18n";
import { formatIst, stalenessOf } from "@/lib/format";
import { campQuery, districtsQuery } from "@/lib/queries";
import { getCampImages, reportImage } from "@/lib/reports.functions";

export const Route = createFileRoute("/camps/$campId")({
  head: () => ({
    meta: [
      { title: "Relief camp details — Kerala Camp Check" },
      {
        name: "description",
        content:
          "Relief camp location, phone number, open/closed status and when it was last confirmed by a human. Call the camp before you travel.",
      },
      { property: "og:title", content: "Relief camp details — Kerala Camp Check" },
      {
        property: "og:description",
        content: "Camp location, contact number and verification status. Community-sourced, always call before travelling.",
      },
    ],
  }),
  component: CampDetailPage,
  errorComponent: ({ error }) => <p className="py-12 text-center text-sm text-critical">{error.message}</p>,
  notFoundComponent: () => <p className="py-12 text-center text-sm text-muted-foreground">Camp not found</p>,
});

function directionsHref(camp: { latitude: unknown; longitude: unknown; name: string; lsg_name: string }) {
  const lat = camp.latitude;
  const lng = camp.longitude;
  const isApple = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
  if (lat != null && lng != null) {
    return isApple
      ? `https://maps.apple.com/?daddr=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  const query = encodeURIComponent(`${camp.name}, ${camp.lsg_name}, Kerala`);
  return isApple ? `https://maps.apple.com/?q=${query}` : `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function CampDetailPage() {
  const { campId } = Route.useParams();
  const { t, locale } = useI18n();
  const { data: camp, isLoading } = useQuery(campQuery(campId));
  const { data: districts = [] } = useQuery(districtsQuery());
  const fetchImages = useServerFn(getCampImages);
  const flagImage = useServerFn(reportImage);

  const { data: images = [] } = useQuery({
    queryKey: ["camp-images", campId],
    queryFn: () => fetchImages({ data: { campId } }),
    staleTime: 10 * 60_000,
  });

  if (isLoading) return <p className="py-12 text-center text-sm text-muted-foreground">{t("list.loading")}</p>;
  if (!camp) throw notFound();

  const district = districts.find((d) => d.code === camp.district_code);
  const districtName = district ? (locale === "ml" && district.name_ml ? district.name_ml : district.name) : camp.district_code;
  const title = locale === "ml" && camp.name_ml ? camp.name_ml : camp.name;
  const preDesignated = isPreDesignated(camp);
  const unverified = camp.verification_state !== "verified";
  const urgency = camp.urgency !== "normal" ? camp.urgency : (camp.reported_urgency ?? "normal");
  const lat = camp.latitude != null ? Number(camp.latitude) : null;
  const lng = camp.longitude != null ? Number(camp.longitude) : null;

  const phones = [camp.camp_phone_primary, camp.camp_phone_secondary].filter(Boolean) as string[];

  return (
    <div className="space-y-4">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        {t("action.back")}
      </Link>

      <header className="panel p-4 sm:p-5">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
        {camp.name_ml && locale !== "ml" ? <p className="text-base text-muted-foreground">{camp.name_ml}</p> : null}
        <p className="mt-1 text-sm text-muted-foreground">
          {[districtName, camp.taluk, camp.lsg_name, camp.village_or_locality].filter(Boolean).join(" › ")}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {preDesignated ? (
            <PreDesignatedBadge />
          ) : (
            <>
              <VerificationBadge state={camp.verification_state} full />
              <StatusBadge status={camp.status} />
            </>
          )}
          <UrgencyBadge level={urgency} reported={camp.urgency === "normal" && camp.reported_urgency !== null} />
        </div>
        <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
          <p className="text-muted-foreground">
            {t("detail.lastConfirmed")}: <strong className="text-foreground">{formatIst(camp.status_last_confirmed_at)} IST</strong>
          </p>
          <StalenessNote staleness={stalenessOf(camp.status_last_confirmed_at)} />
          {camp.report_count > 0 ? (
            <p className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-4" />
              {camp.report_count === 1 ? t("detail.reportedBy.one") : t("detail.reportedBy", { count: camp.report_count })}
            </p>
          ) : null}
        </div>
      </header>

      {preDesignated ? (
        <p className="rounded-xl border-2 border-unverified bg-unverified-soft p-4 text-sm font-semibold text-unverified">
          {t("state.predesignatedNote")}
        </p>
      ) : null}

      {/* GUARD-2 */}
      <p
        className={
          unverified
            ? "rounded-xl border-2 border-unverified bg-unverified-soft p-4 text-sm font-semibold text-unverified"
            : "rounded-xl border border-border bg-secondary p-3 text-sm font-medium"
        }
      >
        {unverified ? t("detail.callBeforeUnverified") : t("detail.callBefore")}
      </p>

      <section className="panel p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("detail.contact")}</h2>
        {phones.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t("detail.noPhone")}</p>
        ) : (
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {phones.map((phone) => (
              <li key={phone}>
                <a
                  href={`tel:${phone}`}
                  className="tap-target flex items-center justify-center gap-2 rounded-lg bg-accent px-4 text-base font-bold text-accent-foreground"
                >
                  <PhoneCall className="size-5" />
                  {phone}
                </a>
              </li>
            ))}
          </ul>
        )}
        {camp.camp_incharge_name ? (
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Phone className="size-4" />
            {t("detail.incharge")}: <strong className="text-foreground">{camp.camp_incharge_name}</strong>
          </p>
        ) : null}
      </section>

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("detail.location")}</h2>
          <a
            href={directionsHref(camp)}
            target="_blank"
            rel="noreferrer"
            className="tap-target inline-flex items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-secondary"
          >
            <Navigation className="size-4 text-accent" />
            {t("action.directions")}
          </a>
        </div>
        {lat !== null && lng !== null ? (
          <div className="border-t border-border">
            <CampMap
              points={[{ id: camp.id, lat, lng, title, subtitle: camp.landmark ?? camp.lsg_name }]}
              center={{ lat, lng }}
              zoom={16}
              className="h-64"
            />
          </div>
        ) : (
          <p className="border-t border-border p-4 text-sm text-muted-foreground">
            <MapPin className="mr-1.5 inline size-4" />
            {camp.landmark ?? camp.lsg_name}
          </p>
        )}
        <dl className="grid gap-2 border-t border-border p-4 text-sm sm:grid-cols-2">
          {camp.landmark ? (
            <div>
              <dt className="text-xs text-muted-foreground">{t("detail.landmark")}</dt>
              <dd className="font-medium">{camp.landmark}</dd>
            </div>
          ) : null}
          {camp.building_type ? (
            <div>
              <dt className="text-xs text-muted-foreground">{t("detail.buildingType")}</dt>
              <dd className="inline-flex items-center gap-1.5 font-medium">
                <Building2 className="size-4 text-muted-foreground" />
                {camp.building_type.replace(/_/g, " ")}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      {images.length > 0 ? (
        <section className="panel p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("detail.photos")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("detail.photoNote")}</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {images.map((image) => (
              <li key={image.id} className="overflow-hidden rounded-lg border border-border">
                <img src={image.url} alt="" loading="lazy" className="aspect-4/3 w-full object-cover" />
                <button
                  type="button"
                  onClick={async () => {
                    await flagImage({ data: { imageId: image.id, reason: "Flagged from camp detail" } });
                    toast.success(t("detail.reportImage"));
                  }}
                  className="flex w-full items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:bg-secondary"
                >
                  <Flag className="size-3.5" />
                  {t("detail.reportImage")}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <EmergencyContacts districtCode={camp.district_code} />

      <Link
        to="/report"
        search={{ campId: camp.id }}
        className="tap-target flex items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-secondary"
      >
        <Flag className="size-4" />
        {t("detail.correction")}
      </Link>
    </div>
  );
}
