import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{7,14}$/, "Geçerli bir telefon numarası gir."),
});

const codeSchema = z.object({ code: z.string().trim().regex(/^\d{6}$/) });

/**
 * Creates an OTP challenge. No SMS provider is connected yet, so the code is
 * generated and stored hashed but not delivered — the adapter below is where a
 * real SMS provider plugs in. Phone numbers are only ever stored hashed.
 */
export const startPhoneVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => phoneSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { rateLimit, hashValue, logRiskEvent } = await import("./security.server");
    const { randomInt, createHash } = await import("node:crypto");

    if (!(await rateLimit("otp_send", context.userId, 3, 900))) {
      await logRiskEvent(context.userId, "OTP_SEND_RATE_LIMIT", "MEDIUM");
      return { ok: false as const, error: "RATE_LIMITED" };
    }

    const phoneHash = hashValue(data.phone);
    const { count } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("phone_hash", phoneHash)
      .neq("id", context.userId);
    if ((count ?? 0) > 0) {
      await logRiskEvent(context.userId, "PHONE_ALREADY_USED", "HIGH");
      return { ok: false as const, error: "PHONE_IN_USE" };
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const codeHash = createHash("sha256").update(`${phoneHash}:${code}`).digest("hex");

    await supabaseAdmin.from("phone_verifications").insert({
      user_id: context.userId,
      phone_hash: phoneHash,
      code_hash: codeHash,
      expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
    });

    // SMS adapter placeholder — connect a provider to actually deliver `code`.
    const delivered = false;
    return { ok: true as const, delivered, reason: delivered ? null : "SMS_NOT_CONFIGURED" };
  });

export const confirmPhoneVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => codeSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { rateLimit, logRiskEvent, recomputeRiskScore } = await import("./security.server");
    const { createHash } = await import("node:crypto");

    if (!(await rateLimit("otp_verify", context.userId, 10, 900))) {
      await logRiskEvent(context.userId, "OTP_VERIFY_RATE_LIMIT", "HIGH");
      return { ok: false as const, error: "RATE_LIMITED" };
    }

    const { data: challenge } = await supabaseAdmin
      .from("phone_verifications")
      .select("id, phone_hash, code_hash, attempts, expires_at, consumed_at")
      .eq("user_id", context.userId)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!challenge) return { ok: false as const, error: "NO_CHALLENGE" };
    if (new Date(challenge.expires_at).getTime() < Date.now())
      return { ok: false as const, error: "EXPIRED" };
    if (challenge.attempts >= 5) return { ok: false as const, error: "TOO_MANY_ATTEMPTS" };

    const expected = createHash("sha256")
      .update(`${challenge.phone_hash}:${data.code}`)
      .digest("hex");

    if (expected !== challenge.code_hash) {
      await supabaseAdmin
        .from("phone_verifications")
        .update({ attempts: challenge.attempts + 1 })
        .eq("id", challenge.id);
      return { ok: false as const, error: "INVALID_CODE" };
    }

    await supabaseAdmin
      .from("phone_verifications")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", challenge.id);
    await supabaseAdmin
      .from("profiles")
      .update({ phone_verified: true, phone_hash: challenge.phone_hash })
      .eq("id", context.userId);
    await recomputeRiskScore(context.userId);

    return { ok: true as const };
  });
