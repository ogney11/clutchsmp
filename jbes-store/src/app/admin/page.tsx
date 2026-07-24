import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin Orders",
  description: "Protected ClutchSMP order dashboard for payment and Minecraft delivery retries.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
