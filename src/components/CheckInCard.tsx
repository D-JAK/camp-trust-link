import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, DoorClosed, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AMENITIES, type AmenityKey } from "@/lib/amenities";
import { checkInAtCamp, listCheckIns } from "@/lib/checkins.functions";
import { formatIst, normalisePhone } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export function CheckInCard({ campId, count }: { campId: string; count: number }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const submit = useServerFn(checkInAtCamp);
  const fetchList = useServerFn(listCheckIns);

  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [people, setPeople] = useState("");
  const [families, setFamilies] = useState("");
  const [children, setChildren] = useState("");
  const [amenities, setAmenities] = useState<AmenityKey[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const recent = useQuery({
    queryKey: ["camp-checkins", campId],
    queryFn: () => fetchList({ data: { campId } }),
    staleTime: 60_000,
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const e164 = normalisePhone(phone);
    if (!e164) {
      toast.error(t("checkin.invalidPhone"));
      return;
    }
    setBusy(true);
    const toCount = (value: string) => {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    };
    try {
      const result = await submit({
        data: {
          campId,
          phone: e164,
          isOpen,
          note: note.trim() || null,
          peopleCount: toCount(people),
          familyCount: toCount(families),
          childrenCount: toCount(children),
          amenities,
        },
      });
      if (result.ok) {
        setDone(true);
        toast.success(t("checkin.success"));
        await queryClient.invalidateQueries({ queryKey: ["camp-checkins", campId] });
        await queryClient.invalidateQueries({ queryKey: ["camp", campId] });
      } else {
        toast.error(
          t(
            result.reason === "already_phone"
              ? "checkin.alreadyPhone"
              : result.reason === "already_ip"
                ? "checkin.alreadyIp"
                : "checkin.error",
          ),
        );
      }
    } catch {
      toast.error(t("checkin.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("checkin.title")}
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground">
          <Users className="size-3.5" />
          {t("checkin.count", { count })}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{t("checkin.subtitle")}</p>

      {done ? (
        <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-verified bg-verified/10 px-3 py-2 text-sm font-semibold text-verified">
          <CheckCircle2 className="size-4" />
          {t("checkin.success")}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              aria-pressed={isOpen}
              className={`tap-target flex items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold ${
                isOpen ? "border-verified bg-verified text-verified-foreground" : "border-border hover:bg-secondary"
              }`}
            >
              <CheckCircle2 className="size-4" />
              {t("checkin.open")}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-pressed={!isOpen}
              className={`tap-target flex items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold ${
                !isOpen ? "border-critical bg-critical text-critical-foreground" : "border-border hover:bg-secondary"
              }`}
            >
              <DoorClosed className="size-4" />
              {t("checkin.closed")}
            </button>
          </div>
          <input
            type="tel"
            inputMode="tel"
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder={t("checkin.phone")}
            aria-label={t("checkin.phone")}
            className="tap-target w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
          <fieldset className="rounded-lg border border-border p-3">
            <legend className="px-1 text-xs font-semibold text-muted-foreground">
              {t("checkin.occupancy")}
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["checkin.people", people, setPeople],
                  ["checkin.families", families, setFamilies],
                  ["checkin.children", children, setChildren],
                ] as const
              ).map(([label, value, setValue]) => (
                <label key={label} className="block text-xs text-muted-foreground">
                  {t(label)}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    className="tap-target mt-1 w-full rounded-lg border border-border bg-background px-2 text-sm text-foreground"
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="rounded-lg border border-border p-3">
            <legend className="px-1 text-xs font-semibold text-muted-foreground">
              {t("checkin.amenities")}
            </legend>
            <p className="mb-2 text-xs text-muted-foreground">{t("checkin.amenitiesHint")}</p>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map(({ key, icon: Icon }) => {
                const selected = amenities.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setAmenities((current) =>
                        current.includes(key)
                          ? current.filter((item) => item !== key)
                          : [...current, key],
                      )
                    }
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    {t(`amenity.${key}`)}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <input
            type="text"
            value={note}
            maxLength={280}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t("checkin.note")}
            aria-label={t("checkin.note")}
            className="tap-target w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="tap-target flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "…" : t("checkin.submit")}
          </button>
        </form>
      )}

      {(recent.data ?? []).length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-border pt-3">
          {(recent.data ?? []).map((row) => (
            <li key={row.id} className="flex items-start justify-between gap-3 text-xs">
              <span className="min-w-0">
                <strong className={row.isOpen ? "text-verified" : "text-critical"}>
                  {t(row.isOpen ? "checkin.open" : "checkin.closed")}
                </strong>{" "}
                <span className="text-muted-foreground">{row.phoneMasked}</span>
                {row.peopleCount !== null && row.peopleCount !== undefined ? (
                  <span className="block text-muted-foreground">
                    {row.peopleCount} {t("checkin.people").toLowerCase()}
                    {row.familyCount ? ` · ${row.familyCount} ${t("checkin.families").toLowerCase()}` : ""}
                    {row.childrenCount ? ` · ${row.childrenCount} ${t("checkin.children").toLowerCase()}` : ""}
                  </span>
                ) : null}
                {row.note ? <span className="block truncate text-muted-foreground">{row.note}</span> : null}
              </span>
              <span className="shrink-0 text-muted-foreground">{formatIst(row.createdAt)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
