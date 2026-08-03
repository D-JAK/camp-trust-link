import { useQuery } from "@tanstack/react-query";
import { HandHeart } from "lucide-react";
import { useState } from "react";
import { DonateDialog } from "@/components/DonateDialog";
import { useI18n } from "@/lib/i18n";
import { needIcon } from "@/lib/needs";
import { campNeedsQuery, type CampNeed } from "@/lib/queries";

/** "What this camp needs" panel with per-item counts and a donate flow. */
export function CampNeeds({ campId }: { campId: string }) {
  const { t } = useI18n();
  const { data: needs = [] } = useQuery(campNeedsQuery(campId));
  const [active, setActive] = useState<CampNeed | null>(null);

  return (
    <section className="panel p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("need.title")}</h2>
      {needs.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{t("need.none")}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {needs.map((need) => {
            const Icon = needIcon(need.item_key);
            const remaining = Math.max(0, need.needed_qty - need.pledged_qty);
            const pct = need.needed_qty > 0 ? Math.min(100, Math.round((need.pledged_qty / need.needed_qty) * 100)) : 0;
            return (
              <li
                key={need.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold">
                    <Icon className="size-4 shrink-0 text-accent" />
                    <span className="truncate">{need.label ?? t(`need.${need.item_key}`)}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("need.progress", {
                      pledged: need.pledged_qty,
                      needed: need.needed_qty,
                      unit: need.unit,
                    })}
                    {" · "}
                    {t("need.remaining", { count: remaining, unit: need.unit })}
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-verified" style={{ width: `${pct}%` }} />
                  </div>
                  {need.note ? <p className="mt-1 text-xs text-muted-foreground">{need.note}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => setActive(need)}
                  className="tap-target inline-flex shrink-0 items-center gap-2 rounded-lg bg-accent px-3 text-sm font-bold text-accent-foreground"
                >
                  <HandHeart className="size-4" />
                  {t("action.donate")}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted-foreground">{t("need.disclaimer")}</p>
      {active ? <DonateDialog need={active} onClose={() => setActive(null)} /> : null}
    </section>
  );
}
