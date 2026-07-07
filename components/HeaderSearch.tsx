import { Search, Home, X } from "lucide-react";
import SpotifySvg from "./SpotifySvg";
import Link from "next/link";

type HeaderSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onHomeClick?: () => void;
};

export default function HeaderSearch({ value, onChange, onSubmit, onHomeClick }: HeaderSearchProps) {
  return (
    <header className="bg-black flex h-16 justify-between items-center px-4 gap-4 shrink-0">
      {/* Lado Esquerdo - Ícone de Home ou Logo */}
      <div className="bg-[#1f1f1f] w-9 h-9 rounded-full flex items-center justify-center shrink-0">
        <Link href={"/me"}>
          <SpotifySvg />
        </Link>
      </div>

      {/* Centro - Barra de Busca */}
      <form
        className="flex"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="mr-2">
          <button
            type="button"
            onClick={onHomeClick}
            className="bg-[#1f1f1f] w-12 h-12 rounded-full flex items-center justify-center shrink-0 hover:bg-[#2a2a2a] transition-colors text-white"
          >
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
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="w-full h-12 rounded-full bg-[#1f1f1f] pl-12 pr-16 text-white text-sm border-none outline-none hover:bg-[#2a2a2a] focus:ring-2 focus:ring-white/10 transition-all placeholder:text-[#757575]"
          />

          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </form>

      {/* Lado Direito - Perfil/Notificações */}
      <div className="bg-[#1f1f1f] w-12 h-12 rounded-full flex items-center justify-center shrink-0">
        <div className="w-8 h-8 bg-indigo-500 rounded-full" />
      </div>
    </header>
  );
}
