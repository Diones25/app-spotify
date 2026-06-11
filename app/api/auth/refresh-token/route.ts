import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autenticado", code: "no_session" }, { status: 401 });
    }

    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "google",
      },
    });

    if (!account?.refreshToken) {
      return NextResponse.json({ error: "Sem refresh token disponivel", code: "no_refresh_token" }, { status: 401 });
    }

    const now = new Date();
    if (account.accessTokenExpiresAt && account.accessTokenExpiresAt > now) {
      return NextResponse.json({ accessToken: account.accessToken });
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

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("Erro ao renovar token Google:", errBody);
      const isInvalidGrant = errBody.includes("invalid_grant");
      return NextResponse.json({
        error: "Falha ao renovar token",
        code: isInvalidGrant ? "invalid_grant" : "refresh_failed",
      }, { status: 401 });
    }

    const tokenData = await tokenRes.json();
    const newAccessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in;

    const newExpiresAt = new Date(Date.now() + expiresIn * 1000);

    await prisma.account.update({
      where: { id: account.id },
      data: {
        accessToken: newAccessToken,
        accessTokenExpiresAt: newExpiresAt,
      },
    });

    return NextResponse.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Erro no refresh-token:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
