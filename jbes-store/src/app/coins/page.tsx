import type { Metadata } from "next";
import { CategoryLanding } from "@/components/storefront";

export const metadata: Metadata = {
  title: "Coins",
  description: "Buy ClutchSMP coins for cosmetics, keys, seasonal offers, and premium marketplace upgrades.",
};

export default function CoinsPage() {
  return <CategoryLanding category="coins" />;
}
