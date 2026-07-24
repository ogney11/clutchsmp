import { NextResponse } from "next/server";
import { retryDelivery } from "@/lib/server/delivery";
import { getRequiredEnv, getServerErrorMessage } from "@/lib/server/env";

export const runtime = "nodejs";

type Params = Promise<{ orderId: string }>;

export async function POST(request: Request, context: { params: Params }) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { orderId } = await context.params;

  try {
    await retryDelivery(orderId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: getServerErrorMessage(error) }, { status: 500 });
  }
}

function isAuthorized(request: Request) {
  const expected = getRequiredEnv("ADMIN_API_TOKEN");
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${expected}`;
}
