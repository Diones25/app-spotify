"use client"

import { authClient } from "@/lib/auth-client";
import { getYoutubeToken } from "@/lib/get-youtube-token";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { SpotifyCard } from "@/components/SpotifyCard";
import { User, Settings, Clock, Play, MoreHorizontal, Pause, Music2 } from "lucide-react";
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

type YTPlayer = {
  setVolume?: (value: number) => void;
  unMute?: () => void;
  mute?: () => void;
  loadVideoById?: (options: { videoId: string }) => void;
  getDuration?: () => number;
  getCurrentTime?: () => number;
  seekTo?: (seconds: number, allowSeekAhead?: boolean) => void;
  playVideo?: () => void;
  pauseVideo?: () => void;
  destroy?: () => void;
  getPlayerState?: () => number;
};

type YTPlayerEvent = {
  target?: YTPlayer;
  data?: number;
};

type PendingPlayback = {
  track: Track;
  autoplay: boolean;
};

type View = "home" | "artists" | "playlists" | "playlist-detail" | "artist-detail" | "search" | "track-detail";
type SearchTab = "all" | "playlists" | "tracks" | "artists";
type DetailOrigin = "home" | "playlists" | "artists" | "search";

interface SearchPlaylist {
  id: string;
  snippet: {
    title: string;
    channelTitle: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: any;
  };
}

interface SearchArtist {
  id: string;
  snippet: {
    title: string;
    description?: string;
    thumbnails?: any;
    resourceId: {
      channelId: string;
    };
  };
}

