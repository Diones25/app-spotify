"use client"

import { X, Maximize2, Minimize2 } from "lucide-react";
import { RefObject } from "react";

interface VideoDetails {
  title: string;
  channelTitle: string;
  channelId: string;
  description: string;
  viewCount: string;
  likeCount: string;
  publishedAt: string;
}

interface ChannelDetails {
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: string;
  videoCount: string;
}

interface SidebarVideoProps {
  isOpen: boolean;
  onClose: () => void;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  videoDetails: VideoDetails | null;
  channelDetails: ChannelDetails | null;
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
  isMaximized,
  onToggleMaximize,
  videoDetails,
  channelDetails,
  currentTrack,
  playlistName,
  loading,
  playerContainerRef,
  currentTime,
  duration,
  onSeek,
}: SidebarVideoProps) {
  const progress = duration > 0 ? currentTime / duration : 0;
  const playerStyle = isMaximized
    ? {
      aspectRatio: "16 / 9",
      width: "min(100%, calc((100dvh - 17rem) * 16 / 9))",
    }
    : {
      aspectRatio: "16 / 9",
      width: "100%",
    };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    onSeek(pct * duration);
  };

  return (
    <aside
      className={`${isOpen ? "" : "fixed -left-2499.75"
        } ${isMaximized ? "flex-1 w-full" : "w-105"} pt-2 ml-2 rounded-lg shrink-0 bg-[#121212] border-l border-white/10 flex flex-col h-full overflow-y-auto custom-scrollbar`}
    >
      {/* Header */}
      {isOpen && (
        <div className="flex items-center justify-between px-4 h-14 shrink-0 mb-2">
          <h2 className="text-white font-bold text-base">{playlistName}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleMaximize}
              className="text-[#b3b3b3] hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10 cursor-pointer"
            >
              {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {isMaximized ? "" :
              <button
                onClick={onClose}
                className="text-[#b3b3b3] hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10 cursor-pointer"
              >
                <X size={20} />
              </button>
            }
            
          </div>
        </div>
      )}

      {/* Player de Vídeo - container do player único */}
      <div className="flex items-center justify-center px-4">
        <div
          className="relative mx-auto max-w-full bg-black rounded-lg overflow-hidden"
          style={playerStyle}
        >
          <div
            ref={playerContainerRef}
            className="absolute inset-0 h-full w-full [&_iframe]:h-full [&_iframe]:w-full"
          />
        </div>
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
          <div className="p-4 space-y-4 flex-1">
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
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white font-bold text-base truncate">
                      {videoDetails.title}
                    </h3>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-[#b3b3b3] text-sm">Nenhum detalhe disponível</p>
            )}
          </div>

          <div className="bg-[#1F1F1F] mb-27.5 mt-2 mx-4 rounded-md">
            <div className="">

              {channelDetails ? (
                <>
                  <div className="relative w-full">
                    <img
                      src={channelDetails.thumbnail}
                      alt={channelDetails.title}
                      className="w-full h-65 object-cover rounded-t-md"
                    />

                    <span className="absolute top-3 left-3 text-white text-md font-bold">Sobre o artista</span>
                  </div>

                  <div className="p-4 ">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-bold text-lg">{channelDetails.title}</h4>
                        <svg className="w-4 h-4 text-[#3d91f4] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      </div>
                    </div>
                    {videoDetails ? (
                      <>
                        <p className="text-[#b3b3b3] text-sm">{videoDetails.viewCount} ouvintes mensais</p>


                        <div className="pt-2">
                          <p className="text-[#b3b3b3] text-xs leading-relaxed line-clamp-4">
                            {videoDetails.description}
                          </p>
                        </div>


                        <p className="text-[#b3b3b3] text-xs">
                          Publicado em {new Date(videoDetails.publishedAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </>
                    ) : (
                      <p className="text-[#b3b3b3] text-sm">Nenhum detalhe videoDetails disponível</p>
                    )}

                  </div>
                </>
              ) : (
                <p className="text-[#b3b3b3] text-sm">Nenhum detalhe channelDetails disponível</p>
              )}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
