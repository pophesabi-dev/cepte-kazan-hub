import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Never store raw IPs / phone numbers. Everything identifying is hashed with a pepper. */
export function hashValue(value: string): string {
  const pepper = process.env["APP_HASH_PEPPER"] ?? "ceptekazanc-default-pepper";
  return createHash("sha256").update(`${pepper}:${value}`).digest("hex");
}

export function clientIpHash(): string | null {
  try {
    const ip = getRequestIP({ xForwardedFor: true }) ?? getRequestHeader("cf-connecting-ip");
    return ip ? hashValue(ip) : null;
  } catch {
    return null;
  }
}

export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function hmacHex(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Server-side, database backed rate limit. Atomic counter — cannot be bypassed
 * from the browser because the counter lives in Postgres.
 */
export async function rateLimit(
  bucket: string,
  identity: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("bump_rate_limit", {
    p_bucket: bucket,
    p_identity: identity,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[rateLimit]", error.message);
    return false;
  }
  return (data ?? 0) <= limit;
}

export async function logRiskEvent(
  userId: string | null,
  type: string,
  severity: "LOW" | "MEDIUM" | "HIGH",
  signals: Record<string, unknown> = {},
): Promise<void> {
  await supabaseAdmin.from("risk_events").insert({
    user_id: userId,
    type,
    severity,
    signals: signals as never,
    ip_hash: clientIpHash(),
  });
}

/**
 * Recomputes a composite risk score from several signals. A single signal
 * (for example VPN usage) never bans an account on its own — it only raises
 * the score, which can trigger review steps.
 */
export async function recomputeRiskScore(userId: string): Promise<number> {
  const reasons: string[] = [];
  let score = 0;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("created_at, phone_verified, signup_ip_hash")
    .eq("id", userId)
    .maybeSingle();

  if (profile) {
    const ageHours = (Date.now() - new Date(profile.created_at).getTime()) / 36e5;
    if (ageHours < 24) {
      score += 10;
      reasons.push("NEW_ACCOUNT");
    }
    if (!profile.phone_verified) {
      score += 10;
      reasons.push("PHONE_UNVERIFIED");
    }
    if (profile.signup_ip_hash) {
      const { count } = await supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("signup_ip_hash", profile.signup_ip_hash);
      if ((count ?? 0) > 2) {
        score += 30;
        reasons.push("MULTI_ACCOUNT_SAME_DEVICE_NETWORK");
      }
    }
  }

  const { data: events } = await supabaseAdmin
    .from("risk_events")
    .select("severity")
    .eq("user_id", userId)
    .gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString());

  for (const event of events ?? []) {
    score += event.severity === "HIGH" ? 25 : event.severity === "MEDIUM" ? 10 : 3;
  }
  if ((events?.length ?? 0) > 0) reasons.push("RISK_EVENTS");

  score = Math.min(score, 100);
  const level = score >= 60 ? "HIGH" : score >= 30 ? "MEDIUM" : "LOW";

  await supabaseAdmin
    .from("risk_scores")
    .upsert(
      { user_id: userId, score, level, reasons: reasons as never, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  return score;
}

/** Placeholder adapter. Real IP-reputation providers plug in here later. */
export async function networkRiskSignals(): Promise<{
  vpn: boolean;
  proxy: boolean;
  tor: boolean;
  enabled: boolean;
}> {
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("key, value")
    .in("key", ["vpn_detection", "proxy_detection", "tor_detection"]);
  const map = new Map((data ?? []).map((row) => [row.key, row.value]));
  const enabled =
    map.get("vpn_detection") === true ||
    map.get("proxy_detection") === true ||
    map.get("tor_detection") === true;
  // No detection provider is configured yet, so no signals are asserted.
  return { vpn: false, proxy: false, tor: false, enabled };
}
