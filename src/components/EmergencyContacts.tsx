import { useQuery } from "@tanstack/react-query";
import { PhoneCall } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { districtsQuery, emergencyContactsQuery } from "@/lib/queries";

export function EmergencyContacts({ districtCode }: { districtCode?: string | null }) {
  const { t, locale } = useI18n();
  const { data: contacts = [] } = useQuery(emergencyContactsQuery());
  const { data: districts = [] } = useQuery(districtsQuery());

  const state = contacts.filter((c) => c.scope === "state");
  const district = districtCode ? contacts.filter((c) => c.district_code === districtCode) : [];
  const districtRow = districts.find((d) => d.code === districtCode);
  const districtName = districtRow ? (locale === "ml" && districtRow.name_ml ? districtRow.name_ml : districtRow.name) : "";

  const render = (rows: typeof contacts) => (
    <ul className="mt-2 grid gap-2 sm:grid-cols-2">
      {rows.map((contact) => (
        <li key={contact.id}>
          <a
            href={`tel:${contact.phone}`}
            className="tap-target flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2 transition-colors hover:border-critical"
          >
            <span className="min-w-0 truncate text-sm">
              {locale === "ml" && contact.label_ml ? contact.label_ml : contact.label}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-critical">
              <PhoneCall className="size-4" />
              {contact.phone}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <section className="panel p-4" aria-label={t("help.title")}>
      <h2 className="font-display text-lg font-bold">{t("help.title")}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{t("help.note")}</p>
      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("help.state")}</h3>
      {render(state)}
      {district.length > 0 ? (
        <>
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("help.district", { district: districtName })}
          </h3>
          {render(district)}
        </>
      ) : null}
    </section>
  );
}
