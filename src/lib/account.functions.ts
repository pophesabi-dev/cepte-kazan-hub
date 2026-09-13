import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DashboardData = {
  profile: {
    displayName: string | null;
    referralCode: string;
    phoneVerified: boolean;
    status: string;
    createdAt: string;
  };
  balance: { total: number; pending: number; today: number; week: number };
  completedTasks: number;
  referralCount: number;
  riskLevel: string;
  isAdmin: boolean;
};

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DashboardData> => {
    const { supabase, userId } = context;

    const [profileRes, balanceRes, completionsRes, referralsRes, riskRes, adminRes] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, referral_code, phone_verified, status, created_at")
          .eq("id", userId)
          .maybeSingle(),
        supabase.rpc("my_balance"),
        supabase
          .from("offer_completions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "CONFIRMED"),
        supabase
          .from("referrals")
          .select("id", { count: "exact", head: true })
          .eq("referrer_id", userId),
        supabase.from("risk_scores").select("level").eq("user_id", userId).maybeSingle(),
        supabase.rpc("is_admin", { _user_id: userId }),
      ]);

    const balanceRow = Array.isArray(balanceRes.data) ? balanceRes.data[0] : null;

    return {
      profile: {
        displayName: profileRes.data?.display_name ?? null,
        referralCode: profileRes.data?.referral_code ?? "",
        phoneVerified: profileRes.data?.phone_verified ?? false,
        status: profileRes.data?.status ?? "ACTIVE",
        createdAt: profileRes.data?.created_at ?? new Date().toISOString(),
      },
      balance: {
        total: Number(balanceRow?.total ?? 0),
        pending: Number(balanceRow?.pending ?? 0),
        today: Number(balanceRow?.today ?? 0),
        week: Number(balanceRow?.week ?? 0),
      },
      completedTasks: completionsRes.count ?? 0,
      referralCount: referralsRes.count ?? 0,
      riskLevel: riskRes.data?.level ?? "LOW",
      isAdmin: adminRes.data === true,
    };
  });

const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(40),
  country: z.string().trim().max(2).optional(),
});

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => profileSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        display_name: data.displayName,
        country: data.country ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", context.userId);
    if (error) {
      console.error("[updateProfile]", error.message);
      return { ok: false as const };
    }
    return { ok: true as const };
  });

/** Records the signup fingerprint + initial risk score. Called once after sign-up. */
export const initAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ referralCode: z.string().trim().max(32).optional() })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { clientIpHash, recomputeRiskScore, logRiskEvent } = await import("./security.server");

    const ipHash = clientIpHash();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, signup_ip_hash, referred_by, created_at")
      .eq("id", userId)
      .maybeSingle();
    if (!profile) return { ok: false as const, error: "NO_PROFILE" };

    if (!profile.signup_ip_hash && ipHash) {
      await supabaseAdmin.from("profiles").update({ signup_ip_hash: ipHash }).eq("id", userId);
    }
    await supabaseAdmin
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", userId);

    // Referral attribution — server side only, one time, never self-referral.
    if (data.referralCode && !profile.referred_by) {
      const code = data.referralCode.toUpperCase();
      const { data: referrer } = await supabaseAdmin
        .from("profiles")
        .select("id, signup_ip_hash")
        .eq("referral_code", code)
        .maybeSingle();

      if (referrer && referrer.id !== userId) {
        const sameNetwork = Boolean(ipHash) && referrer.signup_ip_hash === ipHash;
        await supabaseAdmin.from("profiles").update({ referred_by: referrer.id }).eq("id", userId);
        await supabaseAdmin.from("referrals").insert({
          referrer_id: referrer.id,
          referred_id: userId,
          status: sameNetwork ? "BLOCKED" : "PENDING",
          risk_flag: sameNetwork ? "SAME_NETWORK" : null,
        });
        if (sameNetwork) {
          await logRiskEvent(userId, "REFERRAL_SAME_NETWORK", "MEDIUM", { referrer: referrer.id });
        }
      }
    }

    await recomputeRiskScore(userId);
    return { ok: true as const };
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", context.userId)
      .is("read_at", null);
    return { ok: true as const };
  });
