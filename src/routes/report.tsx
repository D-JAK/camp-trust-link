import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Loader2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { normalisePhone } from "@/lib/format";
import { processImage, warningKeyFor, type ProcessedImage } from "@/lib/imageProcessing";
import { campQuery, districtsQuery, lsgQuery, taluksQuery } from "@/lib/queries";
import { requestOtp, submitReport } from "@/lib/reports.functions";
import { useGeolocation } from "@/lib/useGeolocation";
import { cn } from "@/lib/utils";

type Draft = {
  districtCode: string;
  taluk: string;
  lsgType: "panchayat" | "municipality" | "corporation";
  lsgName: string;
  villageOrLocality: string;
  landmark: string;
  name: string;
  buildingType: string;
  campInchargeName: string;
  campPhonePrimary: string;
  reportedStatus: "active" | "inactive";
  reportedUrgency: "normal" | "high" | "critical";
  reportedUrgencyReason: string;
  reporterName: string;
  reporterPhonePrimary: string;
  reporterPhoneSecondary: string;
  reporterGender: string;
  reporterRelationship: string;
};

const emptyDraft: Draft = {
  districtCode: "",
  taluk: "",
  lsgType: "panchayat",
  lsgName: "",
  villageOrLocality: "",
  landmark: "",
  name: "",
  buildingType: "",
  campInchargeName: "",
  campPhonePrimary: "",
  reportedStatus: "active",
  reportedUrgency: "normal",
  reportedUrgencyReason: "",
  reporterName: "",
  reporterPhonePrimary: "",
  reporterPhoneSecondary: "",
  reporterGender: "",
  reporterRelationship: "",
};

const DRAFT_KEY = "kcc.report.draft";
const DRAFT_TTL = 24 * 3_600_000;

export const Route = createFileRoute("/report")({
  validateSearch: (search: Record<string, unknown>) => ({
    campId: typeof search["campId"] === "string" ? search["campId"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Report a relief camp — Kerala Camp Check" },
      {
        name: "description",
        content:
          "Report a relief camp in Kerala in under three minutes. Add the location, two photos and your number. Our team calls to confirm.",
      },
      { property: "og:title", content: "Report a relief camp in Kerala" },
      {
        property: "og:description",
        content: "Six short steps to add a camp. Your name and number stay private, visible only to the verification team.",
      },
    ],
  }),
  component: ReportPage,
});

const inputClass =
  "tap-target w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:border-accent";
const labelClass = "block text-sm font-medium";

function ReportPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const { campId } = Route.useSearch();
  const { coords, status: geoStatus, request } = useGeolocation();

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [smsDelivered, setSmsDelivered] = useState<boolean | null>(null);
  const [otp, setOtp] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [done, setDone] = useState<{ reference: string; campId: string; held: boolean } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const { data: districts = [] } = useQuery(districtsQuery());
  const { data: taluks = [] } = useQuery(taluksQuery());
  const { data: lsgBodies = [] } = useQuery(lsgQuery());
  const { data: correctionCamp } = useQuery({ ...campQuery(campId), enabled: Boolean(campId) });

  const sendOtp = useServerFn(requestOtp);
  const submit = useServerFn(submitReport);

  // PUB-33: draft survives reload / connection loss for 24 hours.
  useEffect(() => {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { at: number; draft: Draft };
      if (Date.now() - parsed.at < DRAFT_TTL) setDraft({ ...emptyDraft, ...parsed.draft });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ at: Date.now(), draft }));
  }, [draft]);

  useEffect(() => {
    if (correctionCamp) {
      setDraft((prev) => ({
        ...prev,
        districtCode: correctionCamp.district_code,
        taluk: correctionCamp.taluk,
        lsgType: correctionCamp.lsg_type,
        lsgName: correctionCamp.lsg_name,
        name: correctionCamp.name,
        villageOrLocality: correctionCamp.village_or_locality ?? "",
      }));
    }
  }, [correctionCamp]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendIn]);

  const set = (patch: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...patch }));

  const talukOptions = taluks.filter((row) => row.district_code === draft.districtCode);
  const lsgOptions = lsgBodies.filter((row) => row.district_code === draft.districtCode);

  async function addFiles(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    const next = [...images];
    for (const file of Array.from(files).slice(0, 4 - images.length)) {
      const result = await processImage(file);
      if ("error" in result) {
        toast.error(t(result.error));
        continue;
      }
      if (next.some((existing) => existing.sha256 === result.sha256)) {
        toast.error(t("error.samePhoto"));
        continue;
      }
      const warning = warningKeyFor(result.qualityReasons);
      if (warning) toast.warning(t(warning));
      next.push(result);
    }
    setImages(next);
    setBusy(false);
  }

  function validate(current: number): string | null {
    if (current === 1 && (!draft.districtCode || !draft.taluk || !draft.lsgName)) return t("error.required");
    if (current === 2 && draft.name.trim().length < 2) return t("error.required");
    if (current === 3 && draft.reportedUrgency !== "normal" && draft.reportedUrgencyReason.trim().length < 10)
      return t("error.reason");
    if (current === 4 && images.length < 2) return t("error.minPhotos");
    if (current === 5) {
      if (draft.reporterName.trim().length < 2) return t("error.required");
      if (!normalisePhone(draft.reporterPhonePrimary)) return t("error.phone");
    }
    return null;
  }

  function goNext() {
    const message = validate(step);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    if (step === 5) void startVerification();
    else setStep((s) => Math.min(6, s + 1));
  }

  async function startVerification() {
    const phone = normalisePhone(draft.reporterPhonePrimary);
    if (!phone) return;
    setBusy(true);
    try {
      const result = await sendOtp({ data: { phone } });
      if (!result.ok) {
        setError(t("error.generic"));
        return;
      }
      setChallengeId(result.challengeId);
      setSmsDelivered(result.delivered);
      setResendIn(60);
      setStep(6);
    } finally {
      setBusy(false);
    }
  }

  async function finalSubmit() {
    const phone = normalisePhone(draft.reporterPhonePrimary);
    if (!phone) return;
    if (smsDelivered && !/^\d{6}$/.test(otp)) {
      setError(t("error.otp"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await submit({
        data: {
          campId: campId || null,
          isCorrection: Boolean(campId),
          name: draft.name.trim(),
          buildingType: draft.buildingType ? (draft.buildingType as never) : null,
          districtCode: draft.districtCode,
          taluk: draft.taluk,
          lsgType: draft.lsgType,
          lsgName: draft.lsgName.trim(),
          villageOrLocality: draft.villageOrLocality || null,
          landmark: draft.landmark || null,
          latitude: coords?.lat ?? null,
          longitude: coords?.lng ?? null,
          locationAccuracyM: coords?.accuracy != null ? Math.round(coords.accuracy) : null,
          campInchargeName: draft.campInchargeName || null,
          campPhonePrimary: normalisePhone(draft.campPhonePrimary),
          reportedStatus: draft.reportedStatus,
          reportedUrgency: draft.reportedUrgency,
          reportedUrgencyReason: draft.reportedUrgencyReason || null,
          reporterName: draft.reporterName.trim(),
          reporterPhonePrimary: phone,
          reporterPhoneSecondary: normalisePhone(draft.reporterPhoneSecondary),
          reporterGender: draft.reporterGender ? (draft.reporterGender as never) : null,
          reporterRelationship: draft.reporterRelationship ? (draft.reporterRelationship as never) : null,
          deviceLocationGranted: Boolean(coords),
          challengeId: smsDelivered ? challengeId : null,
          otpCode: smsDelivered ? otp : null,
          images: images.map((image) => ({
            dataUrl: image.dataUrl,
            width: image.width,
            height: image.height,
            blurScore: image.blurScore,
            brightnessScore: image.brightnessScore,
            exifLat: image.exifLat,
            exifLng: image.exifLng,
            exifCapturedAt: image.exifCapturedAt,
            qualityReasons: image.qualityReasons,
          })),
        },
      });

      if (!result.ok) {
        setError(result.reason === "wrong" ? t("error.otpWrong") : t("error.generic"));
        return;
      }
      window.localStorage.removeItem(DRAFT_KEY);
      setDone({ reference: result.reference, campId: result.campId, held: result.heldAsDuplicate });
    } catch {
      setError(t("error.generic"));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="panel mx-auto max-w-lg p-6 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-verified-soft text-verified">
          <Check className="size-6" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold">{t("report.doneTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("report.doneBody")}</p>
        <p className="mt-2 font-display text-2xl font-bold tracking-wider text-accent">{done.reference}</p>
        <div className="mt-6 grid gap-2">
          {!done.held ? (
            <Link
              to="/camps/$campId"
              params={{ campId: done.campId }}
              className="tap-target flex items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground"
            >
              {t("report.viewCamp")}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setDone(null);
              setStep(1);
              setImages([]);
              setOtp("");
              setDraft(emptyDraft);
              void navigate({ to: "/report", search: { campId: "" } });
            }}
            className="tap-target rounded-lg border border-border px-4 text-sm font-semibold hover:bg-secondary"
          >
            {t("report.doneAnother")}
          </button>
        </div>
      </div>
    );
  }

  const stepTitles = ["report.step1", "report.step2", "report.step3", "report.step4", "report.step5", "report.step6"];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{t("report.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("report.intro")}</p>
      </header>

      <div className="flex items-center gap-2">
        {stepTitles.map((_, index) => (
          <span
            key={index}
            className={cn("h-1.5 flex-1 rounded-full", index + 1 <= step ? "bg-accent" : "bg-secondary")}
          />
        ))}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("report.step", { n: step })} · {t(stepTitles[step - 1]!)}
      </p>

      <section className="panel space-y-4 p-4 sm:p-5">
        {step === 1 ? (
          <>
            <button
              type="button"
              onClick={request}
              className="tap-target inline-flex items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-secondary"
            >
              <Compass className={cn("size-4 text-accent", geoStatus === "asking" && "animate-spin")} />
              {coords ? t("report.locationOk") : geoStatus === "asking" ? t("report.locating") : t("action.useLocation")}
            </button>
            {!coords ? <p className="text-xs text-muted-foreground">{t("report.locationNone")}</p> : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className={labelClass}>{t("filter.district")}</span>
                <select
                  className={inputClass}
                  value={draft.districtCode}
                  onChange={(event) => set({ districtCode: event.target.value, taluk: "", lsgName: "" })}
                >
                  <option value="">{t("common.select")}</option>
                  {districts.map((d) => (
                    <option key={d.code} value={d.code}>
                      {locale === "ml" && d.name_ml ? d.name_ml : d.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className={labelClass}>{t("filter.taluk")}</span>
                <select className={inputClass} value={draft.taluk} onChange={(event) => set({ taluk: event.target.value })}>
                  <option value="">{t("common.select")}</option>
                  {talukOptions.map((row) => (
                    <option key={row.id} value={row.name}>
                      {row.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className={labelClass}>{t("filter.lsg")}</span>
                <select
                  className={inputClass}
                  value={draft.lsgType}
                  onChange={(event) => set({ lsgType: event.target.value as Draft["lsgType"] })}
                >
                  <option value="panchayat">Grama Panchayat</option>
                  <option value="municipality">Municipality</option>
                  <option value="corporation">Corporation</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className={labelClass}>{t("filter.lsg")}</span>
                <input
                  className={inputClass}
                  list="lsg-options"
                  value={draft.lsgName}
                  onChange={(event) => set({ lsgName: event.target.value })}
                />
                <datalist id="lsg-options">
                  {lsgOptions.map((row) => (
                    <option key={row.id} value={row.name} />
                  ))}
                </datalist>
              </label>
              <label className="space-y-1">
                <span className={labelClass}>
                  {t("report.village")} <span className="text-muted-foreground">({t("common.optional")})</span>
                </span>
                <input
                  className={inputClass}
                  value={draft.villageOrLocality}
                  onChange={(event) => set({ villageOrLocality: event.target.value })}
                />
              </label>
              <label className="space-y-1">
                <span className={labelClass}>
                  {t("report.landmark")} <span className="text-muted-foreground">({t("common.optional")})</span>
                </span>
                <input className={inputClass} value={draft.landmark} onChange={(event) => set({ landmark: event.target.value })} />
              </label>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 sm:col-span-2">
              <span className={labelClass}>{t("report.campName")}</span>
              <input className={inputClass} value={draft.name} onChange={(event) => set({ name: event.target.value })} />
              <span className="text-xs text-muted-foreground">{t("report.campNameHint")}</span>
            </label>
            <label className="space-y-1">
              <span className={labelClass}>{t("report.buildingType")}</span>
              <select className={inputClass} value={draft.buildingType} onChange={(event) => set({ buildingType: event.target.value })}>
                <option value="">{t("common.select")}</option>
                <option value="school">School</option>
                <option value="college">College</option>
                <option value="community_hall">Community hall</option>
                <option value="place_of_worship">Place of worship</option>
                <option value="government_building">Government building</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className={labelClass}>{t("report.inchargeName")}</span>
              <input
                className={inputClass}
                value={draft.campInchargeName}
                onChange={(event) => set({ campInchargeName: event.target.value })}
              />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className={labelClass}>{t("report.campPhone")}</span>
              <input
                className={inputClass}
                inputMode="tel"
                placeholder="98470 00000"
                value={draft.campPhonePrimary}
                onChange={(event) => set({ campPhonePrimary: event.target.value })}
              />
            </label>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <fieldset>
              <legend className={labelClass}>{t("report.isOpen")}</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["active", "inactive"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set({ reportedStatus: value })}
                    className={cn(
                      "tap-target rounded-lg border px-3 text-sm font-semibold",
                      draft.reportedStatus === value ? "border-accent bg-accent text-accent-foreground" : "border-border",
                    )}
                  >
                    {t(value === "active" ? "report.yesOpen" : "report.noClosed")}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className={labelClass}>{t("report.urgency")}</legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(["normal", "high", "critical"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set({ reportedUrgency: value })}
                    className={cn(
                      "tap-target rounded-lg border px-2 text-xs font-semibold",
                      draft.reportedUrgency === value ? "border-accent bg-accent text-accent-foreground" : "border-border",
                    )}
                  >
                    {value === "normal" ? t("common.no") : t(value === "high" ? "urgency.high" : "urgency.critical")}
                  </button>
                ))}
              </div>
            </fieldset>
            {draft.reportedUrgency !== "normal" ? (
              <label className="space-y-1">
                <span className={labelClass}>{t("report.urgencyReason")}</span>
                <textarea
                  className={cn(inputClass, "min-h-24")}
                  value={draft.reportedUrgencyReason}
                  onChange={(event) => set({ reportedUrgencyReason: event.target.value })}
                />
                <span className="text-xs text-muted-foreground">{t("report.urgencyReasonHint")}</span>
              </label>
            ) : null}
            <p className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">{t("urgency.reported")}</p>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-3">
            <p className="rounded-lg border border-unverified/40 bg-unverified-soft p-3 text-sm text-unverified">
              <AlertTriangle className="mr-1.5 inline size-4" />
              {t("report.photoGuidance")}
            </p>
            <p className={labelClass}>{t("report.photos")}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {images.map((image, index) => (
                <div key={image.sha256} className="relative overflow-hidden rounded-lg border border-border">
                  <img src={image.dataUrl} alt="" className="aspect-square w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== index))}
                    className="absolute right-1 top-1 grid size-8 place-items-center rounded-md bg-background/90 text-critical"
                    aria-label={t("action.clear")}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              {images.length < 4 ? (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border text-xs font-semibold text-muted-foreground hover:border-accent"
                >
                  {busy ? <Loader2 className="size-5 animate-spin" /> : <Camera className="size-5" />}
                  {t("report.addPhoto")}
                </button>
              ) : null}
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              capture="environment"
              multiple
              className="hidden"
              onChange={(event) => {
                void addFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </div>
        ) : null}

        {step === 5 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 sm:col-span-2">
              <span className={labelClass}>{t("report.yourName")}</span>
              <input className={inputClass} value={draft.reporterName} onChange={(event) => set({ reporterName: event.target.value })} />
            </label>
            <label className="space-y-1">
              <span className={labelClass}>{t("report.yourPhone")}</span>
              <input
                className={inputClass}
                inputMode="tel"
                value={draft.reporterPhonePrimary}
                onChange={(event) => set({ reporterPhonePrimary: event.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className={labelClass}>{t("report.altPhone")}</span>
              <input
                className={inputClass}
                inputMode="tel"
                value={draft.reporterPhoneSecondary}
                onChange={(event) => set({ reporterPhoneSecondary: event.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className={labelClass}>{t("report.gender")}</span>
              <select className={inputClass} value={draft.reporterGender} onChange={(event) => set({ reporterGender: event.target.value })}>
                <option value="">{t("common.select")}</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className={labelClass}>{t("report.relationship")}</span>
              <select
                className={inputClass}
                value={draft.reporterRelationship}
                onChange={(event) => set({ reporterRelationship: event.target.value })}
              >
                <option value="">{t("common.select")}</option>
                <option value="resident">Resident</option>
                <option value="volunteer">Volunteer</option>
                <option value="camp_staff">Camp staff</option>
                <option value="official">Official</option>
                <option value="other">Other</option>
              </select>
            </label>
            <p className="sm:col-span-2 rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
              <ShieldCheck className="mr-1.5 inline size-4" />
              {t("report.intro")}
            </p>
          </div>
        ) : null}

        {step === 6 ? (
          <div className="space-y-3">
            {smsDelivered ? (
              <>
                <p className="text-sm">{t("report.otpSent", { phone: draft.reporterPhonePrimary })}</p>
                <label className="space-y-1">
                  <span className={labelClass}>{t("report.otpLabel")}</span>
                  <input
                    className={cn(inputClass, "text-center text-2xl tracking-[0.4em]")}
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                  />
                </label>
                <button
                  type="button"
                  disabled={resendIn > 0}
                  onClick={() => void startVerification()}
                  className="text-sm font-semibold text-accent disabled:text-muted-foreground"
                >
                  {resendIn > 0 ? t("report.resendIn", { s: resendIn }) : t("report.resend")}
                </button>
              </>
            ) : (
              <p className="rounded-lg border border-unverified/40 bg-unverified-soft p-3 text-sm text-unverified">
                <AlertTriangle className="mr-1.5 inline size-4" />
                SMS verification is not available yet. Your report will still be accepted and sent to our team for
                manual confirmation by phone.
              </p>
            )}
          </div>
        ) : null}

        {error ? <p className="text-sm font-medium text-critical">{error}</p> : null}

        <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="tap-target inline-flex items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-semibold disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
            {t("action.previous")}
          </button>
          <span className="text-xs text-muted-foreground">{t("report.saved")}</span>
          {step < 6 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={busy}
              className="tap-target inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-bold text-accent-foreground disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("action.next")}
              <ChevronRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void finalSubmit()}
              disabled={busy}
              className="tap-target inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-bold text-accent-foreground disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              {t("action.submit")}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
