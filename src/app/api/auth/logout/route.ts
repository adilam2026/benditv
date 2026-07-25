import { destroySession } from "@/server/auth/session";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  await destroySession();
  return NextResponse.redirect(new URL("/", request.url), 303);
}
