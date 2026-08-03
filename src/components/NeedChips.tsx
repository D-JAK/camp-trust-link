import { useI18n } from "@/lib/i18n";
import { needIcon } from "@/lib/needs";
import type { CampNeed } from "@/lib/queries";
import { cn } from "@/lib/utils";

/** Compact list of what a camp needs — shown on cards and rows. */
export function NeedChips({
  needs,
  limit = 5,
  size = "sm",
}: {
  needs: CampNeed[];
  limit?: number;
  size?: "sm" | "md";
}) {
  const { t } = useI18n();
  if (needs.length === 0) return null;
  const shown = needs.slice(0, limit);
  const rest = needs.length - shown.length;

  return (
    <ul className="flex flex-wrap items-center gap-1.5">
      {shown.map((need) => {
        const Icon = needIcon(need.item_key);
        const remaining = Math.max(0, need.needed_qty - need.pledged_qty);
        return (
          <li
            key={need.id}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border font-medium",
              need.urgency === "critical"
                ? "border-critical/40 bg-critical/10 text-critical"
                : "border-border bg-secondary text-secondary-foreground",
              size === "md" ? "px-2.5 py-1 text-xs" : "px-1.5 py-0.5 text-[11px]",
            )}
          >
            <Icon className="size-3" />
            {need.label ?? t(`need.${need.item_key}`)}
            {need.needed_qty > 0 ? (
              <strong className="font-bold">
                {remaining} {need.unit}
              </strong>
            ) : null}
          </li>
        );
      })}
      {rest > 0 ? (
        <li className="text-[11px] font-semibold text-muted-foreground">{t("need.more", { count: rest })}</li>
      ) : null}
    </ul>
  );
}
