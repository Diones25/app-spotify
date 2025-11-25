
import { useContext } from "react";
import { TokenContext } from "../contexts/TokenContext";
import LogoIcon from "../../public/logo_icon.png";
import { useMe } from "@/utils/queries";
import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

const Home = () => {
  const tokenCtx = useContext(TokenContext);

  const { data: me, isLoading, isError, error } = useMe(tokenCtx?.accessToken || '');

  if (isLoading) {
    return <div className="text-white">Carregando informações do usuário...</div>;
  }

  if (isError) {
    return <div className="text-white">Erro ao buscar dados: {error.message}</div>;
  }

  return (

    <>
      <div className="h-12 mt-2 mb-2 mx-2 flex items-center justify-between rounded">
        <div>
          <img src={LogoIcon} alt="" className="w-12" />
        </div>

        <div className="flex items-center">
          <div>
            <img src={LogoIcon} alt="" className="w-12" />
          </div>

          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="O que você quer ouvir?"
              className="pl-10 w-[472px] h-12 bg-[#1F1F1F] border-none text-white placeholder:text-gray-400 font-semibold rounded-full"
            />
          </div>
        </div>

        <div>
          <img src={LogoIcon} alt="" className="w-12" />
        </div>
      </div>
      <div className="h-screen bg-black pr-2 pl-2">
        <div className="grid grid-cols-[1fr_2fr_1fr] gap-2 h-full">
          {/* Left Sidebar */}
          <div className="bg-[#121212] rounded-lg overflow-hidden p-4 text-white">
            <h2 className="font-bold mb-4">Sua biblioteca</h2>
            {/* Placeholder for Library content */}
            <div className="">
              <Button className="bg-[#333333] hover:bg-[#333333]/70 rounded-full">Playlist</Button>
              <Button className="bg-[#333333] hover:bg-[#333333]/70 rounded-full mx-2">Artistas</Button>
              <Button className="bg-[#333333] hover:bg-[#333333]/70 rounded-full">Álbums</Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-[#121212] rounded-lg overflow-hidden flex flex-col">
            <div className="p-4 flex-1 overflow-y-auto">
              <h1 className="text-white text-2xl font-bold">Home - Bem-vindo(a), {me?.display_name || 'usuário'}!</h1>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="bg-[#121212] rounded-lg overflow-hidden p-4 text-white">
            <h2 className="font-bold mb-4">Friend Activity</h2>
            {/* Placeholder for Friend Activity */}
            <div className="text-gray-400 text-sm">Friend activity goes here</div>
          </div>
        </div>
      </div>

    </>
    
  )
}

export default Home
