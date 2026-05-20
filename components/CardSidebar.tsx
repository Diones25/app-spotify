import { Music2 } from "lucide-react"; // Certifique-se de que o ícone está importado corretamente

interface PlaylistData {
  snippet?: {
    title?: string;
    channelTitle?: string;
    thumbnails?: {
      default?: {
        url?: string;
      };
    };
  };
}

interface CardSidebarProps {
  playlist: PlaylistData;
  onClick?: () => void; // Opcional, caso queira disparar uma ação ao clicar
}

export function CardSidebar({ playlist, onClick }: CardSidebarProps) {
  const thumbnailUrl = playlist.snippet?.thumbnails?.default?.url;
  const title = playlist.snippet?.title || "Sem título";
  const channelTitle = playlist.snippet?.channelTitle || "Canal desconhecido";

  return (
    <button
      onClick={onClick}
      className="cursor-pointer w-full flex items-center gap-3 p-2 hover:bg-[#1a1a1a] rounded-md transition-colors group text-left"
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-12 h-12 rounded object-cover"
        />
      ) : (
        <div className="w-12 h-12 bg-[#282828] rounded flex items-center justify-center">
          <Music2 size={24} />
        </div>
      )}
      
      <div className="flex flex-col overflow-hidden">
        <span className="text-white font-medium truncate">{title}</span>
        <span className="text-xs">Playlist • {channelTitle}</span>
      </div>
    </button>
  );
}