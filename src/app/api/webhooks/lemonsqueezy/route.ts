import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { addToWhitelist } from "@/lib/db";

export async function POST(request: NextRequest) {
  const signingSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

  if (!signingSecret) {
    console.error("[LemonSqueezy Webhook] Missing LEMON_SQUEEZY_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Secret not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Verificar firma
  const hmac = crypto.createHmac("sha256", signingSecret);
  const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  if (signatureBuffer.length !== digest.length || !crypto.timingSafeEqual(digest, signatureBuffer)) {
    console.warn("[LemonSqueezy Webhook] Invalid signature detected.");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventName = payload.meta.event_name;
  const data = payload.data;

  console.log(`[LemonSqueezy Webhook] Event received: ${eventName}`);

  // Manejar eventos de éxito de pago
  if (eventName === "order_created" || eventName === "subscription_created" || eventName === "subscription_payment_success") {
    // Intentar sacar el SteamID de la metadata personalizada
    // Nota: Al crear el checkout, debemos enviar custom[steam_id]
    const customData = payload.meta.custom_data || {};
    const steamId = customData.steam_id || customData.steamId;
    const userName = data.attributes.user_name || "Premium User";

    if (steamId) {
      console.log(`[LemonSqueezy Webhook] Activating license for SteamID: ${steamId}`);
      // Por defecto activamos 31 días por cada compra/renovación
      addToWhitelist(steamId, userName, "user", 31);
    } else {
      console.warn("[LemonSqueezy Webhook] Payment received but no SteamID found in custom_data.");
    }
  }

  return NextResponse.json({ success: true });
}
