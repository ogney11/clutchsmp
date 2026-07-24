"use client";

import { RefreshCw, Search, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { formatCurrencyAmount, normalizeStoreCurrency } from "@/lib/currency";
import type { OrderRow } from "@/lib/server/db";

export function AdminOrdersDashboard() {
  const [token, setToken] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);

  async function loadOrders() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as { orders?: OrderRow[]; error?: string };

      if (!response.ok || !payload.orders) {
        throw new Error(payload.error || "Unable to load orders.");
      }

      setOrders(payload.orders);
      setMessage(`Loaded ${payload.orders.length} orders.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }

  async function retryOrder(orderId: string) {
    setRetrying(orderId);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/retry`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Retry failed.");
      }

      setMessage("Delivery retry completed.");
      await loadOrders();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Retry failed.");
    } finally {
      setRetrying(null);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-3 pb-20 pt-24 sm:px-6 sm:pb-24 sm:pt-28 lg:px-8">
      <div className="glass-panel p-5 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.32em] text-cyan-200">ClutchSMP operations</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">Payment orders</h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-300">
              Review paid and pending orders, inspect RCON delivery state, and retry failed deliveries without exposing server secrets.
            </p>
          </div>
          <div className="grid gap-3 sm:min-w-[360px]">
            <label className="text-sm font-bold text-slate-200">
              Admin API token
              <input
                value={token}
                onChange={(event) => setToken(event.target.value)}
                type="password"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none focus:border-cyan-300/60"
              />
            </label>
            <button
              onClick={loadOrders}
              disabled={loading}
              className="rounded-2xl bg-cyan-200 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-black transition hover:bg-white disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? <RefreshCw className="mr-2 inline size-4 animate-spin" /> : <Search className="mr-2 inline size-4" />}
              Load orders
            </button>
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-sm font-semibold text-slate-200">
            {message}
          </div>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-black/45 backdrop-blur-xl">
        <div className="grid min-w-[1080px] grid-cols-[1.25fr_1fr_0.7fr_0.7fr_0.7fr_0.6fr_1fr] gap-3 border-b border-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
          <div>Order</div>
          <div>Player</div>
          <div>Amount</div>
          <div>Payment</div>
          <div>Delivery</div>
          <div>Attempts</div>
          <div>Action</div>
        </div>

        <div className="overflow-x-auto">
          {orders.map((order) => (
            <div
              key={order.id}
              className="grid min-w-[1080px] grid-cols-[1.25fr_1fr_0.7fr_0.7fr_0.7fr_0.6fr_1fr] gap-3 border-b border-white/10 px-4 py-4 text-sm text-slate-200 last:border-b-0"
            >
              <div>
                <div className="font-black text-white">{order.product_name}</div>
                <div className="mt-1 font-mono text-xs text-slate-500">{order.id}</div>
                {order.last_delivery_error && (
                  <div className="mt-2 text-xs text-rose-200">{order.last_delivery_error}</div>
                )}
              </div>
              <div>
                <div className="font-bold text-cyan-100">{order.minecraft_username}</div>
                <div className="mt-1 text-xs text-slate-500">{new Date(order.created_at).toLocaleString()}</div>
              </div>
              <div className="font-black text-white">{formatOrderAmount(order)}</div>
              <div>
                <StatusPill value={order.payment_status} />
                <div className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  {order.payment_method}
                </div>
              </div>
              <StatusPill value={order.delivery_status} />
              <div>{order.delivery_attempts}</div>
              <div>
                <button
                  onClick={() => retryOrder(order.id)}
                  disabled={order.payment_status !== "paid" || order.delivery_status === "delivered" || retrying === order.id}
                  className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {retrying === order.id ? <RefreshCw className="mr-1 inline size-3 animate-spin" /> : <ShieldCheck className="mr-1 inline size-3" />}
                  Retry delivery
                </button>
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="px-5 py-10 text-center text-slate-400">
              Enter the admin token and load orders.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StatusPill({ value }: { value: string }) {
  const tone =
    value === "paid" || value === "delivered"
      ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
      : value === "failed"
        ? "border-rose-300/30 bg-rose-300/10 text-rose-100"
        : "border-amber-300/30 bg-amber-300/10 text-amber-100";

  return (
    <div>
      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${tone}`}>
        {value}
      </span>
    </div>
  );
}

function formatOrderAmount(order: OrderRow) {
  const currency = normalizeStoreCurrency(order.currency);
  const amount = Number(order.amount_total ?? order.amount_usd);
  return formatCurrencyAmount(amount, currency);
}
