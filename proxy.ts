import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("better-auth.session_token");
  const { pathname } = request.nextUrl;

  if (sessionCookie && pathname === "/") {
    return NextResponse.redirect(new URL("/me", request.url));
  }

  if (!sessionCookie && pathname === "/me") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/me"],
};
