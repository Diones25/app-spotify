import { useEffect, useRef, useCallback } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CardSidebar } from "./CardSidebar";
import { CardArtistSidebar } from "./CardArtistSidebar";

interface SidebarProps {
  className?: string;
  playlists?: any[];
  subscriptions?: any[];
  activeFilter?: "all" | "playlists" | "artists";
  onFilterChange?: (filter: "all" | "playlists" | "artists") => void;
  onPlaylistClick?: (playlist: any) => void;
  onArtistClick?: (artist: any) => void;
  hasMorePlaylists?: boolean;
  hasMoreSubscriptions?: boolean;
  loadingMore?: boolean;
  onLoadMorePlaylists?: () => void;
  onLoadMoreSubscriptions?: () => void;
}

export function Sidebar({
  className,
  playlists = [],
  subscriptions = [],
  activeFilter = "all",
  onFilterChange,
  onPlaylistClick,
  onArtistClick,
  hasMorePlaylists = false,
  hasMoreSubscriptions = false,
  loadingMore = false,
  onLoadMorePlaylists,
  onLoadMoreSubscriptions,
}: SidebarProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const showPlaylists = activeFilter === "all" || activeFilter === "playlists";
  const showSubscriptions = activeFilter === "all" || activeFilter === "artists";
  const hasMore = (showPlaylists && hasMorePlaylists) || (showSubscriptions && hasMoreSubscriptions);
  const canLoadMore = hasMore && !loadingMore;

  const handleLoadMore = useCallback(() => {
    if (!canLoadMore) return;
    if (showPlaylists && hasMorePlaylists && onLoadMorePlaylists) {
      onLoadMorePlaylists();
    } else if (showSubscriptions && hasMoreSubscriptions && onLoadMoreSubscriptions) {
      onLoadMoreSubscriptions();
    }
  }, [canLoadMore, showPlaylists, hasMorePlaylists, showSubscriptions, hasMoreSubscriptions, onLoadMorePlaylists, onLoadMoreSubscriptions]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && canLoadMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [canLoadMore, handleLoadMore]);

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-black text-[#b3b3b3] pr-2 pl-2 gap-2", className)}>
      {/* Biblioteca */}
      <div className="bg-[#121212] rounded-lg flex-1 flex flex-col overflow-hidden">
        <div className="p-4 flex items-center justify-between shadow-md">
          <button className="flex items-center gap-2 text-white transition-colors font-bold">
            <span>Sua Biblioteca</span>
          </button>
          <button className="p-1 hover:bg-[#1a1a1a] rounded-full transition-colors">
            <Plus size={20} />
          </button>
        </div>

        {/* Filtros rápidos */}
        <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
          {activeFilter === "all" ? (
            <>
              <button
                onClick={() => onFilterChange?.("playlists")}
                className="bg-[#2a2a2a] text-white px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer hover:bg-[#3a3a3a] transition-colors"
              >
                Playlists
              </button>
              <button
                onClick={() => onFilterChange?.("artists")}
                className="bg-[#2a2a2a] text-white px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer hover:bg-[#3a3a3a] transition-colors"
              >
                Artistas
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={() => onFilterChange?.(activeFilter)}
                className="bg-[#F0F0F0] text-black px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                {activeFilter === "playlists" ? "Playlists" : "Artistas"}
              </button>
              <button
                onClick={() => onFilterChange?.("all")}
                className="p-1.5 hover:bg-[#2a2a2a] rounded-full transition-colors ml-auto cursor-pointer"
                title="Limpar filtro"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {showPlaylists &&
            playlists.map((playlist, i) => (
              <CardSidebar key={`pl-${i}`} playlist={playlist} onClick={() => onPlaylistClick?.(playlist)} />
            ))
          }

          {activeFilter === "all" &&
            subscriptions.map((sub, i) => (
              <CardArtistSidebar key={`sub-${i}`} subscription={sub} onClick={() => onArtistClick?.(sub)} />
            ))
          }

          {activeFilter === "artists" &&
            subscriptions.map((sub, i) => (
              <CardArtistSidebar key={`art-${i}`} subscription={sub} onClick={() => onArtistClick?.(sub)} />
            ))
          }

          {/* Sentinel para scroll infinito */}
          <div ref={sentinelRef} className="h-1" />

          {/* Botão Mostrar mais / Loading */}
          {canLoadMore && (
            <button
              onClick={handleLoadMore}
              className="w-full py-2 text-sm font-medium text-white bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-full transition-colors cursor-pointer"
            >
              Mostrar mais
            </button>
          )}

          {loadingMore && (
            <div className="flex items-center justify-center py-2">
              <Loader2 size={20} className="animate-spin text-[#b3b3b3]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
