import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

async function getAccessToken(request: NextRequest): Promise<string> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) throw new Error("unauthorized");

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, providerId: "google" },
  });
  if (!account?.refreshToken) throw new Error("no_token");

  const now = new Date();
  if (account.accessTokenExpiresAt && account.accessTokenExpiresAt > now && account.accessToken) {
    return account.accessToken;
  }

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
    refresh_token: account.refreshToken,
    grant_type: "refresh_token",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!tokenRes.ok) throw new Error("refresh_failed");

  const tokenData = await tokenRes.json();
  await prisma.account.update({
    where: { id: account.id },
    data: {
      accessToken: tokenData.access_token,
      accessTokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
    },
  });

  return tokenData.access_token;
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = await getAccessToken(request);
    const { searchParams } = new URL(request.url);
    const pageToken = searchParams.get("pageToken") || "";
    const maxResults = searchParams.get("maxResults") || "12";

    const url = `https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=${maxResults}${pageToken ? `&pageToken=${pageToken}` : ""}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Falha ao buscar inscricoes" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({
      items: data.items || [],
      nextPageToken: data.nextPageToken || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    if (message === "unauthorized") {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
