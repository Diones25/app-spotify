"use client"

import { authClient } from "@/lib/auth-client";
import { useEffect, useState, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { SpotifyCard } from "@/components/SpotifyCard";
import { Bell, User, ChevronLeft, ChevronRight, Settings, Clock, Play, MoreHorizontal, Download, UserPlus, Pause } from "lucide-react";
import Header from "@/components/Header";
import HeaderSearch from "@/components/HeaderSearch";
import PlayerMusic from "@/components/PlayerMusic";
import dynamic from 'next/dynamic';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false }) as any;

interface Track {
  id: string;
  title: string;
  artist: string;
  image: string;
  url: string;
}

export default function Page() {
  const { data: session } = authClient.useSession();
  const [youtubeToken, setYoutubeToken] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [allPlaylists, setAllPlaylists] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [allSubscriptions, setAllSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"home" | "artists" | "playlists" | "playlist-detail" | "artist-detail">("home");
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
  const [artistVideos, setArtistVideos] = useState<any[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [randomColor, setRandomColor] = useState("from-red-600");

  // Estados de Reprodução
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [played, setPlayed] = useState(0); // 0 a 1
  const [duration, setDuration] = useState(0); // em segundos
  const playerRef = useRef<any>(null);

  const formatTrack = (item: any): Track => {
    // Para Playlist Items
    if (item.kind === 'youtube#playlistItem' || item.contentDetails?.videoId) {
      return {
        id: item.contentDetails.videoId,
        title: item.snippet.title,
        artist: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle,
        image: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        url: `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`
      };
    }
    // Para Search Results (Artistas)
    return {
      id: item.id.videoId || item.id,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      image: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId || item.id}`
    };
  };

  const playTrack = (track: Track, newQueue: Track[]) => {
    console.log("Iniciando reprodução:", track.title, track.url);
    setQueue(newQueue);
    const index = newQueue.findIndex(t => t.id === track.id);
    setQueueIndex(index !== -1 ? index : 0);
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const handleNext = () => {
    if (queueIndex < queue.length - 1) {
      const nextIndex = queueIndex + 1;
      setQueueIndex(nextIndex);
      setCurrentTrack(queue[nextIndex]);
    }
  };

  const handlePrevious = () => {
    if (queueIndex > 0) {
      const prevIndex = queueIndex - 1;
      setQueueIndex(prevIndex);
      setCurrentTrack(queue[prevIndex]);
    }
  };

  const togglePlay = () => {
    if (currentTrack) {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (amount: number) => {
    setPlayed(amount);
    if (playerRef.current) {
      playerRef.current.seekTo(amount, 'fraction');
    }
  };

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

  const openArtistDetail = async (artist: any) => {
    setSelectedArtist(artist);
    setView("artist-detail");
    setLoadingTracks(true);

    // Escolher uma cor aleatória
    const color = spotifyColors[Math.floor(Math.random() * spotifyColors.length)];
    setRandomColor(color);

    try {
      const { data } = await authClient.getAccessToken({
        providerId: "google",
      });

      if (data?.accessToken) {
        // Buscar vídeos do canal (simulando "músicas populares")
        const channelId = artist.snippet.resourceId.channelId;
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=10&order=viewCount&type=video`, {
          headers: { Authorization: `Bearer ${data.accessToken}` }
        });
        const videoData = await res.json();
        setArtistVideos(videoData.items || []);
      }
    } catch (err) {
      console.error("Erro ao buscar vídeos do artista:", err);
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
                          onClick={() => openArtistDetail(sub)}
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
                    <button
                      onClick={() => {
                        if (playlistTracks.length > 0) {
                          const tracks = playlistTracks.map(formatTrack);
                          playTrack(tracks[0], tracks);
                        }
                      }}
                      className="bg-[#1ed760] p-4 rounded-full hover:scale-105 transition-transform text-black shadow-lg"
                    >
                      {currentTrack && isPlaying && queue.some(t => t.id === formatTrack(playlistTracks[0]).id) ? (
                        <Pause fill="black" size={28} />
                      ) : (
                        <Play fill="black" size={28} />
                      )}
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
                      playlistTracks.map((item, i) => {
                        const track = formatTrack(item);
                        const isCurrent = currentTrack?.id === track.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => playTrack(track, playlistTracks.map(formatTrack))}
                            className="grid grid-cols-[16px_4fr_3fr_2fr_80px] gap-4 px-4 py-2 rounded-md hover:bg-white/10 transition-colors group items-center cursor-pointer"
                          >
                            <span className={`text-[#b3b3b3] group-hover:text-white text-sm ${isCurrent ? 'text-[#1ed760]' : ''}`}>
                              {isCurrent && isPlaying ? (
                                <div className="flex items-end gap-0.5 h-3">
                                  <div className="w-0.5 bg-[#1ed760] animate-bounce" style={{ animationDuration: '0.6s' }} />
                                  <div className="w-0.5 bg-[#1ed760] animate-bounce" style={{ animationDuration: '0.8s' }} />
                                  <div className="w-0.5 bg-[#1ed760] animate-bounce" style={{ animationDuration: '0.5s' }} />
                                </div>
                              ) : i + 1}
                            </span>
                            <div className="flex items-center gap-3">
                              <img
                                src={track.image}
                                alt=""
                                className="w-10 h-10 rounded object-cover"
                              />
                              <div className="flex flex-col min-w-0">
                                <span className={`font-medium truncate group-hover:text-white ${isCurrent ? 'text-[#1ed760]' : 'text-white'}`}>
                                  {track.title}
                                </span>
                                <span className="text-[#b3b3b3] text-xs truncate">
                                  {track.artist}
                                </span>
                              </div>
                            </div>
                            <span className="text-[#b3b3b3] text-sm truncate hidden md:block">
                              {selectedPlaylist.snippet.title}
                            </span>
                            <span className="text-[#b3b3b3] text-sm truncate hidden lg:block">
                              {new Date(item.snippet.publishedAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                            <div className="flex justify-end text-[#b3b3b3] text-sm">
                              3:45
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : view === "artist-detail" && selectedArtist ? (
              /* Visualização Detalhada do Artista */
              <div className="-m-6">
                {/* Header do Artista com Gradiente e Imagem de Fundo */}
                <div className={`relative h-[40vh] min-h-85 flex items-end p-6 bg-linear-to-b ${randomColor} to-[#121212]/80`}>
                  <div className="flex flex-col gap-4 z-10">
                    <div className="flex items-center gap-2 text-white">
                      <div className="bg-blue-500 rounded-full p-1"><Settings size={12} className="text-white fill-white" /></div>
                      <span className="text-sm font-bold">Artista verificado</span>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter">{selectedArtist.snippet.title}</h1>
                    <span className="text-white font-medium">854.321 ouvintes mensais</span>
                  </div>
                </div>

                {/* Controles e Lista de Músicas Populares */}
                <div className="bg-[#121212] p-6 space-y-8">
                  <div className="flex items-center gap-8">
                    <button
                      onClick={() => {
                        if (artistVideos.length > 0) {
                          const tracks = artistVideos.map(formatTrack);
                          playTrack(tracks[0], tracks);
                        }
                      }}
                      className="bg-[#1ed760] p-4 rounded-full hover:scale-105 transition-transform text-black shadow-lg"
                    >
                      {currentTrack && isPlaying && queue.some(t => t.id === formatTrack(artistVideos[0]).id) ? (
                        <Pause fill="black" size={28} />
                      ) : (
                        <Play fill="black" size={28} />
                      )}
                    </button>
                    <button className="border border-[#878787] text-white px-4 py-1 rounded-full text-sm font-bold hover:border-white transition-colors">Seguindo</button>
                    <button className="text-[#b3b3b3] hover:text-white transition-colors"><MoreHorizontal size={28} /></button>
                  </div>

                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4">Populares</h2>
                    <div className="space-y-1">
                      {loadingTracks ? (
                        Array(5).fill(0).map((_, i) => (
                          <div key={i} className="h-14 bg-[#181818] rounded-md animate-pulse" />
                        ))
                      ) : (
                        artistVideos.map((item, i) => {
                          const track = formatTrack(item);
                          const isCurrent = currentTrack?.id === track.id;
                          return (
                            <div
                              key={track.id}
                              onClick={() => playTrack(track, artistVideos.map(formatTrack))}
                              className="flex items-center justify-between p-2 rounded-md hover:bg-white/10 group transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <span className={`w-4 text-center text-sm ${isCurrent ? 'text-[#1ed760]' : 'text-[#b3b3b3] group-hover:text-white'}`}>
                                  {isCurrent && isPlaying ? (
                                    <div className="flex items-end gap-0.5 h-3 justify-center">
                                      <div className="w-0.5 bg-[#1ed760] animate-bounce" style={{ animationDuration: '0.6s' }} />
                                      <div className="w-0.5 bg-[#1ed760] animate-bounce" style={{ animationDuration: '0.8s' }} />
                                      <div className="w-0.5 bg-[#1ed760] animate-bounce" style={{ animationDuration: '0.5s' }} />
                                    </div>
                                  ) : i + 1}
                                </span>
                                <img src={track.image} alt="" className="w-10 h-10 rounded object-cover" />
                                <div className="flex flex-col min-w-0">
                                  <span className={`font-medium truncate group-hover:text-white ${isCurrent ? 'text-[#1ed760]' : 'text-white'}`}>
                                    {track.title}
                                  </span>
                                  <span className="text-[#b3b3b3] text-xs">Videoclipe</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-8">
                                <span className="text-[#b3b3b3] text-sm hidden md:block">1.234.567</span>
                                <span className="text-[#b3b3b3] text-sm mr-4">3:24</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <button className="text-[#b3b3b3] text-sm font-bold hover:text-white mt-4 uppercase tracking-wider">Ver mais</button>
                  </section>
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
                      onClick={() => openArtistDetail(sub)}
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
                      onClick={() => openPlaylistDetail(pl)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      {/* Player de áudio visível mas escondido para evitar bloqueios de áudio do navegador */}
      <div
        className={`fixed bottom-24 right-4 w-[320px] h-45 z-50 overflow-hidden rounded-lg shadow-2xl border border-white/10 transition-opacity duration-500 ${currentTrack ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
      >
        <ReactPlayer
          {...({
            ref: playerRef,
            url: currentTrack?.url || "",
            playing: isPlaying,
            volume: 1,
            muted: false,
            playsinline: true,
            width: "100%",
            height: "100%",
            onProgress: (state: any) => {
              if (isPlaying) setPlayed(state.played);
            },
            onReady: (player: any) => {
              console.log("YouTube Player Ready");
              setDuration(player.getDuration());
            },
            onPlay: () => setIsPlaying(true),
            onPause: () => setIsPlaying(false),
            onEnded: handleNext,
            onError: (e: any) => {
              console.error("Erro no Player YouTube:", e);
              // Tentar pular para a próxima se houver erro de licenciamento
              handleNext();
            },
            onBuffer: () => console.log("Carregando música..."),
            onBufferEnd: () => console.log("Carregamento finalizado"),
            config: {
              youtube: {
                playerVars: {
                  autoplay: 1,
                  controls: 1,
                  modestbranding: 1,
                  rel: 0,
                  showinfo: 0,
                  origin: typeof window !== 'undefined' ? window.location.origin : ''
                }
              }
            }
          } as any)}
        />
      </div>

      <PlayerMusic
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onNext={handleNext}
        onPrevious={handlePrevious}
        progress={played}
        duration={duration}
        onSeek={handleSeek}
      />
    </>
  );
}
