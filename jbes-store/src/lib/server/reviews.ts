import "server-only";

import { getSupabaseAdmin } from "@/lib/server/db";

export type ReviewRow = {
  id: string;
  minecraft_username: string;
  rating: number;
  quote: string;
  is_visible: boolean;
  created_at: string;
};

export type PublicReview = {
  id: string;
  minecraftUsername: string;
  rating: number;
  quote: string;
  createdAt: string;
};

export async function listVisibleReviews(limit = 9) {
  const { data, error } = await getSupabaseAdmin()
    .from("reviews")
    .select("id,minecraft_username,rating,quote,is_visible,created_at")
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<ReviewRow[]>();

  if (error) throw new Error(error.message);
  return data.map(toPublicReview);
}

export async function createPlayerReview(input: {
  minecraftUsername: string;
  rating: number;
  quote: string;
}) {
  const { data, error } = await getSupabaseAdmin()
    .from("reviews")
    .insert({
      minecraft_username: input.minecraftUsername,
      rating: input.rating,
      quote: input.quote,
      is_visible: true,
    })
    .select("id,minecraft_username,rating,quote,is_visible,created_at")
    .single<ReviewRow>();

  if (error) throw new Error(error.message);
  return toPublicReview(data);
}

function toPublicReview(row: ReviewRow): PublicReview {
  return {
    id: row.id,
    minecraftUsername: row.minecraft_username,
    rating: row.rating,
    quote: row.quote,
    createdAt: row.created_at,
  };
}
