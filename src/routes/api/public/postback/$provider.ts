import { createFileRoute } from "@tanstack/react-router";

/**
 * Offerwall postback endpoint.
 *
 *   GET/POST /api/public/postback/<provider-slug>
 *     ?user_id=<uuid>&tx_id=<string>&points=<int>&ts=<unix seconds>&nonce=<string>&sig=<hmac>
 *
 * Security controls:
 *  - provider must exist and be active
 *  - HMAC-SHA256 signature over the canonical payload with the provider's callback secret
 *  - timestamp freshness window (5 minutes) to stop replays
 *  - nonce uniqueness (unique index on postbacks)
 *  - transaction-id uniqueness (unique index on offer_completions) => no double rewards
 *  - the reward amount is multiplied/validated server-side; the point grant happens
 *    inside a single database transaction
 */
export const Route = createFileRoute("/api/public/postback/$provider")({
  server: {
    handlers: {
      GET: ({ request, params }) => handlePostback(request, params.provider),
      POST: ({ request, params }) => handlePostback(request, params.provider),
    },
  },
});

const deny = (reason: string, status = 400) =>
  new Response(JSON.stringify({ ok: false, error: reason }), {
    status,
    headers: { "content-type": "application/json" },
  });

async function handlePostback(request: Request, providerSlug: string): Promise<Response> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { hmacHex, safeCompare, clientIpHash, rateLimit } = await import("@/lib/security.server");

  const url = new URL(request.url);
  const p = url.searchParams;
  const userId = p.get("user_id") ?? "";
  const txId = p.get("tx_id") ?? "";
  const pointsRaw = p.get("points") ?? "";
  const ts = p.get("ts") ?? "";
  const nonce = p.get("nonce") ?? "";
  const signature = p.get("sig") ?? "";
  const ipHash = clientIpHash();

  const record = async (accepted: boolean, signatureValid: boolean, reason: string, providerId: string | null) => {
    await supabaseAdmin.from("postbacks").insert({
      provider_id: providerId,
      provider_slug: providerSlug,
      external_transaction_id: txId || null,
      nonce: nonce || null,
      signature_valid: signatureValid,
      accepted,
      reason,
      ip_hash: ipHash,
      payload: { query: Object.fromEntries(p.entries()) } as never,
    });
  };

  if (!(await rateLimit("postback", `${providerSlug}:${ipHash ?? "unknown"}`, 300, 60))) {
    return deny("RATE_LIMITED", 429);
  }

  if (!userId || !txId || !pointsRaw || !ts || !nonce || !signature) {
    await record(false, false, "MISSING_PARAMS", null);
    return deny("MISSING_PARAMS");
  }

  const points = Number.parseInt(pointsRaw, 10);
  if (!Number.isSafeInteger(points) || points <= 0 || points > 10_000_000) {
    await record(false, false, "INVALID_POINTS", null);
    return deny("INVALID_POINTS");
  }

  const { data: provider } = await supabaseAdmin
    .from("offer_providers")
    .select("id, is_active, category")
    .eq("slug", providerSlug)
    .maybeSingle();

  if (!provider || !provider.is_active) {
    await record(false, false, "UNKNOWN_OR_INACTIVE_PROVIDER", provider?.id ?? null);
    return deny("UNKNOWN_PROVIDER", 404);
  }

  const { data: secrets } = await supabaseAdmin
    .from("provider_secrets")
    .select("callback_secret")
    .eq("provider_id", provider.id)
    .maybeSingle();

  if (!secrets?.callback_secret) {
    await record(false, false, "NO_CALLBACK_SECRET", provider.id);
    return deny("PROVIDER_NOT_CONFIGURED", 503);
  }

  const expected = hmacHex(
    secrets.callback_secret,
    `${providerSlug}|${userId}|${txId}|${points}|${ts}|${nonce}`,
  );
  if (!safeCompare(expected, signature.toLowerCase())) {
    await record(false, false, "BAD_SIGNATURE", provider.id);
    return deny("BAD_SIGNATURE", 401);
  }

  const tsSeconds = Number.parseInt(ts, 10);
  if (!Number.isSafeInteger(tsSeconds) || Math.abs(Date.now() / 1000 - tsSeconds) > 300) {
    await record(false, true, "STALE_TIMESTAMP", provider.id);
    return deny("STALE_TIMESTAMP");
  }

  // Replay protection: the unique index on (provider_slug, nonce) rejects repeats.
  const { error: nonceError } = await supabaseAdmin.from("postbacks").insert({
    provider_id: provider.id,
    provider_slug: providerSlug,
    external_transaction_id: txId,
    nonce,
    signature_valid: true,
    accepted: false,
    reason: "PROCESSING",
    ip_hash: ipHash,
    payload: { query: Object.fromEntries(p.entries()) } as never,
  });
  if (nonceError) {
    return deny("REPLAY_DETECTED", 409);
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, status")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return deny("UNKNOWN_USER", 404);
  if (profile.status === "BANNED" || profile.status === "SUSPENDED") {
    return deny("ACCOUNT_RESTRICTED", 403);
  }

  const { data: result, error } = await supabaseAdmin.rpc("award_offer_points", {
    p_user: userId,
    p_provider: provider.id,
    p_offer: undefined as unknown as string,
    p_tx: txId,
    p_points: points,
    p_type: provider.category === "SURVEY" ? "SURVEY_COMPLETED" : "OFFER_COMPLETED",
    p_meta: { provider: providerSlug } as never,
  });

  if (error) {
    console.error("[postback] award failed", error.message);
    return deny("UNAVAILABLE", 500);
  }

  const status = String(result);
  if (status === "DUPLICATE") {
    return new Response(JSON.stringify({ ok: true, duplicate: true }), {
      headers: { "content-type": "application/json" },
    });
  }
  if (status !== "OK") return deny(status);

  await supabaseAdmin
    .from("postbacks")
    .update({ accepted: true, reason: "OK" })
    .eq("provider_slug", providerSlug)
    .eq("nonce", nonce);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
}
