import { NextResponse } from "next/server";
import { createPlayerReview, listVisibleReviews } from "@/lib/server/reviews";
import { isValidMinecraftUsername } from "@/lib/server/delivery";

export const runtime = "nodejs";

export async function GET() {
  try {
    const reviews = await listVisibleReviews();
    return NextResponse.json({ reviews });
  } catch (error) {
    if (isMissingReviewsTableError(error)) {
      return NextResponse.json({ reviews: [], setupNeeded: true });
    }

    return NextResponse.json({ reviews: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      minecraftUsername?: string;
      rating?: number;
      quote?: string;
    };

    const minecraftUsername = body.minecraftUsername?.trim() ?? "";
    const rating = normalizeRating(body.rating);
    const quote = normalizeQuote(body.quote);

    if (!isValidMinecraftUsername(minecraftUsername)) {
      return NextResponse.json({ error: "Enter a valid Minecraft username." }, { status: 400 });
    }

    if (!rating) {
      return NextResponse.json({ error: "Choose a rating from 1 to 5 stars." }, { status: 400 });
    }

    if (quote.length < 12) {
      return NextResponse.json({ error: "Write at least 12 characters." }, { status: 400 });
    }

    if (quote.length > 280) {
      return NextResponse.json({ error: "Keep the review under 280 characters." }, { status: 400 });
    }

    const review = await createPlayerReview({ minecraftUsername, rating, quote });
    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    if (isMissingReviewsTableError(error)) {
      return NextResponse.json(
        { error: "Database schema needs the reviews update. Run the latest supabase/schema.sql in Supabase, then retry." },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: "Review could not be posted." }, { status: 500 });
  }
}

function normalizeRating(value: unknown) {
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  return rating;
}

function normalizeQuote(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
}

function isMissingReviewsTableError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("reviews") && (message.includes("does not exist") || message.includes("schema cache"));
}
