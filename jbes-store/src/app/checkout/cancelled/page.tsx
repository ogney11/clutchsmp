import Link from "next/link";
import type { Metadata } from "next";
import { ShoppingBag, XCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Payment Cancelled",
  description: "ClutchSMP checkout cancellation page.",
};

export default function CheckoutCancelledPage() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-4xl place-items-center px-4 py-28 sm:px-6 lg:px-8">
      <div className="glass-panel w-full p-6 text-center sm:p-10">
        <div className="mx-auto grid size-16 place-items-center rounded-3xl border border-rose-300/20 bg-rose-300/10 text-rose-100">
          <XCircle className="size-9" />
        </div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-cyan-200">checkout cancelled</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">Payment cancelled</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">
          No payment was taken and no package was delivered. You can return to the store whenever you are ready.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/store" className="rounded-full bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-cyan-100">
            <ShoppingBag className="mr-2 inline size-4" />
            Back to store
          </Link>
          <Link href="/support" className="rounded-full border border-cyan-300/35 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/20">
            Support
          </Link>
        </div>
      </div>
    </section>
  );
}
