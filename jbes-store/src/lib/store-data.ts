import {
  BadgeCheck,
  Box,
  Coins,
  Crown,
  Gem,
  Headphones,
  KeyRound,
  PackageCheck,
  RefreshCw,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Vote,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ProductCategory = "ranks" | "coins" | "crates" | "items";

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  oldPrice?: number;
  badge?: string;
  accent: string;
  icon: LucideIcon;
  description: string;
  perks: string[];
};

export type RankPackage = {
  id: string;
  name: string;
  title: string;
  accent: string;
  icon: LucideIcon;
  description: string;
  monthlyPrice: number;
  permanentPrice: number;
  perks: string[];
};

export const serverName = "ClutchSMP";
export const serverIp = "mc.jbes.pl";
export const discordUrl = "https://discord.gg/clutchsmp";

export const navItems = [
  { label: "Home", href: "/" },
  { label: "Store", href: "/store" },
  { label: "Ranks", href: "/ranks" },
  { label: "Coins", href: "/coins" },
  { label: "Crates & Keys", href: "/crates-and-keys" },
  { label: "Items", href: "/items" },
  { label: "Vote Rewards", href: "/vote-rewards" },
  { label: "Support", href: "/support" },
  { label: "Terms", href: "/terms-of-service" },
];

export const categoryMeta: Record<
  ProductCategory,
  {
    label: string;
    href: string;
    eyebrow: string;
    title: string;
    description: string;
    icon: LucideIcon;
  }
> = {
  ranks: {
    label: "Ranks",
    href: "/ranks",
    eyebrow: "Monthly or permanent",
    title: "ClutchSMP rank ladder from VIP to Swagger",
    description:
      "Choose monthly flexibility or a permanent upgrade across VIP, SVIP, Sponsor, Elite, and Swagger, with rank-only kits and prestige perks.",
    icon: Crown,
  },
  coins: {
    label: "Coins",
    href: "/coins",
    eyebrow: "Instant wallet credit",
    title: "Top up your ClutchSMP coin balance",
    description:
      "Use coins for cosmetics, seasonal shop drops, crate keys, auction fees, and rotating marketplace offers.",
    icon: Coins,
  },
  crates: {
    label: "Crates & Keys",
    href: "/crates-and-keys",
    eyebrow: "Reward vault access",
    title: "Open futuristic ClutchSMP loot vaults",
    description:
      "Open Common, Epic, and Legendary keys for cinematic rewards, cosmetics, currency, boosters, and rare seasonal drops.",
    icon: KeyRound,
  },
  items: {
    label: "Items",
    href: "/items",
    eyebrow: "Essential survival items",
    title: "Quick utility items for clutch moments",
    description:
      "Grab simple survival essentials without separate kit bundles. Rank kits stay exclusive to rank perks.",
    icon: Swords,
  },
};

const rankAccents = {
  swagger: "from-cyan-200 via-fuchsia-400 to-purple-800",
  elite: "from-violet-300 via-blue-500 to-cyan-600",
  sponsor: "from-amber-300 via-orange-500 to-violet-700",
  svip: "from-sky-300 to-violet-500",
  vip: "from-cyan-400 to-blue-600",
};

