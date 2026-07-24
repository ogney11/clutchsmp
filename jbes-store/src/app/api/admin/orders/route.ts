import { NextResponse } from "next/server";
import { listOrders } from "@/lib/server/db";
import { getRequiredEnv, getServerErrorMessage } from "@/lib/server/env";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const orders = await listOrders();
    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json({ error: getServerErrorMessage(error) }, { status: 500 });
  }
}

function isAuthorized(request: Request) {
  const expected = getRequiredEnv("ADMIN_API_TOKEN");
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${expected}`;
}
