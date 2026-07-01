import { Music2 } from "lucide-react";

interface SubscriptionData {
  snippet?: {
    title?: string;
    thumbnails?: {
      default?: {
        url?: string;
      };
    };
  };
}

interface CardArtistSidebarProps {
  subscription: SubscriptionData;
  onClick?: () => void;
}

export function CardArtistSidebar({ subscription, onClick }: CardArtistSidebarProps) {
  const thumbnailUrl = subscription.snippet?.thumbnails?.default?.url;
  const title = subscription.snippet?.title || "Artista desconhecido";

  return (
    <button
      onClick={onClick}
      className="cursor-pointer w-full flex items-center gap-3 p-2 hover:bg-[#1a1a1a] rounded-md transition-colors group text-left"
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-12 h-12 rounded-full object-cover"
        />
      ) : (
        <div className="w-12 h-12 bg-[#282828] rounded-full flex items-center justify-center">
          <Music2 size={24} />
        </div>
      )}
      
      <div className="flex flex-col overflow-hidden">
        <span className="text-white font-medium truncate">{title}</span>
        <span className="text-xs">Canal • YouTube</span>
      </div>
    </button>
  );
}
