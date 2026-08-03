import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const phoneSchema = z.string().regex(/^\+91[6-9]\d{9}$/, "invalid phone");

const pledgeSchema = z.object({
  needId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100000),
  donorName: z.string().trim().min(2).max(120),
  donorPhone: phoneSchema,
  challengeId: z.string().uuid().nullable().optional(),
  otpCode: z.string().regex(/^\d{6}$/).nullable().optional(),
});

function callerIp(): string {
  const request = getRequest();
  const header =
    request?.headers.get("cf-connecting-ip") ??
    request?.headers.get("x-forwarded-for") ??
    "unknown";
  return header.split(",")[0]!.trim();
}

export const requestDonorOtp = createServerFn({ method: "POST" })
  .inputValidator((data: { phone: string }) => z.object({ phone: phoneSchema }).parse(data))
  .handler(async ({ data }) => {
    const { createOtpChallenge, hashIp } = await import("./reports.server");
    return createOtpChallenge(data.phone, hashIp(callerIp()));
  });

export const pledgeDonation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => pledgeSchema.parse(data))
  .handler(async ({ data }) => {
    const { recordPledge } = await import("./needs.server");
    return recordPledge(data, callerIp());
  });
