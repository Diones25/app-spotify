export async function getYoutubeToken(): Promise<{ accessToken: string } | { error: string; code: string }> {
  try {
    const res = await fetch("/api/auth/refresh-token");
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Erro desconhecido", code: data.code || "unknown" };
    }
    if (data.accessToken) {
      return { accessToken: data.accessToken };
    }
    return { error: "Token nao encontrado", code: "unknown" };
  } catch {
    return { error: "Erro de conexao", code: "network" };
  }
}
