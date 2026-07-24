"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ChevronDown, CreditCard, Loader2, Search, SlidersHorizontal, Smartphone, Star, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  currencyOptions,
  defaultStoreCurrency,
  formatStorePrice,
  normalizeStoreCurrency,
  type StoreCurrency,
} from "@/lib/currency";
import {
  categoryMeta,
  products,
  rankPackages,
  type Product,
  type ProductCategory,
  type RankPackage,
} from "@/lib/store-data";

const categories: Array<ProductCategory | "all"> = ["all", "ranks", "coins", "crates", "items"];
const sortModes = ["Featured", "Price: low", "Price: high"] as const;
const currencyStorageKey = "clutchsmp-store-currency";

export function Storefront({ initialCategory = "all" }: { initialCategory?: ProductCategory | "all" }) {
  const [category, setCategory] = useState<ProductCategory | "all">(initialCategory);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<(typeof sortModes)[number]>("Featured");
  const [selectedProduct, setSelectedProduct] = useState<CheckoutProduct | null>(null);
  const [currency, setCurrency] = usePersistedCurrency();

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = products.filter((product) => {
      if (product.category === "ranks") return false;
      const matchesCategory = category === "all" || product.category === category;
      const matchesQuery =
        !normalized ||
        product.name.toLowerCase().includes(normalized) ||
        product.description.toLowerCase().includes(normalized) ||
        product.perks.some((perk) => perk.toLowerCase().includes(normalized));
      return matchesCategory && matchesQuery;
    });

    if (sort === "Price: low") return [...result].sort((a, b) => a.price - b.price);
    if (sort === "Price: high") return [...result].sort((a, b) => b.price - a.price);
    return result;
  }, [category, query, sort]);

  const filteredRanks = useMemo(() => {
    if (category !== "all" && category !== "ranks") return [];
    const normalized = query.trim().toLowerCase();
    const result = rankPackages.filter((rank) => {
      return (
        !normalized ||
        rank.name.toLowerCase().includes(normalized) ||
        rank.description.toLowerCase().includes(normalized) ||
        rank.perks.some((perk) => perk.toLowerCase().includes(normalized))
      );
    });

    if (sort === "Price: low") return [...result].sort((a, b) => a.monthlyPrice - b.monthlyPrice);
    if (sort === "Price: high") return [...result].sort((a, b) => b.permanentPrice - a.permanentPrice);
    return result;
  }, [category, query, sort]);

  const resultCount = filteredProducts.length + filteredRanks.length;

  return (
    <section className="mx-auto max-w-7xl px-3 pb-20 pt-24 sm:px-6 sm:pb-24 sm:pt-28 lg:px-8">
      <motion.div
        className="grid gap-6 lg:grid-cols-[1fr_380px]"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="glass-panel relative overflow-hidden p-5 sm:p-8">
          <div className="absolute right-8 top-6 hidden rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-cyan-100 md:block">
            live catalog
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.34em] text-cyan-200">
            ClutchSMP marketplace
          </p>
          <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Launcher-grade store for ranks, coins, keys, and clutch survival items.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
            Browse polished premium packages with instant delivery, clean category filtering, and
            upgrade paths designed for a modern SMP economy.
          </p>
        </div>
        <div className="glass-panel p-4 sm:p-5">
          <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.22em] text-slate-300">
            <SlidersHorizontal className="size-4 text-cyan-200" />
            store control deck
          </div>
          <div className="mt-5 grid gap-3">
            {categories.map((item) => {
              const active = category === item;
              const label = item === "all" ? "All Products" : categoryMeta[item].label;
              return (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${
                    active
                      ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-50 shadow-[0_0_28px_rgba(34,211,238,0.16)]"
                      : "border-white/10 bg-white/[0.035] text-slate-300 hover:border-violet-300/40 hover:bg-white/[0.07]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
            <CurrencySelect currency={currency} onChange={setCurrency} />
          </div>
        </div>
      </motion.div>

      <div className="z-30 mt-6 grid gap-3 rounded-3xl border border-white/10 bg-black/55 p-3 backdrop-blur-2xl md:sticky md:top-20 md:mt-8 md:grid-cols-[1fr_auto_auto] md:gap-4">
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
          <Search className="size-5 text-cyan-200" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search ranks, coins, keys, totems, shulkers, perks..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {sortModes.map((mode) => (
            <button
              key={mode}
              onClick={() => setSort(mode)}
              className={`min-w-max rounded-2xl px-4 py-3 text-sm font-bold transition ${
                sort === mode ? "bg-white text-black" : "bg-white/10 text-slate-300 hover:bg-white/15"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <CurrencySelect currency={currency} onChange={setCurrency} compact />
      </div>

      {filteredRanks.length > 0 && (
        <RankPurchaseGrid
          packages={filteredRanks}
          className="mt-8"
          currency={currency}
          onPurchase={setSelectedProduct}
        />
      )}

      <motion.div layout className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            index={index}
            currency={currency}
            onPurchase={setSelectedProduct}
          />
        ))}
      </motion.div>

      {resultCount === 0 && (
        <div className="glass-panel mt-8 p-10 text-center text-slate-300">
          No packages matched that search. Try a broader term like rank, key, coins, totem, or shulker.
        </div>
      )}

      <CheckoutDialog
        product={selectedProduct}
        currency={currency}
        onCurrencyChange={setCurrency}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  );
}

type CheckoutProduct = {
  id: string;
  name: string;
  priceUsd: number;
};

type CheckoutPaymentMethod = "card" | "blik";

function usePersistedCurrency() {
  const [currency, setCurrencyState] = useState<StoreCurrency>(defaultStoreCurrency);

  useEffect(() => {
    setCurrencyState(normalizeStoreCurrency(window.localStorage.getItem(currencyStorageKey)));
  }, []);

  function setCurrency(nextCurrency: StoreCurrency) {
    setCurrencyState(nextCurrency);
    window.localStorage.setItem(currencyStorageKey, nextCurrency);
  }

  return [currency, setCurrency] as const;
}

function CurrencySelect({
  currency,
  onChange,
  compact = false,
}: {
  currency: StoreCurrency;
  onChange: (currency: StoreCurrency) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeOption = currencyOptions.find((option) => option.code === currency) ?? currencyOptions[0];

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${compact ? "min-w-[170px]" : "w-full"}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="group flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-left transition hover:border-cyan-300/35 hover:bg-white/[0.075]"
      >
        <span className="min-w-0">
          <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
            Currency
          </span>
          <span className="mt-1 flex items-center gap-2">
            <span className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 font-mono text-xs font-black text-cyan-100">
              {activeOption.code}
            </span>
            {!compact && (
              <span className="truncate text-sm font-bold text-slate-200">{activeOption.label}</span>
            )}
          </span>
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-slate-400 transition group-hover:text-cyan-100 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Currency"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-full min-w-[230px] overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#070a14]/95 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
        >
          {currencyOptions.map((option) => {
            const selected = option.code === currency;
            return (
              <button
                key={option.code}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition ${
                  selected
                    ? "bg-cyan-300/15 text-cyan-50"
                    : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={`grid size-10 place-items-center rounded-xl border font-mono text-xs font-black ${
                      selected
                        ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100"
                        : "border-white/10 bg-white/[0.04] text-slate-300"
                    }`}
                  >
                    {option.code}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black">{option.label}</span>
                    <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                      Checkout currency
                    </span>
                  </span>
                </span>
                <Check className={`size-4 shrink-0 ${selected ? "opacity-100" : "opacity-0"}`} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ProductCard({
  product,
  index,
  currency,
  onPurchase,
}: {
  product: Product;
  index: number;
  currency: StoreCurrency;
  onPurchase?: (product: CheckoutProduct) => void;
}) {
  const Icon = product.icon;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: Math.min(index * 0.035, 0.25) }}
      whileHover={{ y: -8, scale: 1.015 }}
      className="group glow-card relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-xl sm:p-5"
    >
      <div className={`relative grid aspect-[16/10] place-items-center overflow-hidden rounded-2xl bg-gradient-to-br ${product.accent}`}>
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_32%),radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.34),transparent_24%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-black/30" />
        <motion.div
          className="relative grid size-28 place-items-center rounded-[2rem] border border-white/35 bg-black/25 shadow-[0_0_40px_rgba(255,255,255,0.28)] backdrop-blur"
          animate={{ y: [0, -8, 0], rotate: [0, 2, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: index * 0.17 }}
        >
          <Icon className="size-14 text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.7)]" />
        </motion.div>
        {product.badge && (
          <div className="absolute left-4 top-4 rounded-full border border-white/30 bg-black/35 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white backdrop-blur">
            {product.badge}
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h3 className="text-2xl font-black tracking-tight text-white">{product.name}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{product.description}</p>
        </div>
        <div className="text-left sm:text-right">
          {product.oldPrice && (
            <div className="text-xs font-semibold text-slate-500 line-through">
              {formatStorePrice(product.oldPrice, currency)}
            </div>
          )}
          <div className="text-2xl font-black text-cyan-100">{formatStorePrice(product.price, currency)}</div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
        {product.perks.map((perk) => (
          <div key={perk} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-semibold text-slate-300">
            <Star className="mr-1 inline size-3 text-cyan-200" />
            {perk}
          </div>
        ))}
      </div>

      <button
        onClick={() => onPurchase?.({ id: product.id, name: product.name, priceUsd: product.price })}
        className="mt-5 w-full rounded-2xl border border-cyan-200/40 bg-cyan-200 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition hover:scale-[1.02] hover:bg-white hover:shadow-[0_0_34px_rgba(34,211,238,0.35)]"
      >
        Purchase
      </button>
    </motion.article>
  );
}

export function RankPurchaseGrid({
  packages,
  className = "",
  currency,
  onPurchase,
}: {
  packages: RankPackage[];
  className?: string;
  currency: StoreCurrency;
  onPurchase?: (product: CheckoutProduct) => void;
}) {
  return (
    <motion.div layout className={`grid gap-6 ${className}`}>
      {packages.map((rank, index) => (
        <RankPurchaseCard key={rank.id} rank={rank} index={index} currency={currency} onPurchase={onPurchase} />
      ))}
    </motion.div>
  );
}

function RankPurchaseCard({
  rank,
  index,
  currency,
  onPurchase,
}: {
  rank: RankPackage;
  index: number;
  currency: StoreCurrency;
  onPurchase?: (product: CheckoutProduct) => void;
}) {
  const Icon = rank.icon;
  const options = [
    {
      id: `rank-${rank.id}-permanent`,
      eyebrow: "Permanent rank",
      title: `${rank.name} Permanent`,
      description: `You receive the ${rank.name} rank forever.`,
      priceUsd: rank.permanentPrice,
      badge: "Best long-term value",
    },
    {
      id: `rank-${rank.id}-monthly`,
      eyebrow: "Temporary rank",
      title: `${rank.name} for 30 Days`,
      description: `You receive the ${rank.name} rank for 30 days.`,
      priceUsd: rank.monthlyPrice,
      badge: "Flexible option",
    },
  ];

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: Math.min(index * 0.05, 0.28) }}
      className="glow-card relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-xl sm:rounded-[2rem] sm:p-6"
    >
      <div className={`absolute -right-16 -top-24 size-72 rounded-full bg-gradient-to-br ${rank.accent} opacity-25 blur-3xl`} />
      <div className="relative grid gap-5 lg:grid-cols-[240px_1fr] lg:gap-6">
        <div className={`relative grid min-h-44 place-items-center overflow-hidden rounded-3xl bg-gradient-to-br ${rank.accent} p-5 text-center sm:min-h-56 sm:p-6`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_24%),linear-gradient(180deg,transparent,rgba(0,0,0,0.42))]" />
          <motion.div
            className="relative"
            animate={{ y: [0, -8, 0], scale: [1, 1.03, 1] }}
            transition={{ duration: 4.5, repeat: Infinity, delay: index * 0.12 }}
          >
            <Icon className="mx-auto mb-3 size-12 text-white drop-shadow-[0_0_22px_rgba(255,255,255,0.8)] sm:mb-4 sm:size-14" />
            <div className="text-base font-black uppercase tracking-[0.24em] text-white/80 sm:text-xl sm:tracking-[0.3em]">Rank</div>
            <div className="mt-1 break-words text-3xl font-black uppercase tracking-tight text-white drop-shadow-[0_0_22px_rgba(255,255,255,0.7)] sm:text-4xl">
              {rank.name}
            </div>
          </motion.div>
        </div>

        <div>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200 sm:tracking-[0.3em]">choose your access</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-4xl">{rank.title}</h2>
              <p className="mt-3 max-w-2xl leading-7 text-slate-300">{rank.description}</p>
            </div>
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-bold text-cyan-100">
              Choose an option below
            </div>
          </div>

          <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <span className="font-black text-white">{rank.name} Permanent</span> for{" "}
              <span className="font-black text-cyan-100">{formatStorePrice(rank.permanentPrice, currency)}</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <span className="font-black text-white">{rank.name} for 30 Days</span> for{" "}
              <span className="font-black text-cyan-100">{formatStorePrice(rank.monthlyPrice, currency)}</span>
            </div>
          </div>

          <div className="mt-5 grid gap-2 min-[420px]:grid-cols-2 lg:grid-cols-4">
            {rank.perks.map((perk) => (
              <div key={perk} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-300">
                <Star className="mr-1 inline size-3 text-cyan-200" />
                {perk}
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {options.map((option) => (
              <div key={option.id} className="rounded-3xl border border-white/10 bg-black/28 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-200">{option.eyebrow}</p>
                    <h3 className="mt-1 text-xl font-black text-white sm:text-2xl">{option.title}</h3>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-cyan-100">
                    {option.badge}
                  </div>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  <span className="font-bold text-slate-200">Description:</span> {option.description}
                </p>
                <button
                  onClick={() => onPurchase?.({ id: option.id, name: option.title, priceUsd: option.priceUsd })}
                  className="mt-4 min-h-11 w-full rounded-xl border border-cyan-200/40 bg-cyan-200 px-3 py-3 text-xs font-black uppercase tracking-[0.14em] text-black transition hover:scale-[1.02] hover:bg-white hover:shadow-[0_0_30px_rgba(34,211,238,0.28)]"
                >
                  Purchase {formatStorePrice(option.priceUsd, currency)}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function CategoryLanding({ category }: { category: ProductCategory }) {
  const meta = categoryMeta[category];
  const Icon = meta.icon;
  const categoryProducts = products.filter((product) => product.category === category);
  const isRanks = category === "ranks";
  const [selectedProduct, setSelectedProduct] = useState<CheckoutProduct | null>(null);
  const [currency, setCurrency] = usePersistedCurrency();

  return (
    <section className="mx-auto max-w-7xl px-3 pb-20 pt-24 sm:px-6 sm:pb-24 sm:pt-28 lg:px-8">
      <motion.div
        className="glass-panel relative overflow-hidden p-5 sm:p-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={`absolute -right-16 -top-20 size-72 rounded-full bg-gradient-to-br ${isRanks ? rankPackages[0].accent : categoryProducts[0].accent} opacity-30 blur-3xl`} />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_260px] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.34em] text-cyan-200">{meta.eyebrow}</p>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">{meta.title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{meta.description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/store" className="rounded-full bg-white px-5 py-3 text-sm font-black text-black transition hover:scale-105">
                Browse full store
              </Link>
              <Link href="#packages" className="rounded-full border border-cyan-300/35 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/20">
                View packages
              </Link>
              <div className="min-w-[170px]">
                <CurrencySelect currency={currency} onChange={setCurrency} compact />
              </div>
            </div>
          </div>
          <motion.div
            className="mx-auto grid size-56 place-items-center rounded-[2.25rem] border border-cyan-300/35 bg-cyan-300/10 shadow-[0_0_55px_rgba(34,211,238,0.22)]"
            animate={{ y: [0, -12, 0], rotate: [0, 4, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            <Icon className="size-24 text-cyan-100" />
          </motion.div>
        </div>
      </motion.div>

      {isRanks ? (
        <div id="packages">
          <RankPurchaseGrid
            packages={rankPackages}
            className="mt-10"
            currency={currency}
            onPurchase={setSelectedProduct}
          />
        </div>
      ) : (
        <div id="packages" className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {categoryProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              currency={currency}
              onPurchase={setSelectedProduct}
            />
          ))}
        </div>
      )}

      <CheckoutDialog
        product={selectedProduct}
        currency={currency}
        onCurrencyChange={setCurrency}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  );
}

function CheckoutDialog({
  product,
  currency,
  onCurrencyChange,
  onClose,
}: {
  product: CheckoutProduct | null;
  currency: StoreCurrency;
  onCurrencyChange: (currency: StoreCurrency) => void;
  onClose: () => void;
}) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<CheckoutPaymentMethod | null>(null);

  if (!product) return null;

  async function startCheckout(paymentMethod: CheckoutPaymentMethod) {
    setError("");
    setLoading(paymentMethod);

    try {
      const response = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product?.id,
          username,
          paymentMethod,
          currency,
        }),
      });
      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Checkout could not be started.");
      }

      window.location.href = payload.url;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout could not be started.");
      setLoading(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-3 py-8 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-lg rounded-3xl border border-white/12 bg-[#070a14] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.65)] sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">Secure checkout</p>
            <h2 className="mt-2 text-2xl font-black text-white">{product.name}</h2>
            <p className="mt-1 text-sm font-bold text-cyan-100">
              {formatStorePrice(product.priceUsd, currency)} {currency}
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
            aria-label="Close checkout"
          >
            <X className="size-5" />
          </button>
        </div>

        <label className="mt-6 block">
          <span className="text-sm font-bold text-slate-200">Minecraft username</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Exact Java username"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
          />
        </label>

        <div className="mt-4">
          <CurrencySelect currency={currency} onChange={onCurrencyChange} />
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-500/10 p-3 text-sm font-semibold text-rose-100">
            {error}
          </div>
        )}

        <button
          onClick={() => startCheckout("card")}
          disabled={Boolean(loading)}
          className="mt-5 min-h-12 w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-70"
        >
          {loading === "card" ? <Loader2 className="mr-2 inline size-4 animate-spin" /> : <CreditCard className="mr-2 inline size-4" />}
          Card / Apple Pay / Google Pay {formatStorePrice(product.priceUsd, currency)}
        </button>
        {currency === "PLN" && (
          <button
            onClick={() => startCheckout("blik")}
            disabled={Boolean(loading)}
            className="mt-3 min-h-12 w-full rounded-2xl border border-fuchsia-300/40 bg-fuchsia-300/12 px-4 py-3 text-sm font-black text-fuchsia-100 transition hover:border-fuchsia-200/70 hover:bg-fuchsia-300/20 disabled:cursor-wait disabled:opacity-70"
          >
            {loading === "blik" ? <Loader2 className="mr-2 inline size-4 animate-spin" /> : <Smartphone className="mr-2 inline size-4" />}
            BLIK {formatStorePrice(product.priceUsd, currency)}
          </button>
        )}
        <p className="mt-3 text-center text-xs font-semibold leading-5 text-slate-400">
          {currency === "PLN"
            ? "BLIK appears for PLN checkout. Apple Pay and Google Pay appear when supported by the buyer's device."
            : "Apple Pay and Google Pay appear automatically in Stripe Checkout when supported by the buyer's device."}
        </p>
      </motion.div>
    </div>
  );
}
