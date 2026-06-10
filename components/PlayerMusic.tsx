import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faPause, faStepForward, faStepBackward, faVolumeHigh, faShuffle, faRepeat, faVideo } from '@fortawesome/free-solid-svg-icons'

interface PlayerMusicProps {
  currentTrack: {
    title: string;
    artist: string;
    image: string;
  } | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  progress: number;
  duration: number;
  onSeek: (value: number) => void;
  volume: number;
  onVolumeChange: (value: number) => void;
  isRepeat: boolean;
  onToggleRepeat: () => void;
  isVideoSidebarOpen: boolean;
  onToggleVideoSidebar: () => void;
  hasVideo: boolean;
}

export default function PlayerMusic({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrevious,
  progress,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  isRepeat,
  onToggleRepeat,
  isVideoSidebarOpen,
  onToggleVideoSidebar,
  hasVideo
}: PlayerMusicProps) {
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/5 px-4 h-24 flex items-center justify-between z-50">
      {/* Informações da Música */}
      <div className="flex items-center gap-4 w-[30%]">
        {currentTrack ? (
          <>
            <img src={currentTrack.image} alt="" className="w-14 h-14 rounded shadow-lg" />
            <div className="flex flex-col min-w-0">
              <span className="text-white text-sm font-medium truncate hover:underline cursor-pointer">
                {currentTrack.title}
              </span>
              <span className="text-[#b3b3b3] text-xs truncate hover:underline cursor-pointer">
                {currentTrack.artist}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#282828] rounded shadow-lg" />
            <div className="flex flex-col gap-2">
              <div className="w-24 h-3 bg-[#282828] rounded" />
              <div className="w-16 h-2 bg-[#282828] rounded" />
            </div>
          </div>
        )}
      </div>

      {/* Controles de Reprodução */}
      <div className="flex flex-col items-center max-w-[40%] w-full gap-2">
        <div className="flex items-center gap-6">
          <button
            onClick={onToggleVideoSidebar}
            disabled={!hasVideo}
            className={`${isVideoSidebarOpen ? 'text-[#1ed760]' : hasVideo ? 'text-[#b3b3b3]' : 'text-[#535353]'} hover:[#1ed760] transition-colors disabled:cursor-not-allowed cursor-pointer`}
            title={hasVideo ? (isVideoSidebarOpen ? 'Fechar vídeo' : 'Abrir vídeo') : 'Vídeo indisponível'}
          >
            <FontAwesomeIcon icon={faVideo} className="text-[18px]" />
          </button>
          <button 
            onClick={onPrevious}
            className="text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
          >
            <FontAwesomeIcon icon={faStepBackward} className="text-xl" />
          </button>
          <button 
            onClick={onTogglePlay}
            className="bg-white w-8 h-8 flex items-center justify-center rounded-full hover:scale-105 transition-transform cursor-pointer"
          >
            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-black text-sm" />
          </button>
          <button 
            onClick={onNext}
            className="text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
          >
            <FontAwesomeIcon icon={faStepForward} className="text-xl" />
          </button>
          <button
            onClick={onToggleRepeat}
            className={`${isRepeat ? 'text-[#1ed760]' : 'text-[#b3b3b3]'} hover:text-white transition-colors relative cursor-pointer`}
            title={isRepeat ? 'Desativar repetição' : 'Ativar repetição'}
          >
            <FontAwesomeIcon icon={faRepeat} className="text-[18px]" />
            {isRepeat && (
              <span className="absolute top-1.25 right-2 text-[8px] font-bold text-[#1ed760]">
                1
              </span>
            )}
          </button>
        </div>

        {/* Barra de Progresso */}
        <div className="flex items-center gap-2 w-full max-w-md">
          <span className="text-[#b3b3b3] text-[10px] min-w-7.5 text-right">
            {formatTime(progress * duration)}
          </span>
          <div className="relative flex-1 h-1 group cursor-pointer">
            <input 
              type="range"
              min={0}
              max={0.999999}
              step="any"
              value={progress}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
            />
            <div className="absolute inset-0 bg-[#4d4d4d] rounded-full overflow-hidden">
              <div 
                className="h-full bg-white group-hover:bg-[#1ed760] transition-colors" 
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
          <span className="text-[#b3b3b3] text-[10px] min-w-7.5`">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Outros Controles (Volume, etc) */}
      <div className="flex items-center justify-end gap-3 w-[30%]">
        <button className="text-[#b3b3b3] hover:text-white transition-colors">
          <FontAwesomeIcon icon={faVolumeHigh} className="text-sm" />
        </button>
        <div className="relative w-24 h-1 bg-[#4d4d4d] rounded-full group cursor-pointer">
          <input
            type="range"
            min={0}
            max={1}
            step="any"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
          />
          <div
            className="h-full bg-white group-hover:bg-[#1ed760] transition-colors rounded-full"
            style={{ width: `${volume * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
