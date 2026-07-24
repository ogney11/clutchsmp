import type { Metadata } from "next";
import { Clock, CreditCard, Headphones, Mail, MessageCircle, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with ClutchSMP purchases, delivery, ranks, payment issues, and account questions.",
};

const channels = [
  { title: "Discord ticket", text: "Best for delivery checks, username fixes, and live store questions.", icon: MessageCircle, value: "discord.gg/clutchsmp" },
  { title: "Billing support", text: "Payment receipts, duplicate charges, or checkout problems.", icon: CreditCard, value: "billing@clutchsmp.net" },
  { title: "Account help", text: "Rank sync, name changes, or package transfer requests.", icon: Headphones, value: "support@clutchsmp.net" },
];

const steps = [
  "Include your exact Minecraft username.",
  "Attach your order ID or payment receipt when available.",
  "Stay online on ClutchSMP if you are waiting for automatic delivery.",
  "Never share passwords, full payment card details, or private login codes.",
];

export default function SupportPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="glass-panel p-8 sm:p-10">
        <p className="text-sm font-black uppercase tracking-[0.34em] text-cyan-200">player support</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
          Fast help for purchases, delivery, and account sync.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
          ClutchSMP support is built around clear context and quick routing. Choose the right channel below
          and our team can resolve most store issues in minutes.
        </p>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {channels.map((channel) => {
          const Icon = channel.icon;
          return (
            <article key={channel.title} className="glow-card rounded-3xl border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl transition hover:-translate-y-1">
              <Icon className="size-8 text-cyan-200" />
              <h2 className="mt-5 text-2xl font-black">{channel.title}</h2>
              <p className="mt-3 leading-7 text-slate-300">{channel.text}</p>
              <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 font-bold text-cyan-100">
                {channel.value}
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <div className="glass-panel p-6">
          <Clock className="size-8 text-cyan-200" />
          <h2 className="mt-5 text-3xl font-black">Before opening a ticket</h2>
          <div className="mt-5 grid gap-3">
            {steps.map((step) => (
              <div key={step} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-slate-300">
                {step}
              </div>
            ))}
          </div>
        </div>
        <div className="glass-panel p-6">
          <ShieldAlert className="size-8 text-violet-200" />
          <h2 className="mt-5 text-3xl font-black">Chargeback policy</h2>
          <p className="mt-4 leading-7 text-slate-300">
            Contact support first for mistaken purchases or delivery issues. Unauthorized chargebacks can
            temporarily restrict store access while the payment is reviewed.
          </p>
          <Mail className="mt-6 size-8 text-cyan-200" />
        </div>
      </div>
    </section>
  );
}
