import { NextRequest, NextResponse } from "next/server";

function hasSessionCookie(request: NextRequest) {
  return Boolean(
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token") ||
    request.cookies.get("better-auth-session_token") ||
    request.cookies.get("__Secure-better-auth-session_token")
  );
}

export function proxy(request: NextRequest) {
  const sessionCookie = hasSessionCookie(request);
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
