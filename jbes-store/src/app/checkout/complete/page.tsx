import type { Metadata } from "next";
import { CheckoutComplete } from "@/components/checkout-complete";

export const metadata: Metadata = {
  title: "Payment Complete",
  description: "ClutchSMP payment confirmation and automatic delivery status.",
};

type SearchParams = Promise<{ session_id?: string }>;

export default async function CheckoutCompletePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { session_id: sessionId } = await searchParams;

  return <CheckoutComplete sessionId={sessionId} />;
}
