import { AlertTriangle, CheckCircle2, CircleAlert, DoorClosed, DoorOpen, Clock, Landmark } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Staleness } from "@/lib/format";

const base =
  "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-wide";

export function VerificationBadge({
  state,
  full = false,
}: {
  state: string;
  full?: boolean;
}) {
  const { t } = useI18n();
  const verified = state === "verified";
  return (
    <span
      className={cn(
        base,
        verified
          ? "bg-verified-soft text-verified"
          : "bg-unverified-soft text-unverified ring-1 ring-unverified/40",
      )}
    >
      {verified ? <CheckCircle2 className="size-3.5 shrink-0" /> : <CircleAlert className="size-3.5 shrink-0" />}
      <span className="normal-case tracking-normal">
        {full
          ? t(verified ? "state.verified" : "state.unverified")
          : t(verified ? "state.verified.short" : "state.unverified.short")}
      </span>
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const open = status === "active";
  return (
    <span className={cn(base, open ? "bg-open/12 text-open" : "bg-muted text-muted-foreground")}>
      {open ? <DoorOpen className="size-3.5" /> : <DoorClosed className="size-3.5" />}
      <span className="normal-case tracking-normal">{t(open ? "status.active" : "status.inactive")}</span>
    </span>
  );
}

/** Buildings from the official pre-designated monsoon camp list that nobody has reported as open. */
export function isPreDesignated(camp: { report_count: number; status: string }) {
  return camp.report_count === 0 && camp.status !== "active";
}

export function PreDesignatedBadge() {
  const { t } = useI18n();
  return (
    <span className={cn(base, "bg-secondary text-secondary-foreground")}>
      <Landmark className="size-3.5" />
      <span className="normal-case tracking-normal">{t("state.predesignated")}</span>
    </span>
  );
}


export function UrgencyBadge({ level, reported = false }: { level: string; reported?: boolean }) {
  const { t } = useI18n();
  if (level === "normal") return null;
  const critical = level === "critical";
  return (
    <span
      className={cn(
        base,
        critical ? "bg-critical-soft text-critical" : "bg-high-soft text-high",
        reported && "opacity-90",
      )}
      title={reported ? t("urgency.reported") : undefined}
    >
      <AlertTriangle className="size-3.5" />
      <span className="normal-case tracking-normal">
        {t(critical ? "urgency.critical" : "urgency.high")}
        {reported ? " ·" : ""}
      </span>
      {reported ? <span className="normal-case font-normal tracking-normal">{t("urgency.reported")}</span> : null}
    </span>
  );
}

export function StalenessNote({ staleness }: { staleness: Staleness }) {
  const { t } = useI18n();
  if (staleness === "fresh" || staleness === "never") return null;
  const strong = staleness !== "caution";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs",
        strong ? "font-medium text-critical" : "text-unverified",
      )}
    >
      <Clock className="size-3.5 shrink-0" />
      {t(
        staleness === "never"
          ? "detail.neverConfirmed"
          : staleness === "warning"
            ? "detail.veryStale"
            : "detail.stale",
      )}
    </span>
  );
}
