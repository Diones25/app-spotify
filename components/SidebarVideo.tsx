"use client"

import { X, Maximize2, ThumbsUp, Share2, ListMusic } from "lucide-react";
import { RefObject } from "react";

interface VideoDetails {
  title: string;
  channelTitle: string;
  description: string;
  viewCount: string;
  likeCount: string;
  publishedAt: string;
}

interface SidebarVideoProps {
  isOpen: boolean;
  onClose: () => void;
  videoDetails: VideoDetails | null;
  currentTrack: {
    title: string;
    artist: string;
    image: string;
  } | null;
  playlistName?: string;
  loading?: boolean;
  playerContainerRef: RefObject<HTMLDivElement | null>;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SidebarVideo({
  isOpen,
  onClose,
  videoDetails,
  currentTrack,
  playlistName,
  loading,
  playerContainerRef,
  currentTime,
  duration,
  onSeek,
}: SidebarVideoProps) {
  const progress = duration > 0 ? currentTime / duration : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    onSeek(pct * duration);
  };

  return (
    <aside
      className={`${
        isOpen ? "" : "fixed -left-[9999px]"
      } w-105 pt-2 ml-2 rounded-lg shrink-0 bg-[#121212] border-l border-white/10 flex flex-col h-full overflow-hidden`}
    >
      {/* Header */}
      {isOpen && (
        <div className="flex items-center justify-between px-4 h-14 shrink-0 mb-2">
          <h2 className="text-white font-bold text-base">{playlistName}</h2>
          <div className="flex items-center gap-2">
            <button className="text-[#b3b3b3] hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10">
              <Maximize2 size={16} />
            </button>
            <button
              onClick={onClose}
              className="text-[#b3b3b3] hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Player de Vídeo - container do player único */}
      <div className="flex items-center justify-center px-4">
        <div
          ref={playerContainerRef}
          className="relative w-full aspect-video bg-black rounded-lg overflow-hidden"
        />
      </div>

      {/* Progress Bar e Timer */}
      {isOpen && (
        <>
          <div className="flex items-center gap-2 px-6 pt-2 pb-1">
            <span className="text-[#b3b3b3] text-xs tabular-nums min-w-8 text-right">
              {formatTime(currentTime)}
            </span>
            <div
              className="flex-1 h-1 bg-[#4d4d4d] rounded-full cursor-pointer group relative"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-white rounded-full group-hover:bg-green-500 transition-colors"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <span className="text-[#b3b3b3] text-xs tabular-nums min-w-8">
              {formatTime(duration)}
            </span>
          </div>

          {/* Informações da Música */}
          <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-5 bg-[#282828] rounded w-3/4" />
                <div className="h-4 bg-[#282828] rounded w-1/2" />
                <div className="h-3 bg-[#282828] rounded w-1/3" />
                <div className="h-20 bg-[#282828] rounded w-full mt-4" />
              </div>
            ) : videoDetails ? (
              <>
                {/* Título e Artista */}
                <div className="flex items-start gap-3">
                  <img
                    src={currentTrack?.image || ""}
                    alt=""
                    className="w-12 h-12 rounded object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white font-bold text-base truncate">
                      {videoDetails.title}
                    </h3>
                    <p className="text-[#b3b3b3] text-sm truncate hover:underline cursor-pointer">
                      {videoDetails.channelTitle}
                    </p>
                  </div>
                </div>

                {/* Playlist name if available */}
                {playlistName && (
                  <div className="flex items-center gap-2 text-[#b3b3b3] text-sm">
                    <ListMusic size={16} />
                    <span className="truncate">{playlistName}</span>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-[#b3b3b3] text-xs">
                  <span>{videoDetails.viewCount} visualizações</span>
                  <span>•</span>
                  <span>{videoDetails.likeCount} curtidas</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold px-4 py-1.5 rounded-full transition-colors">
                    <ThumbsUp size={16} />
                    Curtir
                  </button>
                  <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold px-4 py-1.5 rounded-full transition-colors">
                    <Share2 size={16} />
                    Compartilhar
                  </button>
                </div>

                {/* Description */}
                <div className="pt-2">
                  <p className="text-[#b3b3b3] text-xs leading-relaxed line-clamp-4">
                    {videoDetails.description}
                  </p>
                </div>

                {/* Published date */}
                <p className="text-[#b3b3b3] text-xs">
                  Publicado em {new Date(videoDetails.publishedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </>
            ) : (
              <p className="text-[#b3b3b3] text-sm">Nenhum detalhe disponível</p>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
