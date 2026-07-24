import type { Metadata } from "next";
import { Gift, Rocket, Sparkles, Trophy, Vote } from "lucide-react";

export const metadata: Metadata = {
  title: "Vote Rewards",
  description: "Vote for ClutchSMP and earn keys, coins, cosmetics, boosters, and monthly leaderboard rewards.",
};

const rewards = [
  { title: "Daily vote crate", text: "Every valid vote grants a Vote Crate with coins, keys, boosters, and cosmetics.", icon: Gift },
  { title: "Vote streak boosts", text: "Keep a streak alive to unlock multiplier boosts and bonus crate rolls.", icon: Rocket },
  { title: "Monthly leaderboard", text: "Top voters receive exclusive titles, cosmetic capsules, and premium keys.", icon: Trophy },
  { title: "Weekend amplifiers", text: "Vote parties trigger network-wide drops and limited-time reward odds.", icon: Sparkles },
];

export default function VoteRewardsPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="glass-panel overflow-hidden p-8 sm:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.34em] text-cyan-200">free rewards</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
              Vote for ClutchSMP. Stack rewards. Climb the leaderboard.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Support the server on voting sites and earn meaningful in-game rewards without buying a package.
              The system is fast, transparent, and tuned for active players.
            </p>
          </div>
          <div className="grid size-48 place-items-center rounded-[2rem] border border-cyan-300/35 bg-cyan-300/10 shadow-[0_0_55px_rgba(34,211,238,0.22)]">
            <Vote className="size-24 text-cyan-100" />
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {rewards.map((reward) => {
          const Icon = reward.icon;
          return (
            <article key={reward.title} className="glow-card rounded-3xl border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl transition hover:-translate-y-1">
              <Icon className="size-8 text-cyan-200" />
              <h2 className="mt-5 text-2xl font-black">{reward.title}</h2>
              <p className="mt-3 leading-7 text-slate-300">{reward.text}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
