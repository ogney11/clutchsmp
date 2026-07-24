import Stripe from "stripe";
import { NextResponse } from "next/server";
import { deliverOrder } from "@/lib/server/delivery";
import { markOrderPaid, updateOrderExternalIds } from "@/lib/server/db";
import { getRequiredEnv } from "@/lib/server/env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const stripe = new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"));
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, getRequiredEnv("STRIPE_WEBHOOK_SECRET"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Stripe signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId || session.client_reference_id;

    if (!orderId) {
      return NextResponse.json({ error: "Stripe session is missing order metadata." }, { status: 400 });
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true, payment: session.payment_status });
    }

    await updateOrderExternalIds(orderId, {
      externalPaymentId: getStripePaymentIntentId(session.payment_intent),
    });

    const order = await markOrderPaid(orderId);

    try {
      await deliverOrder(order);
    } catch {
      return NextResponse.json({ received: true, delivery: "failed" });
    }
  }

  return NextResponse.json({ received: true });
}

function getStripePaymentIntentId(paymentIntent: string | Stripe.PaymentIntent | null) {
  if (!paymentIntent) return undefined;
  return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
}
