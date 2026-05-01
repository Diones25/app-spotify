"use client"

import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";

export default function Page() {
  const { data: session } = authClient.useSession();
  const [youtubeToken, setYoutubeToken] = useState<string | null>(null);

  useEffect(() => {
    async function getToken() {
      const token = await authClient.getSocialToken({
        provider: "google",
      });
      if (token) {
        setYoutubeToken(token.data?.accessToken || null);
      }
    }
    getToken();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Me: {session?.user?.name}</h1>
      <div className="mt-4 p-4 bg-muted rounded-md border">
        <h2 className="text-lg font-semibold mb-2">YouTube Token Info</h2>
        {youtubeToken ? (
          <div className="break-all">
            <p className="text-sm font-mono text-green-600">Token encontrado!</p>
            <p className="mt-2 text-xs text-muted-foreground">Token: {youtubeToken.substring(0, 20)}...</p>
          </div>
        ) : (
          <p className="text-sm text-red-500">Token não encontrado ou carregando...</p>
        )}
      </div>
    </div>
  );
}