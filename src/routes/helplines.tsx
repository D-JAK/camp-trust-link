import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { InfoTip } from "@/components/InfoTip";
import { EmergencyContacts } from "@/components/EmergencyContacts";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/helplines")({
  head: () => ({
    meta: [
      { title: "Kerala flood emergency helplines — Camp Check" },
      {
        name: "description",
        content:
          "Statewide Kerala emergency numbers: 1070, 1077, 112, 101, 108, 1098 and 1091. Tap to call during a flood emergency.",
      },
      { property: "og:title", content: "Kerala flood emergency helplines" },
      {
        property: "og:description",
        content: "Tap-to-call state emergency numbers for flood, fire, ambulance and rescue in Kerala.",
      },
    ],
  }),
  component: HelplinesPage,
});

function HelplinesPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <div className="sticky top-[5.4rem] z-20 -mx-4 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:top-[3.6rem]">
        <Breadcrumbs items={[{ label: t("crumb.camps"), to: "/" }, { label: t("nav.help") }]} />
      </div>
      <header className="flex items-center gap-1.5">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{t("help.title")}</h1>
        <InfoTip label={t("help.note")} />
      </header>
      <EmergencyContacts />
    </div>
  );
}
