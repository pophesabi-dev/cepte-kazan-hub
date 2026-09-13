import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type AdminCtx = { supabase: SupabaseClient<Database>; userId: string };

/** Server-side authorization. Hiding UI is never enough. */
async function assertAdmin(context: AdminCtx): Promise<boolean> {
  const { data } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  return data === true;
}

async function audit(
  adminId: string,
  action: string,
  details: {
    targetUserId?: string | null;
    targetTable?: string | null;
    targetId?: string | null;
    oldValue?: unknown;
    newValue?: unknown;
  } = {},
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { clientIpHash } = await import("./security.server");
  await supabaseAdmin.from("admin_audit_logs").insert({
    admin_id: adminId,
    action,
    target_user_id: details.targetUserId ?? null,
    target_table: details.targetTable ?? null,
    target_id: details.targetId ?? null,
    old_value: (details.oldValue ?? null) as never,
    new_value: (details.newValue ?? null) as never,
    ip_hash: clientIpHash(),
  });
}

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await assertAdmin(context))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [users, withdrawals, providers, pendingWithdrawals, highRisk] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("withdrawals").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("offer_providers")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabaseAdmin
        .from("withdrawals")
        .select("id", { count: "exact", head: true })
        .in("status", ["PENDING", "REVIEW"]),
      supabaseAdmin
        .from("risk_scores")
        .select("user_id", { count: "exact", head: true })
        .eq("level", "HIGH"),
    ]);

    return {
      users: users.count ?? 0,
      withdrawals: withdrawals.count ?? 0,
      activeProviders: providers.count ?? 0,
      pendingWithdrawals: pendingWithdrawals.count ?? 0,
      highRiskUsers: highRisk.count ?? 0,
    };
  });

export const adminListUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ search: z.string().trim().max(60).optional() }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    if (!(await assertAdmin(context))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("profiles")
      .select("id, display_name, referral_code, status, phone_verified, created_at, last_login_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data.search) {
      const term = data.search.replace(/[%,()]/g, "");
      query = query.or(`display_name.ilike.%${term}%,referral_code.ilike.%${term}%`);
    }

    const { data: rows, error } = await query;
    if (error) {
      console.error("[adminListUsers]", error.message);
      return [];
    }

    const ids = (rows ?? []).map((r) => r.id);
    const { data: risk } = await supabaseAdmin
      .from("risk_scores")
      .select("user_id, score, level")
      .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const riskMap = new Map((risk ?? []).map((r) => [r.user_id, r]));

    return (rows ?? []).map((row) => ({
      ...row,
      riskScore: riskMap.get(row.id)?.score ?? 0,
      riskLevel: riskMap.get(row.id)?.level ?? "LOW",
    }));
  });

export const adminAdjustPoints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        amount: z.number().int().min(-1_000_000).max(1_000_000),
        reason: z.string().trim().min(3).max(200),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    if (!(await assertAdmin(context))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: result, error } = await supabaseAdmin.rpc("admin_adjust_points", {
      p_admin: context.userId,
      p_user: data.userId,
      p_amount: data.amount,
      p_reason: data.reason,
    });
    if (error) return { ok: false as const, error: "UNAVAILABLE" };

    await audit(context.userId, "POINTS_ADJUST", {
      targetUserId: data.userId,
      newValue: { amount: data.amount, reason: data.reason },
    });
    return result as { ok: boolean; error?: string };
  });

export const adminSetUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        status: z.enum(["ACTIVE", "RESTRICTED", "SUSPENDED", "BANNED"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    if (!(await assertAdmin(context))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: before } = await supabaseAdmin
      .from("profiles")
      .select("status")
      .eq("id", data.userId)
      .maybeSingle();

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ status: data.status })
      .eq("id", data.userId);
    if (error) return { ok: false as const };

    await audit(context.userId, "USER_STATUS_CHANGE", {
      targetUserId: data.userId,
      oldValue: before,
      newValue: { status: data.status },
    });
    return { ok: true as const };
  });

