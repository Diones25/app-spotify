import { Play } from "lucide-react";

interface CardProps {
  title: string;
  subtitle: string;
  image?: string;
  type?: "artist" | "playlist";
  onClick?: () => void;
}

export function SpotifyCard({ title, subtitle, image, type = "playlist", onClick }: CardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-[#181818] p-4 rounded-lg hover:bg-[#282828] transition-all duration-300 group cursor-pointer relative"
    >
      <div className="relative mb-4 aspect-square">
        {image ? (
          <img 
            src={image} 
            alt={title} 
            className={`w-full h-full object-cover shadow-lg ${type === 'artist' ? 'rounded-full' : 'rounded-md'}`} 
          />
        ) : (
          <div className={`w-full h-full bg-[#333] flex items-center justify-center shadow-lg ${type === 'artist' ? 'rounded-full' : 'rounded-md'}`}>
            <span className="text-4xl text-[#b3b3b3]">{title[0]}</span>
          </div>
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-300 translate-y-0">
          <button className="bg-[#1ed760] p-3 rounded-full shadow-xl hover:scale-105 active:scale-95 text-black">
            <Play fill="black" size={24} className="cursor-pointer" />
          </button>
        </div>
      </div>
      
      <div className="min-h-15.5">
        <h3 className="text-white font-bold truncate mb-1">{title}</h3>
        <p className="text-[#b3b3b3] text-sm line-clamp-2">{subtitle}</p>
      </div>
    </div>
  );
}
