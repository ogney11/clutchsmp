"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { formatCurrencyAmount, normalizeStoreCurrency, type StoreCurrency } from "@/lib/currency";

type OrderRow = {
  id: string;
  product_id: string;
  product_name: string;
  minecraft_username: string;
  amount_usd: number;
  amount_total?: number | null;
  currency?: StoreCurrency | null;
  payment_provider: "stripe";
  payment_method: "card" | "blik";
  payment_status: "pending" | "paid" | "cancelled";
  delivery_status: "pending" | "delivered" | "failed";
  delivery_attempts: number;
  last_delivery_error: string | null;
  created_at: string;
  paid_at: string | null;
  delivered_at: string | null;
};

export function AdminDashboard() {
  const [token, setToken] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = window.sessionStorage.getItem("clutchsmp-admin-token");
    if (saved) setToken(saved);
  }, []);

  async function loadOrders(nextToken = token) {
    setError("");
    setLoading(true);
    try {
      window.sessionStorage.setItem("clutchsmp-admin-token", nextToken);
      const response = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${nextToken}` },
      });
      const payload = (await response.json()) as { orders?: OrderRow[]; error?: string };
      if (!response.ok || !payload.orders) throw new Error(payload.error || "Could not load orders.");
      setOrders(payload.orders);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load orders.");
    } finally {
      setLoading(false);
    }
  }

  async function retryOrder(orderId: string) {
    setError("");
    setRetrying(orderId);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/retry`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Retry failed.");
      await loadOrders();
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "Retry failed.");
    } finally {
      setRetrying(null);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-3 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-8">
      <div className="glass-panel p-5 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-200">admin dashboard</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
          ClutchSMP Orders
        </h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-300">
          View Stripe card and wallet orders, monitor Minecraft delivery status, and retry failed
          RCON deliveries without exposing server secrets to the browser.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Admin API token"
            type="password"
            className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/60"
          />
          <button
            onClick={() => loadOrders()}
            disabled={!token || loading}
            className="min-h-12 rounded-2xl bg-cyan-200 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="mr-2 inline size-4 animate-spin" /> : <ShieldCheck className="mr-2 inline size-4" />}
            Load orders
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-100">
            {error}
          </div>
        )}
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] backdrop-blur-xl">
        <div className="hidden grid-cols-[1.1fr_0.9fr_0.7fr_0.8fr_0.8fr_0.7fr] gap-4 border-b border-white/10 px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400 lg:grid">
          <span>Order</span>
          <span>Player</span>
          <span>Amount</span>
          <span>Payment</span>
          <span>Delivery</span>
          <span>Action</span>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No orders loaded yet.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {orders.map((order) => (
              <article
                key={order.id}
                className="grid gap-4 px-5 py-5 text-sm text-slate-300 lg:grid-cols-[1.1fr_0.9fr_0.7fr_0.8fr_0.8fr_0.7fr] lg:items-center"
              >
                <div>
                  <div className="font-black text-white">{order.product_name}</div>
                  <div className="mt-1 break-all font-mono text-xs text-slate-500">{order.id}</div>
                  <div className="mt-1 text-xs text-slate-500">{new Date(order.created_at).toLocaleString()}</div>
                </div>
                <div className="font-bold text-cyan-100">{order.minecraft_username}</div>
                <div className="font-black text-white">{formatOrderAmount(order)}</div>
                <StatusBadge
                  label={`${order.payment_method} / ${order.payment_status}`}
                  tone={order.payment_status === "paid" ? "good" : "warn"}
                />
                <div>
                  <StatusBadge
                    label={`${order.delivery_status} (${order.delivery_attempts})`}
                    tone={order.delivery_status === "delivered" ? "good" : order.delivery_status === "failed" ? "bad" : "warn"}
                  />
                  {order.last_delivery_error && (
                    <div className="mt-2 text-xs leading-5 text-rose-200">{order.last_delivery_error}</div>
                  )}
                </div>
                <button
                  onClick={() => retryOrder(order.id)}
                  disabled={retrying === order.id || order.payment_status !== "paid"}
                  className="min-h-11 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-cyan-100 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {retrying === order.id ? <Loader2 className="mr-2 inline size-4 animate-spin" /> : <RefreshCw className="mr-2 inline size-4" />}
                  Retry
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: "good" | "warn" | "bad" }) {
  const className =
    tone === "good"
      ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
      : tone === "bad"
        ? "border-rose-300/25 bg-rose-400/10 text-rose-100"
        : "border-amber-300/25 bg-amber-400/10 text-amber-100";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${className}`}>
      {label}
    </span>
  );
}

function formatOrderAmount(order: OrderRow) {
  const currency = normalizeStoreCurrency(order.currency);
  const amount = Number(order.amount_total ?? order.amount_usd);
  return formatCurrencyAmount(amount, currency);
}
