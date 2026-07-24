import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { StoreCurrency } from "@/lib/currency";
import { getRequiredEnv } from "@/lib/server/env";

export type OrderStatus = "pending" | "paid" | "cancelled";
export type DeliveryStatus = "pending" | "delivered" | "failed";
export type PaymentProvider = "stripe";
export type PaymentMethod = "card" | "blik";

export type OrderRow = {
  id: string;
  product_id: string;
  product_name: string;
  minecraft_username: string;
  amount_usd: number;
  amount_total?: number | null;
  currency?: StoreCurrency | null;
  payment_provider: PaymentProvider;
  payment_method: PaymentMethod;
  payment_status: OrderStatus;
  delivery_status: DeliveryStatus;
  delivery_attempts: number;
  delivery_command: string;
  external_checkout_id: string | null;
  external_payment_id: string | null;
  last_delivery_error: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  delivered_at: string | null;
};

export function getSupabaseAdmin() {
  return createClient(getRequiredEnv("SUPABASE_URL"), getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function createPendingOrder(input: {
  productId: string;
  productName: string;
  username: string;
  amountUsd: number;
  amountTotal: number;
  currency: StoreCurrency;
  provider: PaymentProvider;
  method: PaymentMethod;
  command: string;
}) {
  const supabase = getSupabaseAdmin();
  const fullPayload = {
    product_id: input.productId,
    product_name: input.productName,
    minecraft_username: input.username,
    amount_usd: input.amountUsd,
    amount_total: input.amountTotal,
    currency: input.currency,
    payment_provider: input.provider,
    payment_method: input.method,
    payment_status: "pending",
    delivery_status: "pending",
    delivery_attempts: 0,
    delivery_command: input.command,
  };

  const { data, error } = await supabase.from("orders").insert(fullPayload).select("*").single<OrderRow>();

  if (error && isMissingCurrencyColumnError(error.message)) {
    const legacyPayload = {
      product_id: input.productId,
      product_name: input.productName,
      minecraft_username: input.username,
      amount_usd: input.amountUsd,
      payment_provider: input.provider,
      payment_method: input.method,
      payment_status: "pending",
      delivery_status: "pending",
      delivery_attempts: 0,
      delivery_command: input.command,
    };
    const retry = await supabase.from("orders").insert(legacyPayload).select("*").single<OrderRow>();

    if (retry.error) throw new Error(retry.error.message);

    return {
      ...retry.data,
      amount_total: input.amountTotal,
      currency: input.currency,
    };
  }

  if (error) throw new Error(error.message);
  return data;
}

export async function updateOrderExternalIds(
  orderId: string,
  values: { externalCheckoutId?: string; externalPaymentId?: string },
) {
  const { error } = await getSupabaseAdmin()
    .from("orders")
    .update({
      external_checkout_id: values.externalCheckoutId,
      external_payment_id: values.externalPaymentId,
    })
    .eq("id", orderId);

  if (error) throw new Error(error.message);
}

export async function markOrderPaid(orderId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("orders")
    .update({ payment_status: "paid", paid_at: new Date().toISOString() })
    .eq("id", orderId)
    .select("*")
    .single<OrderRow>();

  if (error) throw new Error(error.message);
  return data;
}

export async function getOrder(orderId: string) {
  const { data, error } = await getSupabaseAdmin().from("orders").select("*").eq("id", orderId).single<OrderRow>();
  if (error) throw new Error(error.message);
  return data;
}

export async function listOrders() {
  const { data, error } = await getSupabaseAdmin()
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<OrderRow[]>();

  if (error) throw new Error(error.message);
  return data;
}

export async function markDeliveryDelivered(orderId: string) {
  const { error } = await getSupabaseAdmin()
    .from("orders")
    .update({
      delivery_status: "delivered",
      delivered_at: new Date().toISOString(),
      last_delivery_error: null,
    })
    .eq("id", orderId);

  if (error) throw new Error(error.message);
}

export async function markDeliveryFailed(orderId: string, errorMessage: string, attempts: number) {
  const { error } = await getSupabaseAdmin()
    .from("orders")
    .update({
      delivery_status: "failed",
      delivery_attempts: attempts,
      last_delivery_error: errorMessage,
    })
    .eq("id", orderId);

  if (error) throw new Error(error.message);
}

function isMissingCurrencyColumnError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("amount_total") || normalized.includes("currency");
}
