import Stripe from "stripe";
import { NextResponse } from "next/server";
import {
  convertUsdToCurrency,
  getStripeUnitAmountFromUsd,
  normalizeStoreCurrency,
  type StoreCurrency,
} from "@/lib/currency";
import { getPaymentProduct } from "@/lib/payment-products";
import { createPendingOrder, updateOrderExternalIds } from "@/lib/server/db";
import { getBaseUrl, getRequiredEnv, getServerErrorMessage } from "@/lib/server/env";
import { isValidMinecraftUsername } from "@/lib/server/delivery";

export const runtime = "nodejs";

type CheckoutPaymentMethod = "card" | "blik";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      productId?: string;
      username?: string;
      currency?: StoreCurrency;
      paymentMethod?: CheckoutPaymentMethod;
    };
    const product = body.productId ? getPaymentProduct(body.productId) : null;
    const username = body.username?.trim();
    const currency = normalizeStoreCurrency(body.currency);
    const paymentMethod = normalizeCheckoutPaymentMethod(body.paymentMethod);
    const amountTotal = convertUsdToCurrency(product?.priceUsd ?? 0, currency);

    if (!product || !product.command) {
      return NextResponse.json({ error: "Unknown product." }, { status: 400 });
    }

    if (!username || !isValidMinecraftUsername(username)) {
      return NextResponse.json({ error: "Enter a valid Minecraft username." }, { status: 400 });
    }

    if (paymentMethod === "blik" && currency !== "PLN") {
      return NextResponse.json({ error: "BLIK checkout is available only for PLN." }, { status: 400 });
    }

    const order = await createPendingOrder({
      productId: product.id,
      productName: product.name,
      username,
      amountUsd: product.priceUsd,
      amountTotal,
      currency,
      provider: "stripe",
      method: paymentMethod,
      command: product.command,
    });

    const stripe = new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"));
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: paymentMethod === "blik" ? ["blik"] : ["card"],
      success_url: `${getBaseUrl()}/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getBaseUrl()}/checkout/cancelled`,
      client_reference_id: order.id,
      metadata: {
        orderId: order.id,
        productId: product.id,
        minecraftUsername: username,
        paymentMethod,
        currency,
        amountUsd: product.priceUsd.toFixed(2),
        amountTotal: amountTotal.toFixed(2),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: getStripeUnitAmountFromUsd(product.priceUsd, currency),
            product_data: {
              name: product.name,
              description: `ClutchSMP delivery for ${username}`,
            },
          },
        },
      ],
    };

    if (paymentMethod === "card") {
      sessionParams.wallet_options = {
        link: {
          display: "never",
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    await updateOrderExternalIds(order.id, { externalCheckoutId: session.id });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json({ error: getStripeCheckoutErrorMessage(error) }, { status: 500 });
  }
}

function getStripeCheckoutErrorMessage(error: unknown) {
  return getServerErrorMessage(error);
}

function normalizeCheckoutPaymentMethod(value: unknown): CheckoutPaymentMethod {
  return value === "blik" ? "blik" : "card";
}
