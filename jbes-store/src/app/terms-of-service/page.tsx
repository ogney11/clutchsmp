import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "ClutchSMP store terms for Minecraft purchases, delivery, refunds, ranks, crates, and account responsibility.",
};

const sections = [
  {
    title: "Purchases and delivery",
    text: "Store purchases are digital goods for the ClutchSMP Minecraft network. Most packages are delivered automatically after checkout, but delivery can be delayed by username errors, server maintenance, payment review, or connection issues.",
  },
  {
    title: "Refunds",
    text: "Because packages are digital and often consumed instantly, refunds are reviewed case by case. Contact support before opening a payment dispute so the team can verify delivery and resolve mistakes.",
  },
  {
    title: "Ranks and perks",
    text: "Rank perks may evolve as ClutchSMP updates game modes, balancing, or economy rules. Permanent ranks remain attached to the purchased Minecraft username unless support approves a transfer.",
  },
  {
    title: "Crates and chance rewards",
    text: "Crate keys provide randomized rewards. Drop pools and odds may change for seasonal balance, limited events, or economy health. Purchased keys are delivered as keys, not guaranteed specific rewards.",
  },
  {
    title: "Account responsibility",
    text: "Players are responsible for entering the correct Minecraft username and protecting their own account. ClutchSMP staff will never ask for passwords, full card numbers, or private authentication codes.",
  },
  {
    title: "Network rules",
    text: "Purchases do not exempt players from server rules. Cheating, harassment, exploit abuse, chargeback fraud, or marketplace abuse may result in account restrictions without compensation.",
  },
];

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="glass-panel p-8 sm:p-10">
        <p className="text-sm font-black uppercase tracking-[0.34em] text-cyan-200">legal deck</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Terms of Service</h1>
        <p className="mt-5 text-lg leading-8 text-slate-300">
          These terms describe how ClutchSMP store purchases, delivery, support, refunds, and account responsibility work.
          By purchasing from the ClutchSMP store, you agree to these conditions.
        </p>
      </div>

      <div className="mt-8 grid gap-4">
        {sections.map((section) => (
          <article key={section.title} className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl">
            <h2 className="text-2xl font-black">{section.title}</h2>
            <p className="mt-3 leading-7 text-slate-300">{section.text}</p>
          </article>
        ))}
      </div>

      <p className="mt-8 text-sm leading-7 text-slate-500">
        Last updated: June 9, 2026. ClutchSMP is an independent Minecraft server network and is not affiliated
        with Mojang Studios or Microsoft.
      </p>
    </section>
  );
}
