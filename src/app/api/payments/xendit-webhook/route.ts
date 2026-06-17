import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";

type XenditCallback = {
  id: string;
  external_id: string;
  status: "PENDING" | "PAID" | "SETTLED" | "EXPIRED";
  paid_at: string | null;
  payment_channel: string | null;
  payment_method: string | null;
};

export async function POST(request: Request) {
  try {
    const body: XenditCallback = await request.json();
    const callbackToken = request.headers.get("x-callback-token");

    const isVerified = verifyWebhook(body, callbackToken);
    if (!isVerified) {
      return NextResponse.json({ error: "invalid token" }, { status: 401 });
    }

    const paidStatuses: XenditCallback["status"][] = ["PAID", "SETTLED"];
    if (!paidStatuses.includes(body.status)) {
      return NextResponse.json({ received: true });
    }

    const externalId = body.external_id;

    await db
      .update(orders)
      .set({
        status: "pending_confirmation",
        paymentReference: body.id,
        paymentMethod: body.payment_method,
        paymentChannel: body.payment_channel,
        paidAt: body.paid_at ? new Date(body.paid_at) : new Date(),
      })
      .where(eq(orders.id, externalId));

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
  if (!callbackToken) return true;
  const token = process.env.XENDIT_WEBHOOK_TOKEN;
  if (!token) return true;
  return callbackToken === token;
}
