export async function getYoutubeToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/refresh-token");
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return data.accessToken || null;
  } catch {
    return null;
  }
}
