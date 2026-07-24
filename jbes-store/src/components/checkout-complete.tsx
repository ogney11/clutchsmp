"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2, RotateCw, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatCurrencyAmount, normalizeStoreCurrency, type StoreCurrency } from "@/lib/currency";

type CheckoutStatus = {
  orderId: string;
  productName: string;
  minecraftUsername: string;
  amountTotal: number;
  currency: StoreCurrency;
  paymentStatus: "pending" | "paid" | "cancelled";
  deliveryStatus: "pending" | "delivered" | "failed";
  deliveryAttempts: number;
  lastDeliveryError: string | null;
  stripePaymentStatus: string;
  error?: string;
};

export function CheckoutComplete({ sessionId }: { sessionId?: string }) {
  const [status, setStatus] = useState<CheckoutStatus | null>(null);
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [error, setError] = useState(sessionId ? "" : "Missing Stripe Checkout Session ID.");

  useEffect(() => {
    if (!sessionId) return;

    let active = true;
    const checkoutSessionId = sessionId;

    async function loadStatus() {
      setLoading(true);

      try {
        const response = await fetch(`/api/checkout/stripe/status?session_id=${encodeURIComponent(checkoutSessionId)}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as CheckoutStatus | { error?: string };

        if (!response.ok || !isCheckoutStatus(payload)) {
          throw new Error(payload.error || "Unable to verify payment.");
        }

        if (active) {
          setStatus(payload);
          setError("");
        }
      } catch (statusError) {
        if (active) {
          setError(statusError instanceof Error ? statusError.message : "Unable to verify payment.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStatus();

    return () => {
      active = false;
    };
  }, [sessionId]);

  const display = useMemo(() => {
    if (loading) {
      return {
        icon: Loader2,
        title: "Verifying payment",
        text: "Stripe is confirming the checkout session and preparing automatic delivery.",
        tone: "text-cyan-100",
        spinning: true,
      };
    }

    if (error) {
      return {
        icon: AlertTriangle,
        title: "Payment needs review",
        text: error,
        tone: "text-amber-100",
        spinning: false,
      };
    }

    if (status?.deliveryStatus === "delivered") {
      return {
        icon: CheckCircle2,
        title: "Payment complete",
        text: `${status.productName} was delivered to ${status.minecraftUsername}.`,
        tone: "text-emerald-100",
        spinning: false,
      };
    }

    if (status?.deliveryStatus === "failed") {
      return {
        icon: RotateCw,
        title: "Payment complete",
        text: "Automatic delivery failed, but the order is paid and can be retried from the admin dashboard.",
        tone: "text-amber-100",
        spinning: false,
      };
    }

    return {
      icon: Loader2,
      title: "Payment complete",
      text: "Your order is paid and delivery is queued.",
      tone: "text-cyan-100",
      spinning: true,
    };
  }, [error, loading, status]);

  const Icon = display.icon;

  return (
    <section className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-4xl place-items-center px-4 py-28 sm:px-6 lg:px-8">
      <div className="glass-panel w-full p-6 text-center sm:p-10">
        <div className={`mx-auto grid size-16 place-items-center rounded-3xl border border-white/10 bg-white/10 ${display.tone}`}>
          <Icon className={`size-9 ${display.spinning ? "animate-spin" : ""}`} />
        </div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-cyan-200">checkout status</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">{display.title}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">{display.text}</p>

        {status && (
          <div className="mt-8 grid gap-3 rounded-3xl border border-white/10 bg-black/25 p-4 text-left sm:grid-cols-2">
            <StatusLine label="Package" value={status.productName} />
            <StatusLine label="Player" value={status.minecraftUsername} />
            <StatusLine
              label="Amount"
              value={formatCurrencyAmount(Number(status.amountTotal), normalizeStoreCurrency(status.currency))}
            />
            <StatusLine label="Payment" value={status.paymentStatus} />
            <StatusLine label="Delivery" value={status.deliveryStatus} />
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/store" className="rounded-full bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-cyan-100">
            <ShoppingBag className="mr-2 inline size-4" />
            Store
          </Link>
          <Link href="/support" className="rounded-full border border-cyan-300/35 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/20">
            Support
          </Link>
        </div>
      </div>
    </section>
  );
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-1 font-black text-white">{value}</div>
    </div>
  );
}

function isCheckoutStatus(value: CheckoutStatus | { error?: string }): value is CheckoutStatus {
  return (
    "orderId" in value &&
    "productName" in value &&
    "minecraftUsername" in value &&
    "amountTotal" in value &&
    "currency" in value &&
    "paymentStatus" in value &&
    "deliveryStatus" in value
  );
}
