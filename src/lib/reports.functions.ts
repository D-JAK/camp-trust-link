import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const phoneSchema = z.string().regex(/^\+91[6-9]\d{9}$/, "invalid phone");

const imageSchema = z.object({
  dataUrl: z.string().max(2_200_000),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  blurScore: z.number().nullable(),
  brightnessScore: z.number().nullable(),
  exifLat: z.number().nullable().optional(),
  exifLng: z.number().nullable().optional(),
  exifCapturedAt: z.string().nullable().optional(),
  qualityReasons: z.array(z.string()).max(6),
});

const submitSchema = z.object({
  campId: z.string().uuid().nullable().optional(),
  isCorrection: z.boolean().optional(),
  correctionNote: z.string().max(1000).nullable().optional(),
  name: z.string().trim().min(2).max(160),
  nameMl: z.string().max(160).nullable().optional(),
  buildingType: z
    .enum(["school", "college", "community_hall", "place_of_worship", "government_building", "other"])
    .nullable()
    .optional(),
  districtCode: z.string().min(2).max(4),
  taluk: z.string().min(2).max(80),
  lsgType: z.enum(["panchayat", "municipality", "corporation"]),
  lsgName: z.string().trim().min(2).max(120),
  villageOrLocality: z.string().max(120).nullable().optional(),
  landmark: z.string().max(200).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  locationAccuracyM: z.number().int().nullable().optional(),
  campInchargeName: z.string().max(120).nullable().optional(),
  campPhonePrimary: phoneSchema.nullable().optional(),
  campPhoneSecondary: phoneSchema.nullable().optional(),
  reportedStatus: z.enum(["active", "inactive"]),
  reportedUrgency: z.enum(["normal", "high", "critical"]),
  reportedUrgencyReason: z.string().max(500).nullable().optional(),
  reporterName: z.string().trim().min(2).max(120),
  reporterPhonePrimary: phoneSchema,
  reporterPhoneSecondary: phoneSchema.nullable().optional(),
  reporterGender: z.enum(["male", "female", "other", "prefer_not_to_say"]).nullable().optional(),
  reporterRelationship: z.enum(["resident", "volunteer", "camp_staff", "official", "other"]).nullable().optional(),
  deviceLocationGranted: z.boolean(),
  challengeId: z.string().uuid().nullable().optional(),
  otpCode: z.string().regex(/^\d{6}$/).nullable().optional(),
  images: z.array(imageSchema).min(2).max(4),
});

function callerIp(): string {
  const request = getRequest();
  const header =
    request?.headers.get("cf-connecting-ip") ??
    request?.headers.get("x-forwarded-for") ??
    "unknown";
  return header.split(",")[0]!.trim();
}

export const requestOtp = createServerFn({ method: "POST" })
  .inputValidator((data: { phone: string }) => z.object({ phone: phoneSchema }).parse(data))
  .handler(async ({ data }) => {
    const { createOtpChallenge, hashIp } = await import("./reports.server");
    const result = await createOtpChallenge(data.phone, hashIp(callerIp()));
    return result;
  });

export const submitReport = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data }) => {
    const { persistReport, hashIp } = await import("./reports.server");
    if (data.reportedUrgency !== "normal" && (data.reportedUrgencyReason ?? "").trim().length < 10) {
      return { ok: false as const, reason: "reason_required" as const };
    }
    return persistReport(data, hashIp(callerIp()));
  });

export const getCampImages = createServerFn({ method: "GET" })
  .inputValidator((data: { campId: string }) => z.object({ campId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { signedCampImages } = await import("./reports.server");
    return signedCampImages(data.campId);
  });

export const reportImage = createServerFn({ method: "POST" })
  .inputValidator((data: { imageId: string; reason: string }) =>
    z.object({ imageId: z.string().uuid(), reason: z.string().min(3).max(500) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { flagImage } = await import("./reports.server");
    await flagImage(data.imageId, data.reason);
    return { ok: true as const };
  });
