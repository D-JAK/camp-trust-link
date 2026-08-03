import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { hashIp, verifyOtpChallenge } from "./reports.server";

export type PledgeInput = {
  needId: string;
  quantity: number;
  donorName: string;
  donorPhone: string;
  challengeId?: string | null | undefined;
  otpCode?: string | null | undefined;
};

export type PledgeResult =
  | { ok: true; verified: boolean; pledgedQty: number; neededQty: number }
  | { ok: false; reason: "not_found" | "otp_failed" | "error" };

/**
 * Records a donation pledge against a camp requirement. The phone is verified
 * by OTP when SMS delivery works; otherwise the pledge is stored unverified so
 * the camp can still see it (same fallback as camp reports).
 */
export async function recordPledge(input: PledgeInput, ip: string): Promise<PledgeResult> {
  const { data: need } = await supabaseAdmin
    .from("camp_needs")
    .select("id, camp_id, needed_qty, pledged_qty")
    .eq("id", input.needId)
    .maybeSingle();

  if (!need) return { ok: false, reason: "not_found" };

  let verified = false;
  if (input.challengeId && input.otpCode) {
    const result = await verifyOtpChallenge(input.challengeId, input.donorPhone, input.otpCode);
    if (!result.ok) return { ok: false, reason: "otp_failed" };
    verified = true;
  }

  const { error } = await supabaseAdmin.from("need_pledges").insert({
    need_id: need.id,
    camp_id: need.camp_id,
    quantity: input.quantity,
    donor_name: input.donorName,
    donor_phone: input.donorPhone,
    phone_verified: verified,
    ip_hash: hashIp(ip),
  });

  if (error) return { ok: false, reason: "error" };

  return {
    ok: true,
    verified,
    pledgedQty: need.pledged_qty + input.quantity,
    neededQty: need.needed_qty,
  };
}
