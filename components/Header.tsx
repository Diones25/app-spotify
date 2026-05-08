import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

type Props = {
    setView: any;
}

export default function Header({ setView }: Props) {
    return (
        <header className="flex items-center justify-between p-4 sticky top-0 z-10 bg-[#121212]/50 backdrop-blur-md">
            <div className="flex items-center gap-2">
                <button onClick={() => setView("home")}
                    className="p-1 bg-black/40 rounded-full text-white/70 hover:text-white"
                >
                    <ChevronLeft className="cursor-pointer" size={24} />
                </button>
                <button className="p-1 bg-black/40 rounded-full text-white/70 hover:text-white">
                    <ChevronRight size={24} />
                </button>
            </div>
        </header>
    );
}