export const rankPackages: RankPackage[] = [
  {
    id: "swagger",
    name: "Swagger",
    title: "Rank: Swagger",
    accent: rankAccents.swagger,
    icon: Crown,
    description: "The highest ClutchSMP role with the loudest cosmetics, top queue priority, and the Swagger kit.",
    monthlyPrice: 19.99,
    permanentPrice: 69.99,
    perks: ["Swagger tag", "14 homes", "Top priority", "Swagger kit"],
  },
  {
    id: "elite",
    name: "Elite",
    title: "Rank: Elite",
    accent: rankAccents.elite,
    icon: Gem,
    description: "One place below Swagger, Elite delivers premium vault access, a Legendary key, and the Elite kit.",
    monthlyPrice: 14.99,
    permanentPrice: 49.99,
    perks: ["Elite tag", "12 homes", "Elite vault", "Elite kit"],
  },
  {
    id: "sponsor",
    name: "Sponsor",
    title: "Rank: Sponsor",
    accent: rankAccents.sponsor,
    icon: Trophy,
    description: "A strong support rank below Elite with polished cosmetics, extra homes, and the Sponsor kit.",
    monthlyPrice: 9.99,
    permanentPrice: 34.99,
    perks: ["Sponsor tag", "8 homes", "Epic key", "Sponsor kit"],
  },
  {
    id: "svip",
    name: "SVIP",
    title: "Rank: SVIP",
    accent: rankAccents.svip,
    icon: Sparkles,
    description: "A boosted VIP tier below Sponsor with weekly rewards and the SVIP kit.",
    monthlyPrice: 5.99,
    permanentPrice: 19.99,
    perks: ["SVIP tag", "5 homes", "Weekly crate", "SVIP kit"],
  },
  {
    id: "vip",
    name: "VIP",
    title: "Rank: VIP",
    accent: rankAccents.vip,
    icon: BadgeCheck,
    description: "The entry rank on ClutchSMP with clean chat identity, basic perks, and the VIP kit.",
    monthlyPrice: 2.99,
    permanentPrice: 9.99,
    perks: ["VIP tag", "2 homes", "Daily crate", "VIP kit"],
  },
];

export const products: Product[] = [
  {
    id: "100-coins",
    name: "100 Coins",
    category: "coins",
    price: 1.99,
    accent: "from-cyan-400 to-blue-500",
    icon: Coins,
    description: "A quick top-up for cosmetics or small marketplace purchases.",
    perks: ["Instant delivery", "Wallet credit", "No expiry", "Cosmetic ready"],
  },
  {
    id: "500-coins",
    name: "500 Coins",
    category: "coins",
    price: 7.99,
    oldPrice: 9.95,
    badge: "Save 20%",
    accent: "from-blue-300 to-violet-500",
    icon: Coins,
    description: "Balanced coin value for regular store rotations.",
    perks: ["Instant delivery", "Bonus value", "Season shop", "Auction friendly"],
  },
  {
    id: "1000-coins",
    name: "1000 Coins",
    category: "coins",
    price: 13.99,
    oldPrice: 19.9,
    badge: "Save 30%",
    accent: "from-violet-300 to-purple-600",
    icon: Coins,
    description: "A favorite coin pack for cosmetics and key purchases.",
    perks: ["Instant delivery", "High value", "Key ready", "Profile upgrades"],
  },
  {
    id: "5000-coins",
    name: "5000 Coins",
    category: "coins",
    price: 49.99,
    oldPrice: 99.5,
    badge: "Save 50%",
    accent: "from-fuchsia-300 to-blue-700",
    icon: Coins,
    description: "A serious balance for collectors and squad leaders.",
    perks: ["Instant delivery", "Collector balance", "Vault access", "Market power"],
  },
  {
    id: "10000-coins",
    name: "10000 Coins",
    category: "coins",
    price: 84.99,
    oldPrice: 199,
    badge: "Mega deal",
    accent: "from-cyan-200 via-fuchsia-400 to-purple-700",
    icon: Coins,
    description: "The largest coin pack for long-term premium play.",
    perks: ["Instant delivery", "Maximum value", "Season ready", "Guild friendly"],
  },
  {
    id: "common-key",
    name: "Common Key",
    category: "crates",
    price: 1.49,
    accent: "from-slate-300 to-cyan-500",
    icon: KeyRound,
    description: "Entry vault rewards with cosmetics and utility drops.",
    perks: ["1 key", "Basic cosmetics", "Currency chance", "Booster chance"],
  },
  {
    id: "epic-key",
    name: "Epic Key",
    category: "crates",
    price: 5.99,
    oldPrice: 7.99,
    badge: "Hot",
    accent: "from-violet-300 to-indigo-700",
    icon: KeyRound,
    description: "High-energy crate access with valuable cosmetics and boosts.",
    perks: ["1 key", "Epic cosmetics", "Boosters", "Pet chance"],
  },
  {
    id: "legendary-key",
    name: "Legendary Key",
    category: "crates",
    price: 16.99,
    oldPrice: 24.99,
    badge: "Top vault",
    accent: "from-cyan-200 via-blue-500 to-purple-800",
    icon: KeyRound,
    description: "The most valuable crate tier with top-tier prize odds.",
    perks: ["1 key", "Legendary cosmetics", "Rank chance", "Jackpot rewards"],
  },
  {
    id: "totem",
    name: "Totem",
    category: "items",
    price: 1,
    accent: "from-emerald-300 to-cyan-600",
    icon: Shield,
    description: "A clutch survival safety item for dangerous fights, raids, and escapes.",
    perks: ["1 totem", "Instant delivery", "Survival ready", "No kit bundle"],
  },
  {
    id: "shulker-box",
    name: "Shulker Box",
    category: "items",
    price: 5,
    accent: "from-purple-300 to-blue-600",
    icon: Box,
    description: "Portable storage for builders, grinders, traders, and vault runs.",
    perks: ["1 shulker box", "Random color", "Instant delivery", "Storage upgrade"],
  },
];

