import { Search, Briefcase, Home } from "lucide-react";
import SpotifySvg from "./SpotifySvg";

export default function HeaderSearch() {
  return (
    <header className="bg-black flex h-16 justify-between items-center px-4 gap-4 shrink-0">
      {/* Lado Esquerdo - Ícone de Home ou Logo */}
      <div className="bg-[#1f1f1f] w-9 h-9 rounded-full flex items-center justify-center shrink-0">
        <SpotifySvg />
      </div>

      {/* Centro - Barra de Busca */}
      <div className="flex">
        <div className="mr-2">
          <button className="bg-[#1f1f1f] w-12 h-12 rounded-full flex items-center justify-center shrink-0 hover:bg-[#2a2a2a] transition-colors text-white">
            <Home size={24} />
          </button>
        </div>
        <div className="flex-1 max-w-2xl relative group w-md">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b3b3b3] group-focus-within:text-white transition-colors">
            <Search size={24} />
          </div>

          <input
            type="text"
            placeholder="O que você quer ouvir?"
            className="w-full h-12 rounded-full bg-[#1f1f1f] pl-12 pr-16 text-white text-sm border-none outline-none hover:bg-[#2a2a2a] focus:ring-2 focus:ring-white/10 transition-all placeholder:text-[#757575]"
          />
        </div>
      </div>

      {/* Lado Direito - Perfil/Notificações */}
      <div className="bg-[#1f1f1f] w-12 h-12 rounded-full flex items-center justify-center shrink-0">
        <div className="w-8 h-8 bg-indigo-500 rounded-full" />
      </div>
    </header>
  );
}
