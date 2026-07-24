import { products, rankPackages } from "@/lib/store-data";

export type PaymentProduct = {
  id: string;
  name: string;
  priceUsd: number;
  command: string;
};

const rankCommands = rankPackages.flatMap((rank) => [
  {
    id: `rank-${rank.id}-monthly`,
    name: `${rank.name} Rank - 30 Days`,
    priceUsd: rank.monthlyPrice,
    command: `lp user {username} parent addtemp ${rank.id} 30d`,
  },
  {
    id: `rank-${rank.id}-permanent`,
    name: `${rank.name} Rank - Permanent`,
    priceUsd: rank.permanentPrice,
    command: `lp user {username} parent add ${rank.id}`,
  },
]);

const productCommands: Record<string, string> = {
  "100-coins": "eco give {username} 100",
  "500-coins": "eco give {username} 500",
  "1000-coins": "eco give {username} 1000",
  "5000-coins": "eco give {username} 5000",
  "10000-coins": "eco give {username} 10000",
  "common-key": "crate key give {username} common 1",
  "epic-key": "crate key give {username} epic 1",
  "legendary-key": "crate key give {username} legendary 1",
  totem: "give {username} minecraft:totem_of_undying 1",
  "shulker-box": "give {username} minecraft:shulker_box 1",
};

export const paymentProducts: PaymentProduct[] = [
  ...products.map((product) => ({
    id: product.id,
    name: product.name,
    priceUsd: product.price,
    command: productCommands[product.id] ?? "",
  })),
  ...rankCommands,
];

export function getPaymentProduct(productId: string) {
  const configuredCommands = parseConfiguredCommands();
  const product = paymentProducts.find((item) => item.id === productId);
  if (!product) return null;

  return {
    ...product,
    command: configuredCommands[product.id] || product.command,
  };
}

function parseConfiguredCommands() {
  const raw = process.env.PRODUCT_COMMANDS_JSON;
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
  } catch {
    return {};
  }
}
