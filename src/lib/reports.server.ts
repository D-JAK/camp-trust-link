import { createHash, randomInt } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

type LsgType = Database["public"]["Enums"]["lsg_type"];
type BuildingType = Database["public"]["Enums"]["building_type"];
type Urgency = Database["public"]["Enums"]["urgency_level"];
type CampStatus = Database["public"]["Enums"]["camp_status"];
type Relationship = Database["public"]["Enums"]["reporter_relationship"];
type Gender = Database["public"]["Enums"]["reporter_gender"];

type Optional<T> = { [K in keyof T]: T[K] | undefined };

export type ReportPayload = Optional<{
  campId?: string | null;
  isCorrection?: boolean;
  correctionNote?: string | null;
  name: string;
  nameMl?: string | null;
  buildingType?: BuildingType | null;
  districtCode: string;
  taluk: string;
  lsgType: LsgType;
  lsgName: string;
  villageOrLocality?: string | null;
  landmark?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracyM?: number | null;
  campInchargeName?: string | null;
  campPhonePrimary?: string | null;
  campPhoneSecondary?: string | null;
  reportedStatus: CampStatus;
  reportedUrgency: Urgency;
  reportedUrgencyReason?: string | null;
  reporterName: string;
  reporterPhonePrimary: string;
  reporterPhoneSecondary?: string | null;
  reporterGender?: Gender | null;
  reporterRelationship?: Relationship | null;
  deviceLocationGranted: boolean;
  challengeId?: string | null;
  otpCode?: string | null;
  images: Array<{
    dataUrl: string;
    width: number;
    height: number;
    blurScore: number | null;
    brightnessScore: number | null;
    exifLat?: number | null;
    exifLng?: number | null;
    exifCapturedAt?: string | null;
    qualityReasons: string[];
  }>;
}>;

const OTP_TTL_MS = 10 * 60_000;
const MAX_ATTEMPTS = 5;

export function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hashIp(ip: string): string {
  return sha256(`kcc:${ip}`);
}

