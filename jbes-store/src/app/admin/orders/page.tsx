import type { Metadata } from "next";
import { AdminOrdersDashboard } from "@/components/admin-orders-dashboard";

export const metadata: Metadata = {
  title: "Admin Orders",
  description: "ClutchSMP order delivery dashboard.",
};

export default function AdminOrdersPage() {
  return <AdminOrdersDashboard />;
}
