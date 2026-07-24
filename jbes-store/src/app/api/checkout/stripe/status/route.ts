import Stripe from "stripe";
import { NextResponse } from "next/server";
import { normalizeStoreCurrency } from "@/lib/currency";
import { deliverOrder } from "@/lib/server/delivery";
import { getOrder, markOrderPaid, updateOrderExternalIds } from "@/lib/server/db";
import { getRequiredEnv, getServerErrorMessage } from "@/lib/server/env";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const sessionId = new URL(request.url).searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing Stripe Checkout Session ID." }, { status: 400 });
    }

    const stripe = new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"));
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.orderId || session.client_reference_id;

    if (!orderId) {
      return NextResponse.json({ error: "Stripe session is missing order metadata." }, { status: 400 });
    }

    await updateOrderExternalIds(orderId, {
      externalCheckoutId: session.id,
      externalPaymentId: getStripePaymentIntentId(session.payment_intent),
    });

    let order = await getOrder(orderId);

    if (session.payment_status === "paid" && order.delivery_status !== "delivered") {
      order = await markOrderPaid(orderId);

      try {
        await deliverOrder(order);
      } catch {
        // The updated order below will include the failed delivery status and retry details.
      }

      order = await getOrder(orderId);
    }

    return NextResponse.json({
      orderId: order.id,
      productName: order.product_name,
      minecraftUsername: order.minecraft_username,
      amountTotal: Number(order.amount_total ?? order.amount_usd),
      currency: normalizeStoreCurrency(order.currency),
      paymentStatus: order.payment_status,
      deliveryStatus: order.delivery_status,
      deliveryAttempts: order.delivery_attempts,
      lastDeliveryError: order.last_delivery_error,
      stripePaymentStatus: session.payment_status,
    });
  } catch (error) {
    return NextResponse.json({ error: getServerErrorMessage(error) }, { status: 500 });
  }
}

function getStripePaymentIntentId(paymentIntent: string | Stripe.PaymentIntent | null) {
  if (!paymentIntent) return undefined;
  return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
}
