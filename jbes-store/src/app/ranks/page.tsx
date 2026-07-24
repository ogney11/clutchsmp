import type { Metadata } from "next";
import { CategoryLanding } from "@/components/storefront";

export const metadata: Metadata = {
  title: "Ranks",
  description: "Upgrade your ClutchSMP account with monthly or permanent VIP, SVIP, Sponsor, Elite, and Swagger ranks.",
};

export default function RanksPage() {
  return <CategoryLanding category="ranks" />;
}
