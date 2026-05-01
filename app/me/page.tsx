"use client"

import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";

export default function Page() {
  const { data: session } = authClient.useSession();
  const [youtubeToken, setYoutubeToken] = useState<string | null>(null);

  useEffect(() => {
    async function getToken() {
      try {
        // Busca o token de acesso para o provedor google
        const { data, error } = await authClient.getAccessToken({
          providerId: "google",
        });
        
        if (data) {
          setYoutubeToken(data.accessToken);
        } else if (error) {
          console.error("Erro ao buscar token:", error);
        }
      } catch (err) {
        console.error("Erro inesperado:", err);
      }
    }
    
    if (session) {
      getToken();
    }
  }, [session]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Me: {session?.user?.name}</h1>
      <div className="mt-4 p-4 bg-muted rounded-md border">
        <h2 className="text-lg font-semibold mb-2">YouTube Token Info</h2>
        {youtubeToken ? (
          <div className="break-all">
            <p className="text-sm font-mono text-green-600">Token encontrado!</p>
            <p className="mt-2 text-xs text-muted-foreground">Token: {youtubeToken.substring(0, 30)}...</p>
            <p className="mt-4 text-sm">
              Agora você pode usar este token no cabeçalho <code>Authorization: Bearer {youtubeToken.substring(0, 10)}...</code> para chamar a YouTube Data API.
            </p>
          </div>
        ) : (
          <p className="text-sm text-yellow-600">
            {session 
              ? "Buscando token ou você precisa fazer logout e login novamente para salvar o token no banco de dados..." 
              : "Por favor, faça login para ver seu token."}
          </p>
        )}
      </div>
    </div>
  );
}