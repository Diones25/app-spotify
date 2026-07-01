"use client"

import { authClient } from "@/lib/auth-client";
import { getYoutubeToken } from "@/lib/get-youtube-token";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { SpotifyCard } from "@/components/SpotifyCard";
import { User, Settings, Clock, Play, MoreHorizontal, Download, UserPlus, Pause } from "lucide-react";
import Header from "@/components/Header";
import HeaderSearch from "@/components/HeaderSearch";
import PlayerMusic from "@/components/PlayerMusic";
import SidebarVideo from "@/components/SidebarVideo";

interface Track {
  id: string;
  title: string;
  artist: string;
  image: string;
  url: string;
}

export default function Page() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/");
    }
  }, [session, isPending, router]);
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
  const [error, setError] = useState<string | null>(null);
  const [randomColor, setRandomColor] = useState("from-red-600");

  // Estados de Reprodução
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [played, setPlayed] = useState(0); // 0 a 1
  const [duration, setDuration] = useState(0); // em segundos
  const [volume, setVolume] = useState(1);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isVideoSidebarOpen, setIsVideoSidebarOpen] = useState(false);
  const [videoDetails, setVideoDetails] = useState<any>(null);
  const [channelDetails, setChannelDetails] = useState<any>(null);
  const [videoSidebarLoading, setVideoSidebarLoading] = useState(false);
  const [videoDurations, setVideoDurations] = useState<Record<string, number>>({});
  const queueRef = useRef<Track[]>([]);
  const queueIndexRef = useRef(0);
  const isRepeatRef = useRef(false);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const [ytApiReady, setYtApiReady] = useState(false);
  const fetchedForUserId = useRef<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  async function redirectToLogin() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/me",
    });
  }

  function isAuthError(code: string) {
    return code === "invalid_grant" || code === "no_refresh_token" || code === "no_session";
  }

  async function fetchWithRetry(token: string, url: string): Promise<Response | null> {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401 || res.status === 403) {
      const tokenResult = await getYoutubeToken();
      if ("error" in tokenResult) {
        if (isAuthError(tokenResult.code)) {
          await redirectToLogin();
          return null;
        }
        setError("Sessao expirada. Faca login novamente para acessar o YouTube.");
        return null;
      }
      setYoutubeToken(tokenResult.accessToken);
      const retryRes = await fetch(url, {
        headers: { Authorization: `Bearer ${tokenResult.accessToken}` }
      });
      if (!retryRes.ok) {
        setError("Falha ao acessar o YouTube. Tente novamente mais tarde.");
        return null;
      }
      return retryRes;
    }
    if (!res.ok) {
      setError("Erro ao carregar dados do YouTube.");
      return null;
    }
    return res;
  }

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    queueIndexRef.current = queueIndex;
  }, [queueIndex]);

  useEffect(() => {
    isRepeatRef.current = isRepeat;
  }, [isRepeat]);

  const skipNext = () => {
    const q = queueRef.current;
    const idx = queueIndexRef.current;
    if (idx < q.length - 1) {
      const nextIndex = idx + 1;
      setQueueIndex(nextIndex);
      setCurrentTrack(q[nextIndex]);
    } else {
      setIsPlaying(false);
    }
  };

  const skipPrevious = () => {
    const q = queueRef.current;
    const idx = queueIndexRef.current;
    if (idx > 0) {
      const prevIndex = idx - 1;
      setQueueIndex(prevIndex);
      setCurrentTrack(q[prevIndex]);
    }
  };

  const parseYouTubeDurationSeconds = (value: string) => {
    const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value);
    if (!match) return 0;
    const hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    const seconds = parseInt(match[3] || "0", 10);
    return hours * 3600 + minutes * 60 + seconds;
  };

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds || seconds <= 0) return "--:--";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).YT?.Player) {
      setYtApiReady(true);
      return;
    }
    if ((window as any).__YT_IFRAME_API_LOADING__) return;
    (window as any).__YT_IFRAME_API_LOADING__ = true;

    (window as any).onYouTubeIframeAPIReady = () => {
      setYtApiReady(true);
      (window as any).__YT_IFRAME_API_LOADING__ = false;
    };

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!ytApiReady) return;
    if (!playerContainerRef.current) return;
    if (ytPlayerRef.current) return;

    ytPlayerRef.current = new (window as any).YT.Player(playerContainerRef.current, {
      height: "100%",
      width: "100%",
      videoId: "",
      playerVars: {
        autoplay: 0,
        controls: 0,
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
        origin: window.location.origin
      },
      events: {
        onReady: () => {
          const player = ytPlayerRef.current;
          if (!player) return;
          player.setVolume(Math.round(volume * 100));
        },
        onStateChange: (event: any) => {
          const state = event?.data;
          const player = ytPlayerRef.current;
          if (!player) return;
          if (state === (window as any).YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            const d = player.getDuration?.() || 0;
            if (typeof d === "number" && d > 0) setDuration(d);
          }
          if (state === (window as any).YT.PlayerState.PAUSED) {
            setIsPlaying(false);
          }
          if (state === (window as any).YT.PlayerState.ENDED) {
            if (isRepeatRef.current) {
              player.seekTo(0, true);
              player.playVideo();
            } else {
              skipNext();
            }
          }
        },
        onError: (event: any) => {
          const code = event?.data;
          console.error("YouTube Player error:", code);
          skipNext();
        }
      }
    });
  }, [ytApiReady, volume]);

  useEffect(() => {
    const player = ytPlayerRef.current;
    if (!player) return;
    player.setVolume(Math.round(volume * 100));
    if (volume > 0) player.unMute?.();
  }, [volume]);

  useEffect(() => {
    if (!currentTrack) return;
    const player = ytPlayerRef.current;
    if (!player) return;
    const videoId = currentTrack.id;
    try {
      player.loadVideoById({ videoId });
      player.setVolume(Math.round(volume * 100));
      player.unMute?.();
    } catch (e) {
      console.error("Erro ao carregar vídeo:", e);
    }
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!ytApiReady) return;
    const player = ytPlayerRef.current;
    if (!player) return;
    if (!currentTrack) return;
    try {
      player.cueVideoById?.({ videoId: currentTrack.id });
      if (isPlaying) {
        player.playVideo?.();
        player.unMute?.();
      }
    } catch {}
  }, [ytApiReady]);

  useEffect(() => {
    const player = ytPlayerRef.current;
    if (!player) return;
    let timer: any;
    const tick = () => {
      try {
        const d = player.getDuration?.() || 0;
        const t = player.getCurrentTime?.() || 0;
        if (typeof d === "number" && d > 0) {
          setDuration(d);
          setPlayed(Math.min(0.999999, t / d));
        }
      } catch {}
    };
    timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!currentTrack) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const element = container.querySelector(`[data-track-id="${CSS.escape(currentTrack.id)}"]`) as HTMLElement | null;
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentTrack]);

  useEffect(() => {
    if (!isVideoSidebarOpen || !currentTrack) return;
    setChannelDetails(null);
    fetchVideoDetails(currentTrack.id);
  }, [currentTrack?.id, isVideoSidebarOpen]);

  const formatTrack = (item: any): Track => {
    // Para Playlist Items
    if (item.kind === 'youtube#playlistItem' || item.contentDetails?.videoId) {
      const videoId = item.contentDetails.videoId;
      return {
        id: videoId,
        title: item.snippet.title,
        artist: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle,
        image: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        url: `https://www.youtube.com/watch?v=${videoId}`
      };
    }
    // Para Search Results (Artistas)
    const videoId = item.id.videoId || item.id;
    return {
      id: videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      image: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      url: `https://www.youtube.com/watch?v=${videoId}`
    };
  };

  const playTrack = (track: Track, newQueue: Track[]) => {
    setQueue(newQueue);
    const index = newQueue.findIndex(t => t.id === track.id);
    setQueueIndex(index !== -1 ? index : 0);
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const handleNext = () => {
    skipNext();
  };

  const handlePrevious = () => {
    skipPrevious();
  };

  const togglePlay = () => {
    if (currentTrack) {
      const player = ytPlayerRef.current;
      if (player) {
        const state = player.getPlayerState?.();
        if (state === (window as any).YT?.PlayerState?.PLAYING) {
          player.pauseVideo?.();
          setIsPlaying(false);
        } else {
          player.playVideo?.();
          player.unMute?.();
          setIsPlaying(true);
        }
        return;
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (amount: number) => {
    setPlayed(amount);
    const player = ytPlayerRef.current;
    if (!player) return;
    try {
      const d = player.getDuration?.() || duration;
      player.seekTo?.(d * amount, true);
      if (!isPlaying) player.pauseVideo?.();
    } catch {}
  };

  const handleVolumeChange = (nextVolume: number) => {
    const clamped = Math.max(0, Math.min(1, nextVolume));
    setVolume(clamped);
  };

  const toggleRepeat = () => {
    setIsRepeat(!isRepeat);
  };

  const fetchVideoDetails = async (videoId: string) => {
    if (!youtubeToken) return;
    setVideoSidebarLoading(true);
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}`,
        { headers: { Authorization: `Bearer ${youtubeToken}` } }
      );
      if (res.status === 401 || res.status === 403) {
        const tokenResult = await getYoutubeToken();
        if ("error" in tokenResult) {
          if (isAuthError(tokenResult.code)) {
            await redirectToLogin();
            return;
          }
          return;
        }
        setYoutubeToken(tokenResult.accessToken);
        const retryRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}`,
          { headers: { Authorization: `Bearer ${tokenResult.accessToken}` } }
        );
        if (!retryRes.ok) return;
        const retryData = await retryRes.json();
        if (retryData.items && retryData.items.length > 0) {
          const v = retryData.items[0];
          setVideoDetails({
            title: v.snippet.title,
            channelTitle: v.snippet.channelTitle,
            channelId: v.snippet.channelId,
            description: v.snippet.description,
            viewCount: parseInt(v.statistics?.viewCount || "0").toLocaleString('pt-BR'),
            likeCount: parseInt(v.statistics?.likeCount || "0").toLocaleString('pt-BR'),
            publishedAt: v.snippet.publishedAt,
          });
          fetchChannelDetails(v.snippet.channelId);
        }
        return;
      }
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        const v = data.items[0];
        setVideoDetails({
          title: v.snippet.title,
          channelTitle: v.snippet.channelTitle,
          channelId: v.snippet.channelId,
          description: v.snippet.description,
          viewCount: parseInt(v.statistics?.viewCount || "0").toLocaleString('pt-BR'),
          likeCount: parseInt(v.statistics?.likeCount || "0").toLocaleString('pt-BR'),
          publishedAt: v.snippet.publishedAt,
        });
        fetchChannelDetails(v.snippet.channelId);
      }
    } catch (err) {
      console.error("Erro ao buscar detalhes do vídeo:", err);
    } finally {
      setVideoSidebarLoading(false);
    }
  };

  const fetchChannelDetails = async (channelId: string) => {
    if (!youtubeToken) return;
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}`,
        { headers: { Authorization: `Bearer ${youtubeToken}` } }
      );
      if (res.status === 401 || res.status === 403) {
        const tokenResult = await getYoutubeToken();
        if ("error" in tokenResult) {
          if (isAuthError(tokenResult.code)) {
            await redirectToLogin();
            return;
          }
          return;
        }
        setYoutubeToken(tokenResult.accessToken);
        const retryRes = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}`,
          { headers: { Authorization: `Bearer ${tokenResult.accessToken}` } }
        );
        if (!retryRes.ok) return;
        const retryData = await retryRes.json();
        if (retryData.items && retryData.items.length > 0) {
          const ch = retryData.items[0];
          setChannelDetails({
            title: ch.snippet.title,
            description: ch.snippet.description,
            thumbnail: ch.snippet.thumbnails?.high?.url || ch.snippet.thumbnails?.medium?.url || ch.snippet.thumbnails?.default?.url,
            subscriberCount: parseInt(ch.statistics?.subscriberCount || "0").toLocaleString('pt-BR'),
            videoCount: parseInt(ch.statistics?.videoCount || "0").toLocaleString('pt-BR'),
          });
        }
        return;
      }
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        const ch = data.items[0];
        setChannelDetails({
          title: ch.snippet.title,
          description: ch.snippet.description,
          thumbnail: ch.snippet.thumbnails?.high?.url || ch.snippet.thumbnails?.medium?.url || ch.snippet.thumbnails?.default?.url,
          subscriberCount: parseInt(ch.statistics?.subscriberCount || "0").toLocaleString('pt-BR'),
          videoCount: parseInt(ch.statistics?.videoCount || "0").toLocaleString('pt-BR'),
        });
      }
    } catch (err) {
      console.error("Erro ao buscar detalhes do canal:", err);
    }
  };

  const toggleVideoSidebar = () => {
    if (!isVideoSidebarOpen && currentTrack) {
      setChannelDetails(null);
      fetchVideoDetails(currentTrack.id);
    }
    setIsVideoSidebarOpen(!isVideoSidebarOpen);
  };

  const getPlaylistName = (): string | undefined => {
    if (view === "playlist-detail" && selectedPlaylist) {
      return selectedPlaylist.snippet.title;
    }
    if (view === "artist-detail" && selectedArtist) {
      return selectedArtist.snippet.title;
    }
    return undefined;
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
    const userId = session?.user?.id;
    if (!userId) {
      fetchedForUserId.current = null;
      return;
    }
    if (fetchedForUserId.current === userId) return;
    fetchedForUserId.current = userId;

    async function fetchYouTubeData() {
      try {
        setError(null);

        const tokenResult = await getYoutubeToken();
        if ("error" in tokenResult) {
          if (isAuthError(tokenResult.code)) {
            await redirectToLogin();
            return;
          }
          setError("Nao foi possivel conectar ao YouTube. Tente novamente mais tarde.");
          return;
        }

        setYoutubeToken(tokenResult.accessToken);

        // Buscar Playlists
        const plRes = await fetchWithRetry(tokenResult.accessToken, `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=12`);
        if (!plRes) return;
        const plData = await plRes.json();
        setPlaylists(plData.items || []);

        // Buscar Playlists (todas)
        const plAllRes = await fetchWithRetry(tokenResult.accessToken, `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=500`);
        if (!plAllRes) return;
        const plAllData = await plAllRes.json();
        setAllPlaylists(plAllData.items || []);

        // Buscar Inscrições (Artistas)
        const subRes = await fetchWithRetry(tokenResult.accessToken, `https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=12`);
        if (!subRes) return;
        const subData = await subRes.json();
        setSubscriptions(subData.items || []);

        // Buscar todas as Inscrições (Artistas)
        const subAllRes = await fetchWithRetry(tokenResult.accessToken, `https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=500`);
        if (!subAllRes) return;
        const subAllData = await subAllRes.json();
        setAllSubscriptions(subAllData.items || []);
      } catch (err) {
        console.error("Erro ao buscar dados do YouTube:", err);
        setError("Erro inesperado ao carregar dados do YouTube.");
      } finally {
        setLoading(false);
      }
    }

    document.title = `Spotify – ${session.user.name}`;
    fetchYouTubeData();
  }, [session?.user?.id, session?.user?.name]);

  const openPlaylistDetail = async (playlist: any) => {
    setSelectedPlaylist(playlist);
    setView("playlist-detail");
    setLoadingTracks(true);

    // Escolher uma cor aleatória
    const color = spotifyColors[Math.floor(Math.random() * spotifyColors.length)];
    setRandomColor(color);

    try {
      const tokenResult = await getYoutubeToken();
      if ("error" in tokenResult) {
        setLoadingTracks(false);
        if (isAuthError(tokenResult.code)) {
          await redirectToLogin();
          return;
        }
        setError("Token do YouTube expirado. Faca login novamente.");
        return;
      }
      const token = tokenResult.accessToken;

      const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlist.id}&maxResults=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Erro ao buscar playlist");
      const trackData = await res.json();
      const items = trackData.items || [];
      const videoIds = items
        .map((it: any) => it?.contentDetails?.videoId)
        .filter(Boolean);

      if (videoIds.length === 0) {
        setPlaylistTracks([]);
        return;
      }

      const embeddable = new Set<string>();
      const durations: Record<string, number> = {};
      for (let i = 0; i < videoIds.length; i += 50) {
        const chunk = videoIds.slice(i, i + 50);
        const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status,contentDetails&id=${chunk.join(",")}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!vRes.ok) throw new Error("Erro ao buscar detalhes dos vídeos");
        const vData = await vRes.json();
        for (const v of vData.items || []) {
          if (v?.status?.embeddable) embeddable.add(v.id);
          const iso = v?.contentDetails?.duration;
          if (typeof iso === "string") {
            durations[v.id] = parseYouTubeDurationSeconds(iso);
          }
        }
      }

      const playableItems = items.filter((it: any) => embeddable.has(it?.contentDetails?.videoId));
      setPlaylistTracks(playableItems);
      setVideoDurations(prev => ({ ...prev, ...durations }));
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
      const tokenResult = await getYoutubeToken();
      if ("error" in tokenResult) {
        setLoadingTracks(false);
        if (isAuthError(tokenResult.code)) {
          await redirectToLogin();
          return;
        }
        setError("Token do YouTube expirado. Faca login novamente.");
        return;
      }
      const token = tokenResult.accessToken;

      // Buscar vídeos do canal (simulando "músicas populares")
      const channelId = artist.snippet.resourceId.channelId;
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=10&order=viewCount&type=video&videoEmbeddable=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Erro ao buscar vídeos do artista");
      const videoData = await res.json();
      const items = videoData.items || [];
      setArtistVideos(items);

      const ids = items.map((it: any) => it?.id?.videoId).filter(Boolean);
      if (ids.length > 0) {
        const durations: Record<string, number> = {};
        for (let i = 0; i < ids.length; i += 50) {
          const chunk = ids.slice(i, i + 50);
          const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,status&id=${chunk.join(",")}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!vRes.ok) throw new Error("Erro ao buscar detalhes dos vídeos");
          const vData = await vRes.json();
          for (const v of vData.items || []) {
            const iso = v?.contentDetails?.duration;
            if (typeof iso === "string") {
              durations[v.id] = parseYouTubeDurationSeconds(iso);
            }
          }
        }
        setVideoDurations(prev => ({ ...prev, ...durations }));
      }
    } catch (err) {
      console.error("Erro ao buscar vídeos do artista:", err);
    } finally {
      setLoadingTracks(false);
    }
  };

  const retry = () => {
    setLoading(true);
    setError(null);
    fetchedForUserId.current = null;
    const userId = session?.user?.id;
    if (userId) {
      fetchedForUserId.current = userId;
      async function retryFetch() {
        try {
          const tokenResult = await getYoutubeToken();
          if ("error" in tokenResult) {
            setLoading(false);
            if (isAuthError(tokenResult.code)) {
              await redirectToLogin();
              return;
            }
            setError("Nao foi possivel conectar ao YouTube. Tente novamente mais tarde.");
            return;
          }
          setYoutubeToken(tokenResult.accessToken);
          const plRes = await fetchWithRetry(tokenResult.accessToken, `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=12`);
          if (!plRes) { setLoading(false); return; }
          const plData = await plRes.json();
          setPlaylists(plData.items || []);
          const plAllRes = await fetchWithRetry(tokenResult.accessToken, `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=500`);
          if (!plAllRes) { setLoading(false); return; }
          const plAllData = await plAllRes.json();
          setAllPlaylists(plAllData.items || []);
          const subRes = await fetchWithRetry(tokenResult.accessToken, `https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=12`);
          if (!subRes) { setLoading(false); return; }
          const subData = await subRes.json();
          setSubscriptions(subData.items || []);
          const subAllRes = await fetchWithRetry(tokenResult.accessToken, `https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=500`);
          if (!subAllRes) { setLoading(false); return; }
          const subAllData = await subAllRes.json();
          setAllSubscriptions(subAllData.items || []);
        } catch {
          setError("Erro inesperado ao carregar dados.");
        } finally {
          setLoading(false);
        }
      }
      retryFetch();
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <HeaderSearch />
      <div className="flex h-screen bg-black overflow-hidden font-sans pr-2">
        {/* Sidebar */}
        <Sidebar className="w-87.5 hidden md:flex" playlists={playlists} />

        {/* Conteúdo Principal */}
        <main className="h-187.5 flex-1 flex flex-col bg-linear-to-b from-[#1e1e1e] to-[#121212] ml-0 rounded-lg overflow-hidden relative transition-all duration-300">
          {/* Header Superior */}
          <Header setView={setView} />

          {/* Scrollable Content */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {error ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="bg-[#282828] rounded-full p-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-[#b3b3b3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">Algo deu errado</h2>
                <p className="text-[#b3b3b3] max-w-md">{error}</p>
                <button
                  onClick={retry}
                  className="bg-white text-black font-bold px-8 py-3 rounded-full hover:scale-105 transition-transform cursor-pointer"
                >
                  Tentar novamente
                </button>
              </div>
            ) : view === "home" ? (
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
                          const firstTrack = tracks[0];
                          // Se a primeira música da playlist está tocando, fazer toggle play/pause
                          if (currentTrack?.id === firstTrack.id) {
                            togglePlay();
                          } else {
                            // Caso contrário, tocar a primeira música
                            playTrack(firstTrack, tracks);
                          }
                        }
                      }}
                      className="bg-[#1ed760] p-4 rounded-full hover:scale-105 transition-transform text-black shadow-lg cursor-pointer"
                    >
                      {currentTrack && isPlaying && queue.some(t => t.id === formatTrack(playlistTracks[0]).id) ? (
                        <Pause fill="black" size={28} />
                      ) : (
                        <Play fill="black" size={28} />
                      )}
                    </button>
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
                          <button
                            key={item.id}
                            type="button"
                            data-track-id={track.id}
                            // Usar <button> evita o comportamento de "2 cliques" em alguns browsers mobile.
                            // Mantemos o play no onClick (evita disparar durante scroll) e o botão ocupa a linha inteira.
                            onClick={() => {
                              // Se a música clicada já está tocando, fazer toggle play/pause
                              if (isCurrent) {
                                togglePlay();
                              } else {
                                // Caso contrário, tocar a nova música
                                playTrack(track, playlistTracks.map(formatTrack));
                              }
                            }}
                            className="grid w-full bg-transparent border-0 outline-none focus:outline-none focus-visible:outline-none grid-cols-[16px_4fr_3fr_2fr_80px] gap-4 px-4 py-2 rounded-md hover:bg-white/10 transition-colors group items-center cursor-pointer text-left touch-manipulation"
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
                                  {track.title.slice(0, 50)}
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
                              {formatDuration(videoDurations[item?.contentDetails?.videoId])}
                            </div>
                          </button>
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
                          const firstTrack = tracks[0];
                          // Se a primeira música do artista está tocando, fazer toggle play/pause
                          if (currentTrack?.id === firstTrack.id) {
                            togglePlay();
                          } else {
                            // Caso contrário, tocar a primeira música
                            playTrack(firstTrack, tracks);
                          }
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
                            <button
                              key={track.id}
                              type="button"
                              data-track-id={track.id}
                              onClick={() => {
                                // Se a música clicada já está tocando, fazer toggle play/pause
                                if (isCurrent) {
                                  togglePlay();
                                } else {
                                  // Caso contrário, tocar a nova música
                                  playTrack(track, artistVideos.map(formatTrack));
                                }
                              }}
                              className="flex w-full bg-transparent border-0 items-center justify-between p-2 rounded-md hover:bg-white/10 group transition-colors cursor-pointer text-left touch-manipulation"
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
                                <span className="text-[#b3b3b3] text-sm mr-4">{formatDuration(videoDurations[item?.id?.videoId])}</span>
                              </div>
                            </button>
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

        {/* Video Sidebar */}
        <SidebarVideo
          isOpen={isVideoSidebarOpen}
          onClose={() => setIsVideoSidebarOpen(false)}
          videoDetails={videoDetails}
          channelDetails={channelDetails}
          currentTrack={currentTrack}
          playlistName={getPlaylistName()}
          loading={videoSidebarLoading}
          playerContainerRef={playerContainerRef}
          currentTime={Math.floor(played * duration)}
          duration={duration}
          isPlaying={isPlaying}
          onSeek={(time) => {
            const player = ytPlayerRef.current;
            if (player?.seekTo) {
              player.seekTo(time, true);
            }
          }}
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
        volume={volume}
        onVolumeChange={handleVolumeChange}
        isRepeat={isRepeat}
        onToggleRepeat={toggleRepeat}
        isVideoSidebarOpen={isVideoSidebarOpen}
        onToggleVideoSidebar={toggleVideoSidebar}
        hasVideo={!!currentTrack}
      />
    </>
  );
}
