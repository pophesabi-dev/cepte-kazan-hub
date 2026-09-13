import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  methodId: z.string().uuid(),
  points: z.number().int().positive().max(100_000_000),
});

/**
 * Server-authoritative withdrawal. The browser only proposes an amount; the
 * database function recalculates the balance, checks phone verification,
 * method limits and account status inside a single transaction.
 */
export const requestWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { rateLimit, logRiskEvent, recomputeRiskScore } = await import("./security.server");

    const allowed = await rateLimit("withdrawal", context.userId, 5, 3600);
    if (!allowed) {
      await logRiskEvent(context.userId, "WITHDRAWAL_RATE_LIMIT", "MEDIUM");
      return { ok: false as const, error: "RATE_LIMITED" };
    }

    await recomputeRiskScore(context.userId);

    const { data: result, error } = await supabaseAdmin.rpc("create_withdrawal", {
      p_user: context.userId,
      p_method: data.methodId,
      p_points: data.points,
    });

    if (error) {
      console.error("[requestWithdrawal]", error.message);
      return { ok: false as const, error: "UNAVAILABLE" };
    }
    return result as { ok: boolean; error?: string; id?: string };
  });