async function setting(key: string, fallback: number): Promise<number> {
  const { data } = await supabaseAdmin.from("app_settings").select("value").eq("key", key).maybeSingle();
  const raw = data?.value;
  const parsed = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * SMS delivery adapter. No gateway is provisioned yet (Indian DLT sender-ID
 * registration is an open launch blocker), so delivery reports as failed and
 * the submission falls back to the phone-unverified admin queue (OTP-10).
 */
async function sendSms(_phone: string, _message: string): Promise<boolean> {
  return false;
}

export async function createOtpChallenge(phone: string, ipHash: string) {
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();

  const { count: ipCount } = await supabaseAdmin
    .from("otp_challenges")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", hourAgo);
  if ((ipCount ?? 0) >= 20) {
    return { ok: false as const, reason: "rate_limited" as const };
  }

  const { count: phoneCount } = await supabaseAdmin
    .from("otp_challenges")
    .select("id", { count: "exact", head: true })
    .eq("phone", phone)
    .gte("created_at", hourAgo);
  if ((phoneCount ?? 0) >= 4) {
    return { ok: false as const, reason: "rate_limited" as const };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const delivered = await sendSms(phone, `${code} is your Kerala Camp Check verification code.`);

  const { data, error } = await supabaseAdmin
    .from("otp_challenges")
    .insert({
      phone,
      code_hash: sha256(`${phone}:${code}`),
      ip_hash: ipHash,
      delivery_failed: !delivered,
      expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false as const, reason: "error" as const };
  return { ok: true as const, challengeId: data.id, delivered };
}

export async function verifyOtpChallenge(challengeId: string, phone: string, code: string) {
  const { data } = await supabaseAdmin
    .from("otp_challenges")
    .select("*")
    .eq("id", challengeId)
    .maybeSingle();

  if (!data || data.phone !== phone) return { ok: false as const, reason: "invalid" as const };
  if (data.consumed_at) return { ok: false as const, reason: "invalid" as const };
  if (new Date(data.expires_at).getTime() < Date.now()) return { ok: false as const, reason: "expired" as const };
  if (data.attempts >= MAX_ATTEMPTS) return { ok: false as const, reason: "too_many" as const };

  if (sha256(`${phone}:${code}`) !== data.code_hash) {
    await supabaseAdmin
      .from("otp_challenges")
      .update({ attempts: data.attempts + 1 })
      .eq("id", challengeId);
    return { ok: false as const, reason: "wrong" as const };
  }

  await supabaseAdmin
    .from("otp_challenges")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", challengeId);
  return { ok: true as const };
}

function normaliseName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(govt|government|ghss|gvhss|hss|hs|lps|ups|st|saint|school|higher|secondary)\b/g, " ")
    .replace(/(?:zh|dh|th|kh|gh|ch|sh|bh|ph)/g, (m) => m[0]!)
    .replace(/([a-z])\1+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSetRatio(a: string, b: string): number {
  const setA = new Set(normaliseName(a).split(" ").filter(Boolean));
  const setB = new Set(normaliseName(b).split(" ").filter(Boolean));
  if (setA.size === 0 || setB.size === 0) return 0;
  let shared = 0;
  setA.forEach((token) => {
    if (setB.has(token)) shared += 1;
  });
  return (2 * shared) / (setA.size + setB.size);
}

function distanceMetres(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6_371_000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180);
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function findDuplicate(payload: ReportPayload) {
  const radius = await setting("duplicate_radius_m", 150);
  const threshold = await setting("name_similarity_threshold", 0.85);

  const { data: candidates } = await supabaseAdmin
    .from("camps")
    .select("id, name, latitude, longitude, lsg_name, status")
    .eq("district_code", payload.districtCode)
    .in("verification_state", ["unverified", "verified"]);

  for (const camp of candidates ?? []) {
    if (
      payload.latitude != null &&
      payload.longitude != null &&
      camp.latitude != null &&
      camp.longitude != null
    ) {
      const metres = distanceMetres(
        { lat: payload.latitude, lng: payload.longitude },
        { lat: Number(camp.latitude), lng: Number(camp.longitude) },
      );
      if (metres <= radius) return camp;
    }
    if (
      camp.lsg_name.toLowerCase() === payload.lsgName.toLowerCase() &&
      tokenSetRatio(camp.name, payload.name) >= threshold
    ) {
      return camp;
    }
  }
  return null;
}

function referenceCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) code += alphabet[randomInt(0, alphabet.length)];
  return `KCC-${code}`;
}

async function storeImages(reportId: string, campId: string | null, images: ReportPayload["images"]) {
  const hashes = new Set<string>();
  const rows = [];

  for (const [index, image] of images.entries()) {
    const base64 = image.dataUrl.split(",")[1] ?? "";
    const bytes = Buffer.from(base64, "base64");
    if (bytes.byteLength === 0 || bytes.byteLength > 1_048_576) continue;

    const digest = sha256(bytes);
    if (hashes.has(digest)) continue;
    hashes.add(digest);

    const path = `${reportId}/${index}-${digest.slice(0, 12)}.jpg`;
    const { error } = await supabaseAdmin.storage
      .from("camp-images")
      .upload(path, bytes, { contentType: "image/jpeg", upsert: true });
    if (error) continue;

    const { count: reuse } = await supabaseAdmin
      .from("report_images")
      .select("id", { count: "exact", head: true })
      .eq("sha256", digest);

    const reasons = [...image.qualityReasons];
    if ((reuse ?? 0) > 0) reasons.push("reused_image");

    rows.push({
      report_id: reportId,
      camp_id: campId,
      storage_path: path,
      file_size_bytes: bytes.byteLength,
      width: image.width,
      height: image.height,
      sha256: digest,
      blur_score: image.blurScore,
      brightness_score: image.brightnessScore,
      exif_lat: image.exifLat ?? null,
      exif_lng: image.exifLng ?? null,
      exif_captured_at: image.exifCapturedAt ?? null,
      quality_status: reasons.length > 0 ? ("warn" as const) : ("pass" as const),
      quality_reasons: reasons,
    });
  }

  if (rows.length > 0) await supabaseAdmin.from("report_images").insert(rows);
  return rows.length;
}

export async function persistReport(payload: ReportPayload, ipHash: string) {
  const autoFlags: string[] = [];
  let phoneVerifiedAt: string | null = null;
  let phoneUnverified = true;

  if (payload.challengeId && payload.otpCode) {
    const result = await verifyOtpChallenge(payload.challengeId, payload.reporterPhonePrimary, payload.otpCode);
    if (!result.ok) return { ok: false as const, reason: result.reason };
    phoneVerifiedAt = new Date().toISOString();
    phoneUnverified = false;
  } else {
    autoFlags.push("phone_unverified_sms_fallback");
  }

  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const { count: recent } = await supabaseAdmin
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("reporter_phone_primary", payload.reporterPhonePrimary)
    .gte("submitted_at", dayAgo);
  if ((recent ?? 0) >= 5) autoFlags.push("high_volume_reporter");

  const now = new Date().toISOString();
  const existing = payload.campId
    ? (await supabaseAdmin.from("camps").select("id, name, status").eq("id", payload.campId).maybeSingle()).data
    : await findDuplicate(payload);

  let campId: string;
  let heldAsDuplicate = false;

  if (existing) {
    campId = existing.id;
    heldAsDuplicate = !payload.campId;
    if (heldAsDuplicate) autoFlags.push("duplicate_held");
    if (existing.status !== payload.reportedStatus) autoFlags.push("status_contradiction");

    const { data: current } = await supabaseAdmin
      .from("camps")
      .select("report_count")
      .eq("id", campId)
      .maybeSingle();

    await supabaseAdmin
      .from("camps")
      .update({
        report_count: (current?.report_count ?? 0) + 1,
        ...(payload.reportedStatus === "active" ? { status_last_confirmed_at: now } : {}),
      })
      .eq("id", campId);
  } else {
    const { data: created, error } = await supabaseAdmin
      .from("camps")
      .insert({
        name: payload.name,
        name_ml: payload.nameMl ?? null,
        building_type: payload.buildingType ?? null,
        district_code: payload.districtCode,
        taluk: payload.taluk,
        lsg_type: payload.lsgType,
        lsg_name: payload.lsgName,
        village_or_locality: payload.villageOrLocality ?? null,
        landmark: payload.landmark ?? null,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        location_accuracy_m: payload.locationAccuracyM ?? null,
        camp_incharge_name: payload.campInchargeName ?? null,
        camp_phone_primary: payload.campPhonePrimary ?? null,
        camp_phone_secondary: payload.campPhoneSecondary ?? null,
        verification_state: "unverified",
        status: payload.reportedStatus,
        reported_urgency: payload.reportedUrgency,
        reported_urgency_reason: payload.reportedUrgencyReason ?? null,
        status_last_confirmed_at: now,
        report_count: 1,
      })
      .select("id")
      .single();
    if (error || !created) return { ok: false as const, reason: "error" as const };
    campId = created.id;

    const { data: source } = await supabaseAdmin
      .from("sources")
      .select("id")
      .eq("type", "public_submission")
      .eq("label", "Public submission")
      .maybeSingle();
    const sourceId =
      source?.id ??
      (
        await supabaseAdmin
          .from("sources")
          .insert({ type: "public_submission", label: "Public submission" })
          .select("id")
          .single()
      ).data?.id;
    if (sourceId) await supabaseAdmin.from("camp_sources").insert({ camp_id: campId, source_id: sourceId });
  }

  const reference = referenceCode();
  const { data: report, error: reportError } = await supabaseAdmin
    .from("reports")
    .insert({
      reference_code: reference,
      camp_id: campId,
      is_correction: payload.isCorrection ?? false,
      correction_note: payload.correctionNote ?? null,
      reporter_name: payload.reporterName,
      reporter_phone_primary: payload.reporterPhonePrimary,
      reporter_phone_secondary: payload.reporterPhoneSecondary ?? null,
      reporter_gender: payload.reporterGender ?? null,
      reporter_relationship: payload.reporterRelationship ?? null,
      phone_verified_at: phoneVerifiedAt,
      phone_unverified: phoneUnverified,
      submitted_lat: payload.latitude ?? null,
      submitted_lng: payload.longitude ?? null,
      device_location_granted: payload.deviceLocationGranted,
      reported_status: payload.reportedStatus,
      reported_urgency: payload.reportedUrgency,
      reported_urgency_reason: payload.reportedUrgencyReason ?? null,
      payload: { landmark: payload.landmark ?? null, village: payload.villageOrLocality ?? null },
      auto_flags: autoFlags,
      ip_hash: ipHash,
    })
    .select("id")
    .single();

  if (reportError || !report) return { ok: false as const, reason: "error" as const };

  await storeImages(report.id, heldAsDuplicate ? null : campId, payload.images);

  if (heldAsDuplicate) {
    await supabaseAdmin.from("audit_log").insert({
      actor_type: "system",
      actor_id: report.id,
      entity_type: "camp",
      entity_id: campId,
      action: "corroborating_report_held",
      after: { report_id: report.id, auto_flags: autoFlags },
      note: "New report matched an existing camp and is held for admin review.",
    });
  }

  await supabaseAdmin.from("audit_log").insert({
    actor_type: "public",
    actor_id: report.id,
    entity_type: "report",
    entity_id: report.id,
    action: payload.isCorrection ? "correction_submitted" : "report_submitted",
    after: { camp_id: campId, reference, auto_flags: autoFlags },
  });

  return {
    ok: true as const,
    reference,
    campId,
    heldAsDuplicate,
    phoneUnverified,
  };
}

export async function signedCampImages(campId: string) {
  const { data } = await supabaseAdmin
    .from("report_images")
    .select("id, storage_path")
    .eq("camp_id", campId)
    .eq("hidden", false)
    .limit(8);

  const results: Array<{ id: string; url: string }> = [];
  for (const row of data ?? []) {
    const { data: signed } = await supabaseAdmin.storage
      .from("camp-images")
      .createSignedUrl(row.storage_path, 3600);
    if (signed?.signedUrl) results.push({ id: row.id, url: signed.signedUrl });
  }
  return results;
}

export async function flagImage(imageId: string, reason: string) {
  await supabaseAdmin.from("audit_log").insert({
    actor_type: "public",
    entity_type: "report_image",
    entity_id: imageId,
    action: "image_flagged",
    note: reason.slice(0, 500),
  });
}
