import type { Metadata } from "next";
import { CategoryLanding } from "@/components/storefront";

export const metadata: Metadata = {
  title: "Items",
  description: "Buy ClutchSMP Totems and Shulker Boxes without separate kit bundle products.",
};

export default function ItemsLegacyPage() {
  return <CategoryLanding category="items" />;
}