interface SearchTrack {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
    channelId?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: any;
  };
  duration?: number;
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
  const [view, setView] = useState<View>("home");
  const [detailOrigin, setDetailOrigin] = useState<DetailOrigin>("home");
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [selectedTrackItem, setSelectedTrackItem] = useState<SearchTrack | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
  const [artistVideos, setArtistVideos] = useState<any[]>([]);
  const [relatedTracks, setRelatedTracks] = useState<SearchTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [randomColor, setRandomColor] = useState("from-red-600");
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [searchTab, setSearchTab] = useState<SearchTab>("all");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPlaylists, setSearchPlaylists] = useState<SearchPlaylist[]>([]);
  const [searchArtists, setSearchArtists] = useState<SearchArtist[]>([]);
  const [searchTracks, setSearchTracks] = useState<SearchTrack[]>([]);

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
  const [isVideoMaximized, setIsVideoMaximized] = useState(false);
  const [videoDetails, setVideoDetails] = useState<any>(null);
  const [channelDetails, setChannelDetails] = useState<any>(null);
  const [videoSidebarLoading, setVideoSidebarLoading] = useState(false);
  const [videoDurations, setVideoDurations] = useState<Record<string, number>>({});
  const queueRef = useRef<Track[]>([]);
  const queueIndexRef = useRef(0);
  const isRepeatRef = useRef(false);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const playerReadyRef = useRef(false);
  const volumeRef = useRef(1);
  const isPlayingRef = useRef(false);
  const pendingPlaybackRef = useRef<PendingPlayback | null>(null);
  const lastLoadedTrackIdRef = useRef<string | null>(null);
  const [ytApiReady, setYtApiReady] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const fetchedForUserId = useRef<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [sidebarFilter, setSidebarFilter] = useState<"all" | "playlists" | "artists">("all");

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

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

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

  const getThumbnailUrl = (thumbnails: any) => (
    thumbnails?.high?.url || thumbnails?.medium?.url || thumbnails?.default?.url || ""
  );

  const getTrackVideoId = (item: any) => item?.contentDetails?.videoId || item?.id?.videoId || item?.id;

  const getArtistChannelId = (artist: any) => artist?.snippet?.resourceId?.channelId || artist?.id;

  const normalizePlaylistSearchResult = (item: any): SearchPlaylist => ({
    id: item?.id?.playlistId || item?.id,
    snippet: {
      title: item?.snippet?.title || "Playlist sem titulo",
      channelTitle: item?.snippet?.channelTitle || "YouTube",
      description: item?.snippet?.description,
      publishedAt: item?.snippet?.publishedAt,
      thumbnails: item?.snippet?.thumbnails,
    },
  });

  const normalizeArtistSearchResult = (item: any): SearchArtist => ({
    id: item?.id?.channelId || item?.id,
    snippet: {
      title: item?.snippet?.title || "Artista sem nome",
      description: item?.snippet?.description,
      thumbnails: item?.snippet?.thumbnails,
      resourceId: {
        channelId: item?.id?.channelId || item?.snippet?.resourceId?.channelId || item?.id,
      },
    },
  });

  const normalizeTrackSearchResult = (item: any, duration?: number): SearchTrack => ({
    id: {
      videoId: getTrackVideoId(item),
    },
    snippet: {
      title: item?.snippet?.title || "Musica sem titulo",
      channelTitle: item?.snippet?.channelTitle || "YouTube",
      channelId: item?.snippet?.channelId,
      description: item?.snippet?.description,
      publishedAt: item?.snippet?.publishedAt,
      thumbnails: item?.snippet?.thumbnails,
    },
    duration,
  });

  const fetchVideoMetadata = async (token: string, videoIds: string[]) => {
    const embeddable = new Set<string>();
    const durations: Record<string, number> = {};

    for (let i = 0; i < videoIds.length; i += 50) {
      const chunk = videoIds.slice(i, i + 50);
      const response = await fetchWithRetry(token, `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,status&id=${chunk.join(",")}`);
      if (!response) throw new Error("Erro ao buscar detalhes dos videos");
      const data = await response.json();

      for (const video of data.items || []) {
        if (video?.status?.embeddable) embeddable.add(video.id);
        const isoDuration = video?.contentDetails?.duration;
        if (typeof isoDuration === "string") {
          durations[video.id] = parseYouTubeDurationSeconds(isoDuration);
        }
      }
    }

    return { embeddable, durations };
  };

  const buildQueueFromItems = (items: any[], selectedItem?: any) => {
    const nextItems = [...items];
    const selectedId = selectedItem ? getTrackVideoId(selectedItem) : null;

    if (selectedItem && selectedId && !nextItems.some((item) => getTrackVideoId(item) === selectedId)) {
      nextItems.unshift(selectedItem);
    }

    return nextItems.map(formatTrack);
  };

  const getReadyPlayer = () => {
    const player = ytPlayerRef.current;
    if (!playerReadyRef.current || !player) return null;
    return player;
  };

  const syncPlayerVolume = (player: YTPlayer) => {
    if (typeof player.setVolume !== "function") return;
    const nextVolume = volumeRef.current;
    player.setVolume(Math.round(nextVolume * 100));
    if (nextVolume > 0) {
      player.unMute?.();
    } else {
      player.mute?.();
    }
  };

  const loadTrackIntoPlayer = (track: Track, autoplay: boolean, source: string) => {
    const player = getReadyPlayer();
    if (!player || typeof player.loadVideoById !== "function") {
      pendingPlaybackRef.current = { track, autoplay };
      console.warn("YouTube Player ainda nao esta pronto; playback pendente:", {
        source,
        videoId: track.id,
        autoplay,
      });
      return false;
    }

    try {
      player.loadVideoById({ videoId: track.id });
      lastLoadedTrackIdRef.current = track.id;
      pendingPlaybackRef.current = null;
      setPlayed(0);
      setDuration(0);
      syncPlayerVolume(player);
      if (autoplay) {
        player.playVideo?.();
      } else {
        player.pauseVideo?.();
      }
      console.info("YouTube Player carregou faixa:", {
        source,
        videoId: track.id,
        autoplay,
      });
      return true;
    } catch (error) {
      console.error("Erro ao carregar video no YouTube Player:", {
        source,
        videoId: track.id,
        autoplay,
        error,
      });
      pendingPlaybackRef.current = { track, autoplay };
      return false;
    }
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
    script.onerror = () => {
      (window as any).__YT_IFRAME_API_LOADING__ = false;
      console.error("Falha ao carregar YouTube Iframe API.");
    };
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
        onReady: (event: YTPlayerEvent) => {
          const player = event?.target;
          if (!player || typeof player.setVolume !== "function") return;
          ytPlayerRef.current = player;
          playerReadyRef.current = true;
          setIsPlayerReady(true);
          syncPlayerVolume(player);
          console.info("YouTube Player pronto.", {
            currentTrackId: currentTrack?.id ?? null,
            pendingTrackId: pendingPlaybackRef.current?.track.id ?? null,
          });
          const pendingPlayback = pendingPlaybackRef.current;
          if (pendingPlayback) {
            loadTrackIntoPlayer(pendingPlayback.track, pendingPlayback.autoplay, "onReady");
          }
        },
        onStateChange: (event: YTPlayerEvent) => {
          const state = event?.data;
          const player = getReadyPlayer();
          if (!player) return;
          console.info("YouTube Player state change:", {
            state,
            currentTrackId: currentTrack?.id ?? null,
          });
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
              player.seekTo?.(0, true);
              player.playVideo?.();
            } else {
              skipNext();
            }
          }
        },
        onError: (event: YTPlayerEvent) => {
          const code = event?.data;
          console.error("YouTube Player error:", {
            code,
            currentTrackId: currentTrack?.id ?? null,
            pendingTrackId: pendingPlaybackRef.current?.track.id ?? null,
          });
          skipNext();
        }
      }
    });

    return () => {
      playerReadyRef.current = false;
      pendingPlaybackRef.current = null;
      lastLoadedTrackIdRef.current = null;
      const player = ytPlayerRef.current;
      ytPlayerRef.current = null;
      if (typeof player?.destroy === "function") {
        player.destroy();
      }
    };
  }, [ytApiReady]);

  useEffect(() => {
    const player = getReadyPlayer();
    if (!player) return;
    syncPlayerVolume(player);
  }, [volume, isPlayerReady]);

  useEffect(() => {
    if (!currentTrack) return;
    const player = getReadyPlayer();
    if (!player || typeof player.loadVideoById !== "function") {
      pendingPlaybackRef.current = { track: currentTrack, autoplay: isPlayingRef.current };
      return;
    }

    if (pendingPlaybackRef.current?.track.id === currentTrack.id) {
      loadTrackIntoPlayer(currentTrack, pendingPlaybackRef.current.autoplay, "effect-pending");
      return;
    }

    if (lastLoadedTrackIdRef.current !== currentTrack.id) {
      loadTrackIntoPlayer(currentTrack, isPlayingRef.current, "effect-sync");
      return;
    }

    syncPlayerVolume(player);
    if (!isPlayingRef.current) {
      player.pauseVideo?.();
    } else {
      player.playVideo?.();
    }
  }, [currentTrack?.id, isPlayerReady]);

  useEffect(() => {
    const player = getReadyPlayer();
    if (!player) return;
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
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [currentTrack?.id, isPlayerReady]);

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
    pendingPlaybackRef.current = { track, autoplay: true };
    setCurrentTrack(track);
    setIsPlaying(true);
    loadTrackIntoPlayer(track, true, "playTrack");
  };

  const handleNext = () => {
    skipNext();
  };

  const handlePrevious = () => {
    skipPrevious();
  };

  const togglePlay = () => {
    if (currentTrack) {
      const player = getReadyPlayer();
      if (player) {
        const state = player.getPlayerState?.();
        if (state === (window as any).YT?.PlayerState?.PLAYING) {
          player.pauseVideo?.();
          setIsPlaying(false);
        } else {
          const trackToResume = currentTrack;
          if (trackToResume && lastLoadedTrackIdRef.current !== trackToResume.id) {
            loadTrackIntoPlayer(trackToResume, true, "togglePlay");
          } else {
            syncPlayerVolume(player);
            player.playVideo?.();
          }
          setIsPlaying(true);
        }
        return;
      }
      pendingPlaybackRef.current = { track: currentTrack, autoplay: !isPlaying };
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (amount: number) => {
    setPlayed(amount);
    const player = getReadyPlayer();
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

  const getCurrentOrigin = (): DetailOrigin => {
    if (view === "playlist-detail" || view === "artist-detail" || view === "track-detail") {
      return detailOrigin;
    }
    if (view === "search") return "search";
    if (view === "playlists") return "playlists";
    if (view === "artists") return "artists";
    return "home";
  };

  const handleMainBack = () => {
    if (view === "playlist-detail" || view === "artist-detail" || view === "track-detail") {
      setView(detailOrigin);
      return;
    }

    if (view === "playlists" || view === "artists" || view === "search") {
      setView("home");
      return;
    }

    setView("home");
  };

  const getPlaylistName = (): string | undefined => {
    if (view === "playlist-detail" && selectedPlaylist) {
      return selectedPlaylist.snippet.title;
    }
    if (view === "artist-detail" && selectedArtist) {
      return selectedArtist.snippet.title;
    }
    if (view === "track-detail" && selectedTrackItem) {
      return selectedTrackItem.snippet.channelTitle;
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

  const handleSearchSubmit = async () => {
    const query = searchQuery.trim();

    if (!query) {
      setSubmittedQuery("");
      setSearchPlaylists([]);
      setSearchArtists([]);
      setSearchTracks([]);
      setSearchTab("all");
      setSearchError(null);
      setView("home");
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    setSubmittedQuery(query);
    setSearchTab("all");
    setView("search");
    setSelectedPlaylist(null);
    setSelectedArtist(null);
    setSelectedTrackItem(null);

    try {
      const tokenResult = await getYoutubeToken();
      if ("error" in tokenResult) {
        if (isAuthError(tokenResult.code)) {
          await redirectToLogin();
          return;
        }
        setSearchError("Nao foi possivel pesquisar agora. Tente novamente mais tarde.");
        return;
      }

      setYoutubeToken(tokenResult.accessToken);

      const encodedQuery = encodeURIComponent(query);
      const [playlistResponse, trackResponse, artistResponse] = await Promise.all([
        fetchWithRetry(tokenResult.accessToken, `https://www.googleapis.com/youtube/v3/search?part=snippet&type=playlist&maxResults=18&q=${encodedQuery}`),
        fetchWithRetry(tokenResult.accessToken, `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=20&q=${encodedQuery}`),
        fetchWithRetry(tokenResult.accessToken, `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=18&q=${encodedQuery}`),
      ]);

      if (!playlistResponse || !trackResponse || !artistResponse) {
        setSearchError("Nao foi possivel carregar os resultados da pesquisa.");
        return;
      }

      const [playlistData, trackData, artistData] = await Promise.all([
        playlistResponse.json(),
        trackResponse.json(),
        artistResponse.json(),
      ]);

      const rawTracks = trackData.items || [];
      const videoIds = rawTracks.map(getTrackVideoId).filter(Boolean);
      const { embeddable, durations } = await fetchVideoMetadata(tokenResult.accessToken, videoIds);
      const nextTracks = rawTracks
        .filter((item: any) => embeddable.has(getTrackVideoId(item)))
        .map((item: any) => normalizeTrackSearchResult(item, durations[getTrackVideoId(item)] || 0));

      setVideoDurations((prev) => ({ ...prev, ...durations }));
      setSearchPlaylists((playlistData.items || []).map(normalizePlaylistSearchResult));
      setSearchArtists((artistData.items || []).map(normalizeArtistSearchResult));
      setSearchTracks(nextTracks);
    } catch (err) {
      console.error("Erro ao pesquisar no YouTube:", err);
      setSearchError("Erro ao buscar playlists, musicas e artistas.");
    } finally {
      setSearchLoading(false);
    }
  };

  const openPlaylistDetail = async (playlist: any, origin: DetailOrigin = "home") => {
    setDetailOrigin(origin);
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

      const response = await fetchWithRetry(token, `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlist.id}&maxResults=50`);
      if (!response) throw new Error("Erro ao buscar playlist");
      const trackData = await response.json();
      const items = trackData.items || [];
      const videoIds = items
        .map((it: any) => it?.contentDetails?.videoId)
        .filter(Boolean);

      if (videoIds.length === 0) {
        setPlaylistTracks([]);
        return;
      }

      const { embeddable, durations } = await fetchVideoMetadata(token, videoIds);

      const playableItems = items.filter((it: any) => embeddable.has(it?.contentDetails?.videoId));
      setPlaylistTracks(playableItems);
      setVideoDurations(prev => ({ ...prev, ...durations }));
    } catch (err) {
      console.error("Erro ao buscar músicas da playlist:", err);
    } finally {
      setLoadingTracks(false);
    }
  };

  const openArtistDetail = async (artist: any, origin: DetailOrigin = "home") => {
    setDetailOrigin(origin);
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
      const channelId = getArtistChannelId(artist);
      const response = await fetchWithRetry(token, `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=10&order=viewCount&type=video&videoEmbeddable=true`);
      if (!response) throw new Error("Erro ao buscar videos do artista");
      const videoData = await response.json();
      const items = videoData.items || [];
      setArtistVideos(items);

      const ids = items.map((it: any) => it?.id?.videoId).filter(Boolean);
      if (ids.length > 0) {
        const { durations } = await fetchVideoMetadata(token, ids);
        setVideoDurations(prev => ({ ...prev, ...durations }));
      }
    } catch (err) {
      console.error("Erro ao buscar vídeos do artista:", err);
    } finally {
      setLoadingTracks(false);
    }
  };

  const openTrackDetail = async (item: SearchTrack, origin: DetailOrigin = "search") => {
    setDetailOrigin(origin);
    setSelectedTrackItem(item);
    setView("track-detail");
    setLoadingTracks(true);

    const selectedTrack = formatTrack(item);
    playTrack(selectedTrack, [selectedTrack]);

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
      const channelId = item.snippet.channelId;
      let nextItems: SearchTrack[] = [item];

      if (channelId) {
        const response = await fetchWithRetry(token, `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=15&order=viewCount&type=video&videoEmbeddable=true`);
        if (!response) throw new Error("Erro ao buscar musicas relacionadas");
        const relatedData = await response.json();
        const rawItems = relatedData.items || [];
        const ids = rawItems.map(getTrackVideoId).filter(Boolean);
        const { embeddable, durations } = await fetchVideoMetadata(token, ids);

        nextItems = rawItems
          .filter((track: any) => embeddable.has(getTrackVideoId(track)))
          .map((track: any) => normalizeTrackSearchResult(track, durations[getTrackVideoId(track)] || 0));

        if (!nextItems.some((track) => track.id.videoId === item.id.videoId)) {
          nextItems.unshift(item);
        }

        setVideoDurations((prev) => ({
          ...prev,
          ...durations,
          [item.id.videoId]: item.duration || prev[item.id.videoId] || 0,
        }));
      }

      setRelatedTracks(nextItems);
      playTrack(selectedTrack, buildQueueFromItems(nextItems, item));
    } catch (err) {
      console.error("Erro ao abrir detalhe da musica:", err);
      setRelatedTracks([item]);
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

  const featuredSearchResult = searchPlaylists[0]
    ? {
        key: `playlist-${searchPlaylists[0].id}`,
        type: "playlist" as const,
        title: searchPlaylists[0].snippet.title,
        subtitle: `Playlist • ${searchPlaylists[0].snippet.channelTitle}`,
        image: getThumbnailUrl(searchPlaylists[0].snippet.thumbnails),
        data: searchPlaylists[0],
      }
    : searchTracks[0]
      ? {
          key: `track-${searchTracks[0].id.videoId}`,
          type: "track" as const,
          title: searchTracks[0].snippet.title,
          subtitle: `Musica • ${searchTracks[0].snippet.channelTitle}`,
          image: getThumbnailUrl(searchTracks[0].snippet.thumbnails),
          data: searchTracks[0],
        }
      : searchArtists[0]
        ? {
            key: `artist-${searchArtists[0].id}`,
            type: "artist" as const,
            title: searchArtists[0].snippet.title,
            subtitle: "Artista",
            image: getThumbnailUrl(searchArtists[0].snippet.thumbnails),
            data: searchArtists[0],
          }
        : null;

  const searchAllResults = [
    ...searchPlaylists.map((playlist) => ({
      key: `playlist-${playlist.id}`,
      type: "playlist" as const,
      title: playlist.snippet.title,
      subtitle: playlist.snippet.channelTitle,
      badge: "Playlist",
      image: getThumbnailUrl(playlist.snippet.thumbnails),
      data: playlist,
    })),
    ...searchTracks.map((track) => ({
      key: `track-${track.id.videoId}`,
      type: "track" as const,
      title: track.snippet.title,
      subtitle: track.snippet.channelTitle,
      badge: "Musica",
      duration: track.duration,
      image: getThumbnailUrl(track.snippet.thumbnails),
      data: track,
    })),
    ...searchArtists.map((artist) => ({
      key: `artist-${artist.id}`,
      type: "artist" as const,
      title: artist.snippet.title,
      subtitle: "Canal do YouTube",
      badge: "Artista",
      image: getThumbnailUrl(artist.snippet.thumbnails),
      data: artist,
    })),
  ];

  const openSearchResult = (result: { type: "playlist" | "track" | "artist"; data: any }) => {
    if (result.type === "playlist") {
      openPlaylistDetail(result.data, "search");
      return;
    }

    if (result.type === "artist") {
      openArtistDetail(result.data, "search");
      return;
    }

    openTrackDetail(result.data, "search");
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
      <HeaderSearch
        value={searchQuery}
        onChange={setSearchQuery}
        onSubmit={handleSearchSubmit}
        onHomeClick={() => setView("home")}
      />
      <div className="flex h-[calc(100dvh-10rem)] min-h-0 bg-black overflow-hidden font-sans pr-2">
        {/* Sidebar */}
        {!isVideoMaximized && (
          <Sidebar
            className="w-87.5 hidden md:flex"
            playlists={playlists}
            subscriptions={subscriptions}
            activeFilter={sidebarFilter}
            onFilterChange={setSidebarFilter}
            onPlaylistClick={(playlist) => openPlaylistDetail(playlist, getCurrentOrigin())}
            onArtistClick={(artist) => openArtistDetail(artist, getCurrentOrigin())}
          />
        )}

        {/* Conteúdo Principal */}
        {!isVideoMaximized && (
        <main className="ml-0 relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-linear-to-b from-[#1e1e1e] to-[#121212] transition-all duration-300">
          {/* Header Superior */}
          <Header onBack={handleMainBack} />

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
                          onClick={() => openPlaylistDetail(pl, "home")}
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
                          onClick={() => openArtistDetail(sub, "home")}
                        />
                      ))
                    )}
                  </div>
                </section>
              </>
            ) : view === "search" ? (
              <section className="space-y-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "all", label: "Tudo" },
                      { value: "playlists", label: "Playlists" },
                      { value: "tracks", label: "Musicas" },
                      { value: "artists", label: "Artistas" },
                    ].map((tab) => (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => setSearchTab(tab.value as SearchTab)}
                        className={`${searchTab === tab.value ? "bg-white text-black" : "bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]"} px-4 py-2 rounded-full text-sm font-bold transition-colors cursor-pointer`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {searchLoading ? (
                  <div className="space-y-4">
                    <div className="h-42 rounded-xl bg-[#181818] animate-pulse" />
                    <div className="h-20 rounded-xl bg-[#181818] animate-pulse" />
                    <div className="h-20 rounded-xl bg-[#181818] animate-pulse" />
                  </div>
                ) : searchError ? (
                  <div className="rounded-2xl border border-white/10 bg-[#181818] p-8 text-center">
                    <h2 className="text-xl font-bold text-white">Nao foi possivel carregar a pesquisa</h2>
                    <p className="text-[#b3b3b3] mt-2">{searchError}</p>
                  </div>
                ) : searchAllResults.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-[#181818] p-8 text-center">
                    <h2 className="text-xl font-bold text-white">Nenhum resultado encontrado</h2>
                    <p className="text-[#b3b3b3] mt-2">Tente pesquisar por outro nome de playlist, musica ou artista.</p>
                  </div>
                ) : searchTab === "all" ? (
                  <div className="">
                    <section className="space-y-4">
                      <div className="space-y-2">
                        {searchAllResults.map((result) => (
                          <button
                            key={result.key}
                            type="button"
                            onClick={() => openSearchResult(result)}
                            className="flex w-full items-center gap-4 rounded-xl px-3 py-2 text-left transition-colors hover:bg-white/10 cursor-pointer"
                          >
                            {result.image ? (
                              <img
                                src={result.image}
                                alt={result.title}
                                className={`h-14 w-14 object-cover ${result.type === "artist" ? "rounded-full" : "rounded-md"}`}
                              />
                            ) : (
                              <div className={`flex h-14 w-14 items-center justify-center bg-[#333333] text-white ${result.type === "artist" ? "rounded-full" : "rounded-md"}`}>
                                <Music2 size={20} />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="truncate text-lg font-bold text-white">{result.title}</div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#b3b3b3]">
                                <span className="rounded-md bg-[#2a2a2a] px-2 py-0.5 text-xs font-bold text-white">{result.badge}</span>
                                <span className="truncate">{result.subtitle}</span>
                              </div>
                            </div>

                            {result.type === "track" && (
                              <span className="text-sm text-[#b3b3b3]">{formatDuration(result.duration)}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : searchTab === "playlists" ? (
                  <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {searchPlaylists.map((playlist) => (
                      <SpotifyCard
                        key={playlist.id}
                        title={playlist.snippet.title}
                        subtitle={`De ${playlist.snippet.channelTitle}`}
                        image={getThumbnailUrl(playlist.snippet.thumbnails)}
                        onClick={() => openPlaylistDetail(playlist, "search")}
                      />
                    ))}
                  </div>
                ) : searchTab === "tracks" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-[32px_4fr_3fr_90px] gap-4 px-4 py-2 border-b border-white/10 text-[#b3b3b3] text-sm font-medium uppercase tracking-wider">
                      <span>#</span>
                      <span>Titulo</span>
                      <span>Artista</span>
                      <div className="flex justify-end"><Clock size={16} /></div>
                    </div>

                    <div className="space-y-1">
                      {searchTracks.map((track, index) => {
                        const isCurrent = currentTrack?.id === track.id.videoId;

                        return (
                          <button
                            key={track.id.videoId}
                            type="button"
                            onClick={() => openTrackDetail(track, "search")}
                            className="grid w-full grid-cols-[32px_4fr_3fr_90px] items-center gap-4 rounded-lg px-4 py-2 text-left transition-colors hover:bg-white/10 cursor-pointer"
                          >
                            <span className={`text-sm ${isCurrent ? "text-[#1ed760]" : "text-[#b3b3b3]"}`}>{index + 1}</span>
                            <div className="flex min-w-0 items-center gap-3">
                              <img
                                src={getThumbnailUrl(track.snippet.thumbnails)}
                                alt={track.snippet.title}
                                className="h-12 w-12 rounded-md object-cover"
                              />
                              <div className="min-w-0">
                                <div className={`truncate font-medium ${isCurrent ? "text-[#1ed760]" : "text-white"}`}>{track.snippet.title}</div>
                                <div className="truncate text-xs text-[#b3b3b3]">Clique para abrir e tocar</div>
                              </div>
                            </div>
                            <span className="truncate text-sm text-[#b3b3b3]">{track.snippet.channelTitle}</span>
                            <div className="flex justify-end text-sm text-[#b3b3b3]">{formatDuration(track.duration)}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {searchArtists.map((artist) => (
                      <SpotifyCard
                        key={artist.id}
                        title={artist.snippet.title}
                        subtitle="Artista"
                        type="artist"
                        image={getThumbnailUrl(artist.snippet.thumbnails)}
                        onClick={() => openArtistDetail(artist, "search")}
                      />
                    ))}
                  </div>
                )}
              </section>
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
            ) : view === "track-detail" && selectedTrackItem ? (
              <div className="-m-6">
                <div className={`bg-linear-to-b ${randomColor} to-[#121212] p-6 pt-12 flex flex-col md:flex-row items-end gap-6`}>
                  <div className="w-48 h-48 md:w-60 md:h-60 shadow-2xl rounded-md overflow-hidden shrink-0 bg-[#282828]">
                    {getThumbnailUrl(selectedTrackItem.snippet.thumbnails) ? (
                      <img
                        src={getThumbnailUrl(selectedTrackItem.snippet.thumbnails)}
                        alt={selectedTrackItem.snippet.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <Music2 size={72} />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 pb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Musica</span>
                    <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter mb-2">{selectedTrackItem.snippet.title}</h1>
                    <div className="flex flex-wrap items-center gap-2 text-white/90 text-sm">
                      <span className="font-bold">{selectedTrackItem.snippet.channelTitle}</span>
                      <span>•</span>
                      <span>{formatDuration(selectedTrackItem.duration || videoDurations[selectedTrackItem.id.videoId])}</span>
                      {selectedTrackItem.snippet.publishedAt && (
                        <>
                          <span>•</span>
                          <span>
                            {new Date(selectedTrackItem.snippet.publishedAt).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-[#121212]/30 backdrop-blur-sm p-6 space-y-6 min-h-screen">
                  <div className="flex items-center gap-8">
                    <button
                      onClick={() => {
                        const selectedTrack = formatTrack(selectedTrackItem);
                        const nextQueue = buildQueueFromItems(relatedTracks, selectedTrackItem);

                        if (currentTrack?.id === selectedTrack.id) {
                          togglePlay();
                        } else {
                          playTrack(selectedTrack, nextQueue);
                        }
                      }}
                      className="bg-[#1ed760] p-4 rounded-full hover:scale-105 transition-transform text-black shadow-lg cursor-pointer"
                    >
                      {currentTrack?.id === selectedTrackItem.id.videoId && isPlaying ? (
                        <Pause fill="black" size={28} />
                      ) : (
                        <Play fill="black" size={28} />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => openArtistDetail({
                        id: selectedTrackItem.snippet.channelId || selectedTrackItem.id.videoId,
                        snippet: {
                          title: selectedTrackItem.snippet.channelTitle,
                          thumbnails: selectedTrackItem.snippet.thumbnails,
                          description: selectedTrackItem.snippet.description,
                          resourceId: {
                            channelId: selectedTrackItem.snippet.channelId || selectedTrackItem.id.videoId,
                          },
                        },
                      }, detailOrigin)}
                      className="border border-[#878787] text-white px-4 py-1 rounded-full text-sm font-bold hover:border-white transition-colors cursor-pointer"
                    >
                      Ver artista
                    </button>
                  </div>

                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4">Mais musicas do artista</h2>
                    <div className="space-y-1">
                      {loadingTracks ? (
                        Array(5).fill(0).map((_, i) => (
                          <div key={i} className="h-14 bg-[#181818] rounded-md animate-pulse" />
                        ))
                      ) : (
                        relatedTracks.map((item, i) => {
                          const track = formatTrack(item);
                          const isCurrent = currentTrack?.id === track.id;

                          return (
                            <button
                              key={item.id.videoId}
                              type="button"
                              data-track-id={track.id}
                              onClick={() => openTrackDetail(item, detailOrigin)}
                              className="flex w-full items-center justify-between rounded-md p-2 text-left transition-colors hover:bg-white/10 cursor-pointer"
                            >
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <span className={`w-4 text-center text-sm ${isCurrent ? "text-[#1ed760]" : "text-[#b3b3b3]"}`}>
                                  {i + 1}
                                </span>
                                <img src={track.image} alt="" className="w-10 h-10 rounded object-cover" />
                                <div className="flex flex-col min-w-0">
                                  <span className={`font-medium truncate ${isCurrent ? "text-[#1ed760]" : "text-white"}`}>
                                    {track.title}
                                  </span>
                                  <span className="text-[#b3b3b3] text-xs truncate">{track.artist}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-8">
                                <span className="text-[#b3b3b3] text-sm hidden md:block">Videoclipe</span>
                                <span className="text-[#b3b3b3] text-sm mr-4">{formatDuration(item.duration || videoDurations[item.id.videoId])}</span>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
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
                      onClick={() => openArtistDetail(sub, "artists")}
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
                      onClick={() => openPlaylistDetail(pl, "playlists")}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>
        )}

        {/* Video Sidebar */}
        <SidebarVideo
          isOpen={isVideoSidebarOpen}
          onClose={() => setIsVideoSidebarOpen(false)}
          isMaximized={isVideoMaximized}
          onToggleMaximize={() => setIsVideoMaximized((prev) => !prev)}
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
            const player = getReadyPlayer();
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
        isVideoMaximized={isVideoMaximized}
      />
    </>
  );
}
