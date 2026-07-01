import { Home, Search, Library, Plus, Heart, Music2, Users, Mic2, X } from "lucide-react";
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
}

export function Sidebar({
  className,
  playlists = [],
  subscriptions = [],
  activeFilter = "all",
  onFilterChange,
  onPlaylistClick,
  onArtistClick,
}: SidebarProps) {
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
                className={cn(
                  "text-white px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition-colors",
                  "bg-[#2a2a2a] hover:bg-[#3a3a3a]"
                )}
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
          {activeFilter === "all" && (
            <button className="w-full flex items-center gap-3 p-2 hover:bg-[#1a1a1a] rounded-md transition-colors group text-left">
              <div className="w-12 h-12 bg-linear-to-br from-indigo-700 to-blue-300 rounded flex items-center justify-center">
                <Heart size={24} className="text-white fill-white" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-white font-medium truncate">Músicas Curtidas</span>
                <span className="text-xs">Playlist • YouTube</span>
              </div>
            </button>
          )}

          {(activeFilter === "all" || activeFilter === "playlists") &&
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
        </div>
      </div>
    </div>
  );
}
