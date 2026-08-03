import { createFileRoute } from "@tanstack/react-router";
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
      <header>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{t("help.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("help.note")}</p>
      </header>
      <EmergencyContacts />
    </div>
  );
}
