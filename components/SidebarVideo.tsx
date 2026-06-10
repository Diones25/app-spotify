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
  videoId: string;
  startTime: number;
  videoDetails: VideoDetails | null;
  currentTrack: {
    title: string;
    artist: string;
    image: string;
  } | null;
  playlistName?: string;
  loading?: boolean;
  videoContainerRef: RefObject<HTMLDivElement | null>;
}

export default function SidebarVideo({
  isOpen,
  onClose,
  videoId,
  startTime,
  videoDetails,
  currentTrack,
  playlistName,
  loading,
  videoContainerRef
}: SidebarVideoProps) {
  if (!isOpen) return null;

  return (
    <aside className="w-105 ml-2 rounded-lg shrink-0 bg-[#121212] border-l border-white/10 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 shrink-0">
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

      {/* Player de Vídeo - container para YT.Player API */}
      <div className="flex items-center justify-center">
        <div
          ref={videoContainerRef}
          className="relative w-97.5 h-55 rounded-lg p-4 aspect-video bg-black shrink-0"
        />
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
    </aside>
  );
}
