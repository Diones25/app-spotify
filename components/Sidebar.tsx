import { Home, Search, Library, Plus, Heart, Music2, Users, Mic2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
  playlists?: any[];
}

export function Sidebar({ className, playlists = [] }: SidebarProps) {
  return (
    <div className={cn("flex flex-col h-full bg-black text-[#b3b3b3] p-2 gap-2", className)}>
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
          <span className="bg-[#2a2a2a] text-white px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap">Playlists</span>
          <span className="bg-[#2a2a2a] text-white px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap">Artistas</span>
        </div>

        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <button className="w-full flex items-center gap-3 p-2 hover:bg-[#1a1a1a] rounded-md transition-colors group text-left">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-700 to-blue-300 rounded flex items-center justify-center">
              <Heart size={24} className="text-white fill-white" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-white font-medium truncate">Músicas Curtidas</span>
              <span className="text-xs">Playlist • YouTube</span>
            </div>
          </button>

          {playlists.map((playlist, i) => (
            <button key={i} className="w-full flex items-center gap-3 p-2 hover:bg-[#1a1a1a] rounded-md transition-colors group text-left">
              {playlist.snippet?.thumbnails?.default?.url ? (
                <img src={playlist.snippet.thumbnails.default.url} alt="" className="w-12 h-12 rounded object-cover" />
              ) : (
                <div className="w-12 h-12 bg-[#282828] rounded flex items-center justify-center">
                  <Music2 size={24} />
                </div>
              )}
              <div className="flex flex-col overflow-hidden">
                <span className="text-white font-medium truncate">{playlist.snippet?.title}</span>
                <span className="text-xs">Playlist • {playlist.snippet?.channelTitle}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
