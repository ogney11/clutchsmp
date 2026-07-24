"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { Copy, Menu, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { copyToClipboard } from "@/lib/client/copy-to-clipboard";
import { navItems, serverIp } from "@/lib/store-data";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const mouseX = useMotionValue(-400);
  const mouseY = useMotionValue(-400);
  const smoothX = useSpring(mouseX, { stiffness: 70, damping: 18 });
  const smoothY = useSpring(mouseY, { stiffness: 70, damping: 18 });

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      mouseX.set(event.clientX);
      mouseY.set(event.clientY);
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mouseX, mouseY]);

  useEffect(() => setMenuOpen(false), [pathname]);

  const copyIp = async () => {
    const didCopy = await copyToClipboard(serverIp);
    if (!didCopy) return;

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#02030a] text-white">
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-20 hidden size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/15 blur-3xl md:block"
        style={{ x: smoothX, y: smoothY }}
      />
      <div className="particles pointer-events-none fixed inset-0 z-0" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.2),transparent_24%),linear-gradient(180deg,rgba(2,3,10,0),#02030a_90%)]" />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/35 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:h-20 sm:px-6 lg:px-8">
          <Link href="/" className="group flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-cyan-300/40 bg-cyan-300/10 shadow-[0_0_28px_rgba(34,211,238,0.32)] sm:size-11">
              <span className="text-base font-black tracking-tighter sm:text-lg">CS</span>
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-black tracking-[0.08em] sm:text-xl sm:tracking-[0.18em]">
                ClutchSMP
              </div>
              <div className="hidden text-[10px] uppercase tracking-[0.32em] text-cyan-200/80 sm:block">
                network store
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 xl:flex">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-cyan-300/15 text-cyan-100 shadow-[inset_0_0_18px_rgba(34,211,238,0.16)]"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={`Copy server IP ${serverIp}`}
              onClick={copyIp}
              className="hidden rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/70 hover:bg-cyan-300/20 hover:shadow-[0_0_26px_rgba(34,211,238,0.25)] sm:inline-flex"
            >
              <Copy className="mr-2 size-4" />
              {copied ? "Copied" : serverIp}
            </button>
            <Link
              href="/store"
              className="hidden rounded-full bg-white px-4 py-2 text-sm font-black text-black transition hover:scale-105 hover:bg-cyan-100 md:inline-flex"
            >
              <ShoppingBag className="mr-2 size-4" />
              Store
            </Link>
            <button
              aria-label="Open menu"
              onClick={() => setMenuOpen((value) => !value)}
              className="grid size-11 place-items-center rounded-xl border border-white/15 bg-white/10 xl:hidden"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="border-t border-white/10 bg-black/80 px-4 py-4 backdrop-blur-2xl xl:hidden"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="mx-auto grid max-w-7xl gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={copyIp}
                  className="rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-left text-sm font-semibold text-cyan-100 sm:col-span-2"
                >
                  <Copy className="mr-2 inline size-4" />
                  {copied ? "Copied" : `Copy server IP: ${serverIp}`}
                </button>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-200"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="relative z-10">{children}</main>

      <footer className="relative z-10 border-t border-white/10 bg-black/50 px-4 py-10 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-black tracking-[0.2em] text-white">ClutchSMP</div>
            <p className="mt-2 max-w-xl">
              Premium Minecraft network store for ranks, coins, crate keys, items, and vote rewards.
              ClutchSMP is not affiliated with Mojang or Microsoft.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/support" className="hover:text-cyan-200">
              Support
            </Link>
            <Link href="/terms-of-service" className="hover:text-cyan-200">
              Terms
            </Link>
            <Link href="/store" className="hover:text-cyan-200">
              Store
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
