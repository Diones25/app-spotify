"use client"

import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { SpotifyCard } from "@/components/SpotifyCard";
import { Bell, User, ChevronLeft, ChevronRight, Settings } from "lucide-react";

export default function Page() {
  const { data: session } = authClient.useSession();
  const [youtubeToken, setYoutubeToken] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchYouTubeData() {
      try {
        const { data } = await authClient.getAccessToken({
          providerId: "google",
        });
        
        if (data?.accessToken) {
          setYoutubeToken(data.accessToken);
          
          // Buscar Playlists
          const plRes = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=10`, {
            headers: { Authorization: `Bearer ${data.accessToken}` }
          });
          const plData = await plRes.json();
          setPlaylists(plData.items || []);

          // Buscar Inscrições (Artistas)
          const subRes = await fetch(`https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=10`, {
            headers: { Authorization: `Bearer ${data.accessToken}` }
          });
          const subData = await subRes.json();
          setSubscriptions(subData.items || []);
        }
      } catch (err) {
        console.error("Erro ao buscar dados do YouTube:", err);
      } finally {
        setLoading(false);
      }
    }
    
    if (session) {
      fetchYouTubeData();
    }
  }, [session]);

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <p>Por favor, faça login para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar className="w-87.5 hidden md:flex" playlists={playlists} />

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col bg-linear-to-b from-[#1e1e1e] to-[#121212] m-2 ml-0 rounded-lg overflow-hidden relative">

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Banner de Perfil Estilo Spotify */}
          <section className="flex items-end gap-6 mb-8">
            <div className="w-48 h-48 md:w-60 md:h-60 shadow-2xl rounded-full overflow-hidden shrink-0 bg-[#282828]">
              {session?.user.image ? (
                <img src={session?.user.image} alt={session.user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><User size={80} className="text-[#b3b3b3]" /></div>
              )}
            </div>
            <div className="flex flex-col gap-2 pb-2">
              <span className="text-xs font-bold text-white tracking-wider">Perfil</span>
              <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter">{session.user?.name}</h1>
              <div className="flex items-center gap-2 text-white/90 text-sm mt-2">
                <span className="font-bold">{playlists.length} playlists públicas</span>
                <span>•</span>
                <span className="font-bold">{subscriptions.length} seguindo</span>
              </div>
            </div>
          </section>

          {/* Seção de Playlists */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">Playlists públicas</h2>
              <button className="text-[#b3b3b3] text-sm font-bold hover:underline">Mostrar tudo</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {loading ? (
                Array(6).fill(0).map((_, i) => <div key={i} className="bg-[#181818] h-64 rounded-lg animate-pulse" />)
              ) : (
                playlists.map((pl) => (
                  <SpotifyCard 
                    key={pl.id}
                    title={pl.snippet.title}
                    subtitle={`De ${pl.snippet.channelTitle}`}
                    image={pl.snippet.thumbnails?.high?.url || pl.snippet.thumbnails?.medium?.url}
                  />
                ))
              )}
            </div>
          </section>

          {/* Seção de Artistas (Inscrições) */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">Seguindo</h2>
              <button className="text-[#b3b3b3] text-sm font-bold hover:underline">Mostrar tudo</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {loading ? (
                Array(6).fill(0).map((_, i) => <div key={i} className="bg-[#181818] h-64 rounded-lg animate-pulse" />)
              ) : (
                subscriptions.map((sub) => (
                  <SpotifyCard 
                    key={sub.id}
                    title={sub.snippet.title}
                    subtitle="Canal"
                    type="artist"
                    image={sub.snippet.thumbnails?.high?.url || sub.snippet.thumbnails?.medium?.url}
                  />
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