export const stats = [
  { label: "Players online", value: "Checking", icon: Zap },
  { label: "Store deliveries", value: "Automatic", icon: BadgeCheck },
  { label: "Vote rewards", value: "Daily", icon: Vote },
  { label: "Support", value: "Discord", icon: Headphones },
];

export const features = [
  {
    title: "Automatic delivery",
    text: "Paid orders are sent to the Minecraft server with RCON after Stripe confirms the payment.",
    icon: Zap,
  },
  {
    title: "Clear rank upgrades",
    text: "Monthly and permanent ranks are separated at checkout so players know exactly what they are buying.",
    icon: Shield,
  },
  {
    title: "Daily vote rewards",
    text: "Voting helps the server grow and gives players simple in-game rewards like coins, keys, and streak bonuses.",
    icon: Sparkles,
  },
];

export const deliverySteps = [
  {
    title: "Enter username",
    text: "Use the exact Minecraft username before checkout so the reward goes to the right player.",
    icon: Shield,
  },
  {
    title: "Pay securely",
    text: "Card, Apple Pay, Google Pay, and PLN BLIK payments are handled by Stripe Checkout.",
    icon: BadgeCheck,
  },
  {
    title: "Receive in-game",
    text: "After payment confirmation, the server runs the configured command for the product.",
    icon: PackageCheck,
  },
  {
    title: "Retry if needed",
    text: "If the server is offline or RCON fails, staff can retry delivery from the admin dashboard.",
    icon: RefreshCw,
  },
];

export const voteHighlights = [
  {
    title: "Daily reward",
    text: "Vote once per site and claim coins, crate progress, or small utility rewards.",
    icon: Vote,
  },
  {
    title: "Streak bonus",
    text: "Players who vote often can earn better rewards over time without needing to buy anything.",
    icon: Sparkles,
  },
  {
    title: "Monthly top voters",
    text: "Active voters can be featured in Discord and receive bonus keys or cosmetics.",
    icon: Trophy,
  },
];

export const faqs = [
  {
    question: "How fast are purchases delivered?",
    answer:
      "Most purchases are delivered automatically within 10 to 60 seconds while you are online on ClutchSMP. If you are offline, rewards are queued for your next login.",
  },
  {
    question: "Do permanent ranks expire?",
    answer:
      "Permanent ranks do not expire unless a product page clearly states otherwise. Monthly ranks provide temporary access for 30 days.",
  },
  {
    question: "Can I gift items to another player?",
    answer:
      "Yes. Enter the exact Minecraft username at checkout. Staff can help if the username was misspelled before the package is claimed.",
  },
  {
    question: "Are crates pay-to-win?",
    answer:
      "Crates are designed around cosmetics, currency, utility, and seasonal rewards. ClutchSMP avoids direct combat advantages that harm competitive balance.",
  },
];
