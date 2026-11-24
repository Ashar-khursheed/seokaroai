import { handleWebhook, verifyWebhook } from "@/lib/billing/paddle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Paddle Billing webhook. Configure in Paddle: notification URL https://<domain>/api/webhooks/paddle, events subscription.*. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!(await verifyWebhook(raw, req.headers.get("paddle-signature")))) return new Response("Invalid signature", { status: 401 });
  try {
    await handleWebhook(raw);
    return new Response("ok");
  } catch (e) {
    console.error("[paddle] webhook", e);
    return new Response("Error", { status: 500 }); // Paddle retries
  }
}
