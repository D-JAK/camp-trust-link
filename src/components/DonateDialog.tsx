import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { HandHeart, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { needIcon } from "@/lib/needs";
import { pledgeDonation, requestDonorOtp } from "@/lib/needs.functions";
import type { CampNeed } from "@/lib/queries";

type Step = "quantity" | "contact" | "otp";

export function DonateDialog({ need, onClose }: { need: CampNeed; onClose: () => void }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const sendOtp = useServerFn(requestDonorOtp);
  const pledge = useServerFn(pledgeDonation);

  const remaining = Math.max(0, need.needed_qty - need.pledged_qty);
  const [step, setStep] = useState<Step>("quantity");
  const [quantity, setQuantity] = useState<number>(remaining > 0 ? Math.min(remaining, 10) : 1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const Icon = needIcon(need.item_key);
  const label = need.label ?? t(`need.${need.item_key}`);
  const fullPhone = `+91${phone.replace(/\D/g, "").slice(-10)}`;
  const phoneValid = /^\+91[6-9]\d{9}$/.test(fullPhone);

  async function submit(withOtp: boolean) {
    setBusy(true);
    const result = await pledge({
      data: {
        needId: need.id,
        quantity,
        donorName: name.trim(),
        donorPhone: fullPhone,
        challengeId: withOtp ? challengeId : null,
        otpCode: withOtp ? otp : null,
      },
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(t(result.reason === "otp_failed" ? "donate.otpWrong" : "donate.error"));
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["camp-needs"] });
    toast.success(result.verified ? t("donate.success") : t("donate.successUnverified"));
    onClose();
  }

  async function goToOtp() {
    if (!phoneValid || name.trim().length < 2) {
      toast.error(t("donate.invalidContact"));
      return;
    }
    setBusy(true);
    const result = await sendOtp({ data: { phone: fullPhone } });
    setBusy(false);
    if (!result.ok) {
      toast.error(t("donate.otpRateLimited"));
      return;
    }
    setChallengeId(result.challengeId);
    if (!result.delivered) {
      // No SMS gateway yet — record the pledge and let the camp confirm by phone.
      await submit(false);
      return;
    }
    setStep("otp");
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-foreground/40 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
      <div className="panel w-full max-w-md p-4 sm:p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <h3 className="inline-flex items-center gap-2 font-display text-lg font-bold">
              <Icon className="size-5 text-accent" />
              {t("donate.title", { item: label })}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("need.remaining", { count: remaining, unit: need.unit })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("action.close")}
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-border hover:bg-secondary"
          >
            <X className="size-4" />
          </button>
        </div>

        {step === "quantity" ? (
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-semibold" htmlFor="donate-qty">
              {t("donate.quantity", { unit: need.unit })}
            </label>
            <input
              id="donate-qty"
              type="number"
              min={1}
              max={100000}
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
              className="tap-target w-full rounded-lg border border-border bg-background px-3 text-base"
            />
            <button
              type="button"
              onClick={() => setStep("contact")}
              className="tap-target flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-bold text-accent-foreground"
            >
              <HandHeart className="size-4" />
              {t("action.continue")}
            </button>
          </div>
        ) : null}

        {step === "contact" ? (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-semibold" htmlFor="donate-name">
                {t("donate.name")}
              </label>
              <input
                id="donate-name"
                value={name}
                maxLength={120}
                onChange={(event) => setName(event.target.value)}
                className="tap-target mt-1 w-full rounded-lg border border-border bg-background px-3 text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold" htmlFor="donate-phone">
                {t("donate.phone")}
              </label>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-semibold text-muted-foreground">+91</span>
                <input
                  id="donate-phone"
                  inputMode="numeric"
                  value={phone}
                  maxLength={10}
                  onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
                  className="tap-target w-full rounded-lg border border-border bg-background px-3 text-base"
                />
              </div>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={goToOtp}
              className="tap-target flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-bold text-accent-foreground disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <HandHeart className="size-4" />}
              {t("donate.sendOtp")}
            </button>
          </div>
        ) : null}

        {step === "otp" ? (
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-semibold" htmlFor="donate-otp">
              {t("donate.otp")}
            </label>
            <input
              id="donate-otp"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
              className="tap-target w-full rounded-lg border border-border bg-background px-3 text-center text-xl font-bold tracking-[0.4em]"
            />
            <button
              type="button"
              disabled={busy || otp.length !== 6}
              onClick={() => submit(true)}
              className="tap-target flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-bold text-accent-foreground disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <HandHeart className="size-4" />}
              {t("donate.confirm")}
            </button>
          </div>
        ) : null}

        <p className="mt-3 text-xs text-muted-foreground">{t("donate.disclaimer")}</p>
      </div>
    </div>
  );
}