export const adminUpdateProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        providerId: z.string().uuid(),
        isActive: z.boolean().optional(),
        multiplier: z.number().min(0).max(100).optional(),
        minReward: z.number().int().min(0).max(1_000_000).optional(),
        sortOrder: z.number().int().min(0).max(9999).optional(),
        apiKey: z.string().max(400).optional(),
        apiSecret: z.string().max(400).optional(),
        callbackSecret: z.string().max(400).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    if (!(await assertAdmin(context))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.isActive !== undefined) patch["is_active"] = data.isActive;
    if (data.multiplier !== undefined) patch["points_multiplier"] = data.multiplier;
    if (data.minReward !== undefined) patch["min_reward"] = data.minReward;
    if (data.sortOrder !== undefined) patch["sort_order"] = data.sortOrder;

    await supabaseAdmin.from("offer_providers").update(patch).eq("id", data.providerId);

    const secretPatch: Record<string, unknown> = {};
    if (data.apiKey) secretPatch["api_key"] = data.apiKey;
    if (data.apiSecret) secretPatch["api_secret"] = data.apiSecret;
    if (data.callbackSecret) secretPatch["callback_secret"] = data.callbackSecret;
    if (Object.keys(secretPatch).length) {
      secretPatch["provider_id"] = data.providerId;
      secretPatch["updated_at"] = new Date().toISOString();
      await supabaseAdmin
        .from("provider_secrets")
        .upsert(secretPatch as never, { onConflict: "provider_id" });
    }

    // Secret values are never written into the audit log.
    await audit(context.userId, "PROVIDER_UPDATE", {
      targetTable: "offer_providers",
      targetId: data.providerId,
      newValue: { ...patch, secretsChanged: Object.keys(secretPatch).length > 0 },
    });
    return { ok: true as const };
  });

export const adminListWithdrawals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await assertAdmin(context))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("withdrawals")
      .select("id, user_id, points, status, created_at, review_note")
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

export const adminUpdateWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        withdrawalId: z.string().uuid(),
        status: z.enum(["PENDING", "REVIEW", "APPROVED", "REJECTED", "PAID"]),
        note: z.string().trim().max(300).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    if (!(await assertAdmin(context))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: before } = await supabaseAdmin
      .from("withdrawals")
      .select("id, user_id, points, status")
      .eq("id", data.withdrawalId)
      .maybeSingle();
    if (!before) return { ok: false as const };

    await supabaseAdmin
      .from("withdrawals")
      .update({
        status: data.status,
        review_note: data.note ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.withdrawalId);

    // Rejecting a withdrawal returns the reserved points through a reversal entry.
    if (data.status === "REJECTED" && before.status !== "REJECTED") {
      await supabaseAdmin.from("points_ledger").insert({
        user_id: before.user_id,
        type: "REVERSAL",
        amount: before.points,
        status: "CONFIRMED",
        reference: `wd-reversal:${before.id}`,
        description: "Çekim talebi reddedildi",
      });
    }

    await audit(context.userId, "WITHDRAWAL_UPDATE", {
      targetUserId: before.user_id,
      targetTable: "withdrawals",
      targetId: before.id,
      oldValue: { status: before.status },
      newValue: { status: data.status },
    });
    return { ok: true as const };
  });

export const adminUpdateSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ key: z.string().trim().min(2).max(60), value: z.unknown() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    if (!(await assertAdmin(context))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: before } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", data.key)
      .maybeSingle();
    if (!before) return { ok: false as const, error: "UNKNOWN_KEY" };

    await supabaseAdmin
      .from("site_settings")
      .update({ value: data.value as never, updated_at: new Date().toISOString() })
      .eq("key", data.key);

    await audit(context.userId, "SETTING_UPDATE", {
      targetTable: "site_settings",
      targetId: data.key,
      oldValue: before.value,
      newValue: data.value,
    });
    return { ok: true as const };
  });
