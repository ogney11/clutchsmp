"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Copy, Disc3, Loader2, MessageCircle, Play, Send, ShieldCheck, ShoppingBag, Star } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { copyToClipboard } from "@/lib/client/copy-to-clipboard";
import { deliverySteps, discordUrl, faqs, features, serverIp, stats, voteHighlights } from "@/lib/store-data";

const statusRefreshMs = 10 * 60 * 1000;

type ServerStatus = {
  statusAvailable: boolean;
  online: boolean;
  playersOnline: number;
  playersMax: number | null;
  checkedAt: string;
};

type PlayerReview = {
  id: string;
  minecraftUsername: string;
  rating: number;
  quote: string;
  createdAt: string;
};

type ReviewFormState = {
  minecraftUsername: string;
  rating: number;
  quote: string;
};

const emptyReviewForm: ReviewFormState = {
  minecraftUsername: "",
  rating: 5,
  quote: "",
};

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [playerReviews, setPlayerReviews] = useState<PlayerReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState<ReviewFormState>(emptyReviewForm);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const copyIp = async () => {
    const didCopy = await copyToClipboard(serverIp);
    if (!didCopy) return;

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  useEffect(() => {
    let active = true;

    const loadServerStatus = async () => {
      try {
        const response = await fetch("/api/server-status", { cache: "no-store" });
        const payload = (await response.json()) as ServerStatus;
        if (active) setServerStatus(payload);
      } catch {
        if (active) {
          setServerStatus({
            statusAvailable: false,
            online: false,
            playersOnline: 0,
            playersMax: null,
            checkedAt: new Date().toISOString(),
          });
        }
      } finally {
        if (active) setStatusLoading(false);
      }
    };

    loadServerStatus();
    const interval = window.setInterval(loadServerStatus, statusRefreshMs);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadReviews() {
      try {
        const response = await fetch("/api/reviews", { cache: "no-store" });
        const payload = (await response.json()) as { reviews?: PlayerReview[] };
        if (active) setPlayerReviews(payload.reviews ?? []);
      } catch {
        if (active) setPlayerReviews([]);
      } finally {
        if (active) setReviewsLoading(false);
      }
    }

    loadReviews();

    return () => {
      active = false;
    };
  }, []);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReviewMessage(null);
    setReviewSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm),
      });
      const payload = (await response.json()) as { review?: PlayerReview; error?: string };

      if (!response.ok || !payload.review) {
        throw new Error(payload.error || "Review could not be posted.");
      }

      setPlayerReviews((currentReviews) => [payload.review!, ...currentReviews].slice(0, 9));
      setReviewForm(emptyReviewForm);
      setReviewMessage({ type: "success", text: "Review posted. Thanks for helping other players." });
    } catch (error) {
      setReviewMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Review could not be posted.",
      });
    } finally {
      setReviewSubmitting(false);
    }
  }

  const playerCountText = useMemo(() => {
    if (statusLoading) return "Checking...";
    if (!serverStatus?.statusAvailable) return "Status unavailable";
    if (!serverStatus.online) return "Offline";

    const count = serverStatus.playersOnline.toLocaleString();
    const suffix = serverStatus.playersOnline === 1 ? "player" : "players";
    return `${count} ${suffix}`;
  }, [serverStatus, statusLoading]);

  const dynamicStats = useMemo(
    () =>
      stats.map((stat) =>
        stat.label === "Players online"
          ? {
              ...stat,
              value: playerCountText,
            }
          : stat,
      ),
    [playerCountText],
  );

  return (
    <>
      <section className="relative min-h-screen overflow-hidden pt-16 sm:pt-20">
        <Image
          src="/images/clutchsmp-cinematic-hub.png"
          alt="Cinematic futuristic Minecraft server hub with blue and purple neon portals"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(124,58,237,0.16),transparent_28%),linear-gradient(90deg,#02030a_0%,rgba(2,3,10,0.84)_32%,rgba(2,3,10,0.55)_62%,#02030a_100%),linear-gradient(180deg,rgba(2,3,10,0.1),#02030a_92%)]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-3 py-14 sm:min-h-[calc(100vh-5rem)] sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75 }}>
            <div className="inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100 backdrop-blur sm:px-4 sm:text-xs sm:tracking-[0.26em]">
              <Disc3 className="mr-2 size-4 animate-spin-slow" />
              season zero store online
            </div>
            <motion.h1
              className="mt-7 max-w-4xl text-5xl font-black leading-[0.92] tracking-tight sm:text-7xl lg:text-8xl"
              animate={{ textShadow: ["0 0 14px rgba(34,211,238,.3)", "0 0 34px rgba(168,85,247,.55)", "0 0 14px rgba(34,211,238,.3)"] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              ClutchSMP
              <span className="block bg-gradient-to-r from-cyan-200 via-white to-violet-200 bg-clip-text text-transparent">
                Store
              </span>
            </motion.h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
              A premium Minecraft marketplace for ranks, coins, crate keys, survival items, and vote
              rewards, built with the polish of a modern game launcher.
            </p>

            <div className="mt-8 grid gap-3 rounded-3xl border border-white/12 bg-black/45 p-3 backdrop-blur-2xl sm:max-w-2xl sm:grid-cols-[1fr_auto]">
              <button
                type="button"
                aria-label={`Copy server IP ${serverIp}`}
                onClick={copyIp}
                className="flex items-center justify-between rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-5 py-4 text-left transition hover:border-cyan-200/70 hover:bg-cyan-300/20"
              >
                <span>
                  <span className="block text-xs font-bold uppercase tracking-[0.28em] text-cyan-200">
                    server ip
                  </span>
                  <span className="mt-1 block break-all text-lg font-black sm:text-xl">{copied ? "Copied to clipboard" : serverIp}</span>
                </span>
                <Copy className="size-5 text-cyan-100" />
              </button>
              <div className="rounded-2xl border border-violet-300/25 bg-violet-300/10 px-5 py-4">
                <span className="block text-xs font-bold uppercase tracking-[0.28em] text-violet-200">
                  online now
                </span>
                <span className="mt-1 block text-xl font-black">{playerCountText}</span>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap sm:gap-4">
              <Link href="/store" className="rounded-full bg-white px-6 py-4 text-center text-sm font-black uppercase tracking-[0.18em] text-black transition hover:scale-105 hover:bg-cyan-100">
                <ShoppingBag className="mr-2 inline size-4" />
                Open Store
              </Link>
              <a href={discordUrl} className="rounded-full border border-violet-300/35 bg-violet-300/10 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.18em] text-violet-100 transition hover:scale-105 hover:bg-violet-300/20">
                <MessageCircle className="mr-2 inline size-4" />
                Discord
              </a>
            </div>
          </motion.div>

          <motion.div
            className="glass-panel relative hidden overflow-hidden p-5 lg:block"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, delay: 0.2 }}
          >
            <div className="rounded-3xl border border-white/10 bg-black/35 p-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-200">launcher panel</div>
                  <div className="mt-1 text-2xl font-black">ClutchSMP Command Deck</div>
                </div>
                <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-200">
                  LIVE
                </div>
              </div>
              <div className="grid gap-3 py-4">
                {["Survival Nexus", "Crystal PvP", "Lifesteal Arena", "Creative Labs"].map((mode, index) => (
                  <motion.div
                    key={mode}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.045] p-4"
                    animate={{ x: [0, index % 2 ? 5 : -5, 0] }}
                    transition={{ duration: 5 + index, repeat: Infinity }}
                  >
                    <div>
                      <div className="font-bold">{mode}</div>
                      <div className="text-xs text-slate-400">boosted queues and active events</div>
                    </div>
                    <Play className="size-5 text-cyan-200" />
                  </motion.div>
                ))}
              </div>
              <div className="rounded-2xl bg-gradient-to-r from-cyan-300/20 to-violet-400/20 p-4">
                <ShieldCheck className="mb-3 size-6 text-cyan-100" />
                <div className="font-black">Secure checkout, instant sync, premium delivery.</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-3 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {dynamicStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className="glass-panel p-5"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <Icon className="size-6 text-cyan-200" />
              <div className="mt-5 text-4xl font-black">{stat.value}</div>
              <div className="mt-1 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{stat.label}</div>
            </motion.div>
          );
        })}
      </section>

      <Section title="Premium Systems" eyebrow="why players stay">
        <div className="grid gap-5 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.title} className="glow-card rounded-3xl border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }}>
                <Icon className="size-9 text-cyan-200" />
                <h3 className="mt-6 text-2xl font-black">{feature.title}</h3>
                <p className="mt-3 leading-7 text-slate-300">{feature.text}</p>
              </motion.div>
            );
          })}
        </div>
      </Section>

      <Section title="How Delivery Works" eyebrow="after checkout">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {deliverySteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
              >
                <div className="flex items-center justify-between">
                  <Icon className="size-7 text-cyan-200" />
                  <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-black text-slate-300">
                    {index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-black text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{step.text}</p>
              </motion.div>
            );
          })}
        </div>
      </Section>

      <Section title="Vote Rewards" eyebrow="free rewards">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.65fr]">
          <div className="grid gap-4 sm:grid-cols-3">
            {voteHighlights.map((reward, index) => {
              const Icon = reward.icon;
              return (
                <motion.div
                  key={reward.title}
                  className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06 }}
                >
                  <Icon className="size-8 text-violet-200" />
                  <h3 className="mt-5 text-xl font-black text-white">{reward.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{reward.text}</p>
                </motion.div>
              );
            })}
          </div>
          <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6 backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-100">vote page</p>
            <h3 className="mt-4 text-3xl font-black tracking-tight text-white">Claim daily rewards without buying anything.</h3>
            <p className="mt-4 leading-7 text-slate-300">
              Voting helps more players find ClutchSMP and gives active players a simple way to earn rewards.
            </p>
            <Link
              href="/vote-rewards"
              className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:scale-105 hover:bg-cyan-100"
            >
              View Vote Rewards
            </Link>
          </div>
        </div>
      </Section>

      <Section title="Player Reviews" eyebrow="posted by players">
        <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
          <form
            onSubmit={submitReview}
            className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5 backdrop-blur-xl sm:p-6"
          >
            <p className="text-xs font-black uppercase tracking-[0.26em] text-cyan-100">leave a review</p>
            <h3 className="mt-3 text-2xl font-black text-white">Post as your Minecraft username.</h3>

            <label className="mt-5 block text-sm font-bold text-slate-200">
              Minecraft username
              <input
                value={reviewForm.minecraftUsername}
                onChange={(event) => setReviewForm((current) => ({ ...current, minecraftUsername: event.target.value }))}
                placeholder="Exact Java username"
                maxLength={16}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
              />
            </label>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-slate-200">Rating</span>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">
                  {reviewForm.rating}/5
                </span>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-2" role="radiogroup" aria-label="Review rating">
                {[1, 2, 3, 4, 5].map((rating) => {
                  const selected = reviewForm.rating >= rating;
                  return (
                    <button
                      key={rating}
                      type="button"
                      role="radio"
                      aria-checked={reviewForm.rating === rating}
                      aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
                      onClick={() => setReviewForm((current) => ({ ...current, rating }))}
                      className={`grid aspect-square min-h-12 place-items-center rounded-2xl border transition ${
                        selected
                          ? "border-cyan-200/60 bg-cyan-200/18 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.16)]"
                          : "border-white/10 bg-white/[0.04] text-slate-500 hover:border-cyan-300/30 hover:text-cyan-100"
                      }`}
                    >
                      <Star className={`size-5 ${selected ? "fill-cyan-200" : ""}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="mt-4 block text-sm font-bold text-slate-200">
              Review
              <textarea
                value={reviewForm.quote}
                onChange={(event) => setReviewForm((current) => ({ ...current, quote: event.target.value }))}
                placeholder="Tell players what your store/server experience was like."
                maxLength={280}
                rows={5}
                className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
              />
            </label>

            {reviewMessage && (
              <div
                className={`mt-4 rounded-2xl border p-3 text-sm font-semibold ${
                  reviewMessage.type === "success"
                    ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
                    : "border-rose-300/25 bg-rose-400/10 text-rose-100"
                }`}
              >
                {reviewMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={reviewSubmitting}
              className="mt-5 min-h-12 w-full rounded-2xl bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:scale-[1.02] hover:bg-cyan-100 disabled:cursor-wait disabled:opacity-70"
            >
              {reviewSubmitting ? <Loader2 className="mr-2 inline size-4 animate-spin" /> : <Send className="mr-2 inline size-4" />}
              Post Review
            </button>
          </form>

          <div className="grid gap-5 md:grid-cols-2">
            {reviewsLoading && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 text-slate-300 backdrop-blur-xl md:col-span-2">
                Loading player reviews...
              </div>
            )}

            {!reviewsLoading && playerReviews.length === 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 text-slate-300 backdrop-blur-xl md:col-span-2">
                No player reviews yet. Be the first to post one.
              </div>
            )}

            {!reviewsLoading &&
              playerReviews.map((review, index) => (
                <ReviewCard key={review.id} review={review} index={index} />
              ))}
          </div>
        </div>
      </Section>

      <Section title="FAQ" eyebrow="quick answers">
        <div className="grid gap-4 lg:grid-cols-2">
          {faqs.map((faq) => (
            <details key={faq.question} className="group rounded-3xl border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl">
              <summary className="cursor-pointer list-none text-xl font-black text-white">{faq.question}</summary>
              <p className="mt-4 leading-7 text-slate-300">{faq.answer}</p>
            </details>
          ))}
        </div>
      </Section>
    </>
  );
}

function ReviewCard({ review, index }: { review: PlayerReview; index: number }) {
  return (
    <motion.figure
      className="glass-panel p-6"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.06, 0.24) }}
    >
      <div className="flex gap-1 text-cyan-200">
        {Array.from({ length: 5 }).map((_, starIndex) => (
          <Star
            key={starIndex}
            className={`size-4 ${starIndex < review.rating ? "fill-cyan-200" : "opacity-30"}`}
          />
        ))}
      </div>
      <blockquote className="mt-4 text-lg leading-8 text-slate-200">&quot;{review.quote}&quot;</blockquote>
      <figcaption className="mt-6 border-t border-white/10 pt-4">
        <div className="font-black text-white">{review.minecraftUsername}</div>
        <div className="text-sm text-cyan-200">{new Date(review.createdAt).toLocaleDateString()}</div>
      </figcaption>
    </motion.figure>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-3 py-14 sm:px-6 sm:py-16 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-black uppercase tracking-[0.34em] text-cyan-200">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}
