import type { Metadata } from "next";
import { Storefront } from "@/components/storefront";

export const metadata: Metadata = {
  title: "Store",
  description: "Browse every ClutchSMP rank, coin pack, crate key, and item in one premium Minecraft store.",
};

export default function StorePage() {
  return <Storefront />;
}
