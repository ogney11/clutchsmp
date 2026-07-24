import type { Metadata } from "next";
import { CategoryLanding } from "@/components/storefront";

export const metadata: Metadata = {
  title: "Crates & Keys",
  description: "Open ClutchSMP Common, Epic, and Legendary crate keys for premium rewards.",
};

export default function CratesAndKeysPage() {
  return <CategoryLanding category="crates" />;
}
