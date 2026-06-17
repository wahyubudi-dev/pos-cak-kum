import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { checkRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";

const webhookSchema = z.object({
  id: z.string().min(1),
  external_id: z.string().uuid(),
  status: z.enum(["PENDING", "PAID", "SETTLED", "EXPIRED"]),
  paid_at: z.string().nullable(),
  payment_channel: z.string().nullable(),
  payment_method: z.string().nullable(),
});

const WEBHOOK_PAID_STATUSES = ["PAID", "SETTLED"] as const;

const IP_HEADERS = ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"];

export async function POST(request: Request) {
  try {
    const ip = IP_HEADERS
      .map((h) => request.headers.get(h))
      .find(Boolean)
      ?.split(",")[0]
      ?.trim()
      ?? "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "too many requests" }, { status: 429 });
    }

    const callbackToken = request.headers.get("x-callback-token");

    const isVerified = verifyWebhook(null, callbackToken);
    if (!isVerified) {
      return NextResponse.json({ error: "invalid token" }, { status: 401 });
    }

    const raw = await request.json();
    const result = webhookSchema.safeParse(raw);

    if (!result.success) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    const body = result.data;

    if (!WEBHOOK_PAID_STATUSES.includes(body.status as typeof WEBHOOK_PAID_STATUSES[number])) {
      return NextResponse.json({ received: true });
    }

    await db
      .update(orders)
      .set({
        status: "pending_confirmation",
        paymentReference: body.id,
        paymentMethod: body.payment_method,
        paymentChannel: body.payment_channel,
        paidAt: body.paid_at ? new Date(body.paid_at) : null,
      })
      .where(
        and(
          eq(orders.id, body.external_id),
          eq(orders.status, "awaiting_payment"),
        ),
      );

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[xendit-webhook]", error);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

function verifyWebhook(
  _payload: unknown,
  callbackToken: string | null,
): boolean {
  const token = process.env.XENDIT_WEBHOOK_TOKEN;
  if (!token) return true;
  if (!callbackToken) return false;
  return callbackToken === token;
}
