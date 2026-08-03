import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { AMENITY_KEYS } from "./amenities";

const schema = z.object({
  campId: z.string().uuid(),
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, "invalid phone"),
  isOpen: z.boolean(),
  note: z.string().max(280).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  peopleCount: z.number().int().min(0).max(20000).nullable().optional(),
  familyCount: z.number().int().min(0).max(5000).nullable().optional(),
  childrenCount: z.number().int().min(0).max(10000).nullable().optional(),
  amenities: z.array(z.enum(AMENITY_KEYS as [string, ...string[]])).max(20).optional(),
});

function callerIp(): string {
  const request = getRequest();
  const header =
    request?.headers.get("cf-connecting-ip") ??
    request?.headers.get("x-forwarded-for") ??
    "unknown";
  return header.split(",")[0]!.trim();
}

export const checkInAtCamp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { recordCheckIn } = await import("./checkins.server");
    return recordCheckIn(data, callerIp());
  });

export const listCheckIns = createServerFn({ method: "GET" })
  .inputValidator((data: { campId: string }) => z.object({ campId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { recentCheckIns } = await import("./checkins.server");
    return recentCheckIns(data.campId);
  });
