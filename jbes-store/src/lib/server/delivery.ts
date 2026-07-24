import "server-only";

import { getOrder, markDeliveryDelivered, markDeliveryFailed, type OrderRow } from "@/lib/server/db";
import { sendMinecraftCommand } from "@/lib/server/rcon";

export function isValidMinecraftUsername(username: string) {
  return /^[A-Za-z0-9_]{3,16}$/.test(username);
}

export function renderCommand(command: string, username: string) {
  return command.replaceAll("{username}", username);
}

export async function deliverOrder(order: OrderRow) {
  if (order.payment_status !== "paid") {
    throw new Error("Order is not paid yet.");
  }

  if (order.delivery_status === "delivered") {
    return { skipped: true };
  }

  const attempts = order.delivery_attempts + 1;

  try {
    await sendMinecraftCommand(renderCommand(order.delivery_command, order.minecraft_username));
    await markDeliveryDelivered(order.id);
    return { skipped: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown RCON delivery error";
    await markDeliveryFailed(order.id, message, attempts);
    throw error;
  }
}

export async function retryDelivery(orderId: string) {
  const order = await getOrder(orderId);
  return deliverOrder(order);
}
