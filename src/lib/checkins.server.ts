import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { hashIp } from "./reports.server";

export type CheckInInput = {
  campId: string;
  phone: string;
  isOpen: boolean;
  note?: string | null | undefined;
  latitude?: number | null | undefined;
  longitude?: number | null | undefined;
  peopleCount?: number | null | undefined;
  familyCount?: number | null | undefined;
  childrenCount?: number | null | undefined;
  amenities?: string[] | undefined;
};

export type CheckInResult =
  | { ok: true; count: number }
  | { ok: false; reason: "already_phone" | "already_ip" | "error" };

/** One check-in per phone number and one per network per camp, per IST day. */
export async function recordCheckIn(input: CheckInInput, ip: string): Promise<CheckInResult> {
  const ipHash = hashIp(ip);

  const { error } = await supabaseAdmin.from("camp_checkins").insert({
    camp_id: input.campId,
    phone: input.phone,
    ip_hash: ipHash,
    is_open: input.isOpen,
    note: input.note ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    people_count: input.peopleCount ?? null,
    family_count: input.familyCount ?? null,
    children_count: input.childrenCount ?? null,
    amenities: input.amenities ?? [],
  });

  if (error) {
    if (error.code === "23505") {
      const already = error.message.includes("ip_uniq") ? "already_ip" : "already_phone";
      return { ok: false, reason: already };
    }
    return { ok: false, reason: "error" };
  }

  const { data } = await supabaseAdmin
    .from("camps")
    .select("checkin_count")
    .eq("id", input.campId)
    .maybeSingle();

  return { ok: true, count: data?.checkin_count ?? 1 };
}

export async function recentCheckIns(campId: string) {
  const { data } = await supabaseAdmin
    .from("camp_checkins")
    .select("id, is_open, note, created_at, phone, people_count, family_count, children_count, amenities")
    .eq("camp_id", campId)
    .order("created_at", { ascending: false })
    .limit(8);

  return (data ?? []).map((row) => ({
    id: row.id,
    isOpen: row.is_open,
    note: row.note,
    createdAt: row.created_at,
    peopleCount: row.people_count,
    familyCount: row.family_count,
    childrenCount: row.children_count,
    amenities: row.amenities ?? [],
    // Never expose full numbers publicly.
    phoneMasked: `••••• ${String(row.phone).slice(-4)}`,
  }));
}
