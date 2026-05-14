"use client"

import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { SpotifyCard } from "@/components/SpotifyCard";
import { Bell, User, ChevronLeft, ChevronRight, Settings, Clock, Play, MoreHorizontal, Download, UserPlus } from "lucide-react";
import Header from "@/components/Header";
import HeaderSearch from "@/components/HeaderSearch";
import PlayerMusic from "@/components/PlayerMusic";

export default function Page() {
  const { data: session } = authClient.useSession();
  const [youtubeToken, setYoutubeToken] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [allPlaylists, setAllPlaylists] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [allSubscriptions, setAllSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"home" | "artists" | "playlists" | "playlist-detail">("home");
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [randomColor, setRandomColor] = useState("from-red-600");

  const spotifyColors = [
    "from-red-600",
    "from-blue-600",
    "from-green-600",
    "from-purple-600",
    "from-orange-600",
    "from-pink-600",
    "from-indigo-600",
    "from-yellow-600",
    "from-teal-600",
    "from-emerald-600",
  ];

  useEffect(() => {
    async function fetchYouTubeData() {
      try {
        const { data, error } = await authClient.getAccessToken({
          providerId: "google",
        });
        
        if (data?.accessToken) {
          setYoutubeToken(data.accessToken);
          
          // Buscar Playlists
          const plRes = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=10`, {
            headers: { Authorization: `Bearer ${data.accessToken}` }
          });

          if (plRes.status === 401 || plRes.status === 403) {
             throw new Error("Token expirado ou inválido");
          }

          const plData = await plRes.json();
          setPlaylists(plData.items || []);

          // Buscar Playlists
          const plAllRes = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=500`, {
            headers: { Authorization: `Bearer ${data.accessToken}` }
          });
          const plAllData = await plAllRes.json();
          setAllPlaylists(plAllData.items || []);

          // Buscar Inscrições (Artistas)
          const subRes = await fetch(`https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=10`, {
            headers: { Authorization: `Bearer ${data.accessToken}` }
          });
          const subData = await subRes.json();
          setSubscriptions(subData.items || []);

          // Buscar todas as Inscrições (Artistas)
          const subAllRes = await fetch(`https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=500`, {
            headers: { Authorization: `Bearer ${data.accessToken}` }
          });
          const subAllData = await subAllRes.json();
          setAllSubscriptions(subAllData.items || []);
        } else if (error) {
          console.error("Erro ao recuperar access token:", error);
          // Opcional: authClient.signOut();
        }
      } catch (err) {
        console.error("Erro ao buscar dados do YouTube:", err);
      } finally {
        setLoading(false);
      }
    }
    
    if (session) {
      document.title = `Spotify – ${session.user.name}`;
      fetchYouTubeData();
    }
  }, [session]);

  const openPlaylistDetail = async (playlist: any) => {
    setSelectedPlaylist(playlist);
    setView("playlist-detail");
    setLoadingTracks(true);
    
    // Escolher uma cor aleatória
    const color = spotifyColors[Math.floor(Math.random() * spotifyColors.length)];
    setRandomColor(color);
    
    try {
      const { data } = await authClient.getAccessToken({
        providerId: "google",
      });
      
      if (data?.accessToken) {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlist.id}&maxResults=50`, {
          headers: { Authorization: `Bearer ${data.accessToken}` }
        });
        const trackData = await res.json();
        setPlaylistTracks(trackData.items || []);
      }
    } catch (err) {
      console.error("Erro ao buscar músicas da playlist:", err);
    } finally {
      setLoadingTracks(false);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <p>Por favor, faça login para acessar esta página.</p>
      </div>
    );
  }

  return (
    <>
      <HeaderSearch />
      <div className="flex h-screen bg-black overflow-hidden font-sans pr-2">
        {/* Sidebar */}
        <Sidebar className="w-87.5 hidden md:flex" playlists={playlists} />

        {/* Conteúdo Principal */}
        <main className="flex-1 flex flex-col bg-linear-to-b from-[#1e1e1e] to-[#121212] ml-0 rounded-lg overflow-hidden relative">
          {/* Header Superior */}
          <Header setView={setView} />
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {view === "home" ? (
              <>
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
                    <button 
                      onClick={() => setView("playlists")}
                      className="text-[#b3b3b3] text-sm font-bold hover:underline cursor-pointer"
                    >
                      Mostrar tudo
                    </button>
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
                        onClick={() => openPlaylistDetail(pl)}
                      />
                    ))
                  )}
                </div>
                </section>

                {/* Seção de Artistas (Inscrições) */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">Seguindo</h2>
                    <button 
                      onClick={() => setView("artists")}
                      className="text-[#b3b3b3] text-sm font-bold hover:underline cursor-pointer"
                    >
                      Mostrar tudo
                    </button>
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
              </>
            ) : view === "playlist-detail" && selectedPlaylist ? (
            /* Visualização Detalhada da Playlist */
            <div className="-m-6">
              {/* Header da Playlist com Gradiente Dinâmico */}
              <div className={`bg-linear-to-b ${randomColor} to-[#121212] p-6 pt-12 flex flex-col md:flex-row items-end gap-6`}>
                <div className="w-48 h-48 md:w-60 md:h-60 shadow-2xl rounded-md overflow-hidden shrink-0">
                    <img 
                      src={selectedPlaylist.snippet.thumbnails?.high?.url || selectedPlaylist.snippet.thumbnails?.medium?.url} 
                      alt={selectedPlaylist.snippet.title} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex flex-col gap-2 pb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Playlist pública</span>
                    <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter mb-2">{selectedPlaylist.snippet.title}</h1>
                    <div className="flex items-center gap-2 text-white/90 text-sm">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-white/10">
                        {session?.user.image && <img src={session.user.image} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <span className="font-bold">{session?.user.name}</span>
                      <span>•</span>
                      <span>{playlistTracks.length} músicas</span>
                    </div>
                  </div>
                </div>

                {/* Controles e Lista de Músicas */}
                <div className="bg-[#121212]/30 backdrop-blur-sm p-6 space-y-6 min-h-screen">
                  <div className="flex items-center gap-8">
                    <button className="bg-[#1ed760] p-4 rounded-full hover:scale-105 transition-transform text-black shadow-lg">
                      <Play fill="black" size={28} />
                    </button>
                    <button className="text-[#b3b3b3] hover:text-white transition-colors"><Download size={28} /></button>
                    <button className="text-[#b3b3b3] hover:text-white transition-colors"><UserPlus size={28} /></button>
                    <button className="text-[#b3b3b3] hover:text-white transition-colors"><MoreHorizontal size={28} /></button>
                  </div>

                  {/* Cabeçalho da Tabela */}
                  <div className="grid grid-cols-[16px_4fr_3fr_2fr_80px] gap-4 px-4 py-2 border-b border-white/10 text-[#b3b3b3] text-sm font-medium uppercase tracking-wider">
                    <span>#</span>
                    <span>Título</span>
                    <span className="hidden md:block">Álbum</span>
                    <span className="hidden lg:block">Adicionada em</span>
                    <div className="flex justify-end"><Clock size={16} /></div>
                  </div>

                  {/* Lista de Músicas */}
                  <div className="space-y-1 mt-2">
                    {loadingTracks ? (
                      Array(5).fill(0).map((_, i) => (
                        <div key={i} className="h-14 bg-[#181818] rounded-md animate-pulse mx-2" />
                      ))
                    ) : (
                      playlistTracks.map((track, i) => (
                        <div key={track.id} className="grid grid-cols-[16px_4fr_3fr_2fr_80px] gap-4 px-4 py-2 rounded-md hover:bg-white/10 transition-colors group items-center">
                          <span className="text-[#b3b3b3] group-hover:text-white text-sm">{i + 1}</span>
                          <div className="flex items-center gap-3">
                            <img 
                              src={track.snippet.thumbnails?.default?.url} 
                              alt="" 
                              className="w-10 h-10 rounded object-cover" 
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-white font-medium truncate group-hover:text-[#1ed760] cursor-pointer">
                                {track.snippet.title}
                              </span>
                              <span className="text-[#b3b3b3] text-xs truncate">
                                {track.snippet.videoOwnerChannelTitle || track.snippet.channelTitle}
                              </span>
                            </div>
                          </div>
                          <span className="text-[#b3b3b3] text-sm truncate hidden md:block">
                            {selectedPlaylist.snippet.title}
                          </span>
                          <span className="text-[#b3b3b3] text-sm truncate hidden lg:block">
                            {new Date(track.snippet.publishedAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                          <div className="flex justify-end text-[#b3b3b3] text-sm">
                            {/* Duração fixa ou placeholder se a API não fornecer no snippet básico */}
                            3:45
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : view === "artists" ? (
              /* Visualização "Mostrar Tudo" de Artistas */
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-white">Seguindo</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {allSubscriptions.map((sub) => (
                    <SpotifyCard 
                      key={sub.id}
                      title={sub.snippet.title}
                      subtitle="Artista"
                      type="artist"
                      image={sub.snippet.thumbnails?.high?.url || sub.snippet.thumbnails?.medium?.url}
                    />
                  ))}
                </div>
              </section>
            ) : (
              /* Visualização "Mostrar Tudo" de Playlists */
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-white">Playlists públicas</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {allPlaylists.map((pl) => (
                    <SpotifyCard 
                      key={pl.id}
                      title={pl.snippet.title}
                      subtitle={`De ${pl.snippet.channelTitle}`}
                      image={pl.snippet.thumbnails?.high?.url || pl.snippet.thumbnails?.medium?.url}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      <PlayerMusic />
    </>
  );
}
