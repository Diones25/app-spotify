
import { useContext, useState } from "react";
import { TokenContext } from "../contexts/TokenContext";
import LogoIcon from "../../public/logo_icon.png";
import { useMe, useUserPlaylists } from "@/utils/queries";
import { Search } from "lucide-react";
import { Input } from "./ui/input";
import {
  Tabs,
  TabsContent,
} from "@/components/ui/tabs"
import { Button } from "./ui/button";

const Home = () => {
  const tokenCtx = useContext(TokenContext);
  // 1. Estado para rastrear a aba ativa.
  const [activeTab, setActiveTab] = useState("playlist");

  // Função para mudar a aba.
  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue);
  };

  const { data: me, isLoading, isError, error } = useMe(tokenCtx?.accessToken || '');
  const {
    data: userPlaylists,
    isLoading: isLoadingPlaylists,
    isError: isErrorPlaylists,
    error: errorPlaylists
  } = useUserPlaylists(tokenCtx?.accessToken || '', me?.id || '');

  if (isLoading) {
    return <div className="text-white">Carregando informações do usuário...</div>;
  }

  if (isError) {
    // Redireciona para a URL atual (causando uma recarga completa)
    window.location.href = window.location.href;
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
            
            {/* Tabs da biblioteca - Playlist, Artistas, Álbums */}
            <div className="flex w-full max-w-sm flex-col gap-6">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                
                {/* Tabs da biblioteca - Playlist, Artistas, Álbums */}
                <div className="">
                  <Button
                    className="bg-[#333333] hover:bg-[#333333]/70 rounded-full"
                    onClick={() => handleTabChange("playlist")}
                  >
                    Playlist
                  </Button>

                  <Button
                    className="bg-[#333333] hover:bg-[#333333]/70 rounded-full mx-2"
                    onClick={() => handleTabChange("artistas")}
                  >
                    Artistas
                  </Button>

                  <Button
                    className="bg-[#333333] hover:bg-[#333333]/70 rounded-full"
                    onClick={() => handleTabChange("albuns")}
                  >
                    Álbums
                  </Button>
                </div>
                {/* Fim -Tabs da biblioteca - Playlist, Artistas, Álbums */}

                <TabsContent value="playlist">
                  <h1>Playlist</h1>
                </TabsContent>
                <TabsContent value="artistas">
                  <h2>Artistas</h2>
                </TabsContent>
                <TabsContent value="albuns">
                  <h2>Álbuns</h2>
                </TabsContent>
              </Tabs>
            </div>
            {/* Fim -Tabs da biblioteca - Playlist, Artistas, Álbums */}
          </div>

          {/* Main Content */}
          <div className="bg-[#121212] rounded-lg overflow-hidden flex flex-col">
            <div className="p-4 flex-1 overflow-y-auto">
              <h1 className="text-white text-2xl font-bold">Home - Bem-vindo(a), {me?.display_name || 'usuário'}! seu id é: { me?.id}</h1>
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
