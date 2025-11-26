
import { useContext, useState } from "react";
import { TokenContext } from "../contexts/TokenContext";
import LogoIcon from "../../public/logo_icon.png";
import ImageNotFound from "../../public/image-not-found.jpg";
import { useMe, useUserArtists, useUserPlaylists } from "@/utils/queries";
import { Search } from "lucide-react";
import { Input } from "./ui/input";
import {
  Tabs,
  TabsContent,
} from "@/components/ui/tabs"
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

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

  const {
    data: userArtists,
    isLoading: isLoadingArtists,
    isError: isErrorArtists,
    error: errorArtists
  } = useUserArtists(tokenCtx?.accessToken || '');

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
      <div className="h-[90vh] bg-[#121212black pr-2 pl-2">
        <div className="grid grid-cols-[1fr_2fr_1fr] gap-2 h-full">
          {/* Left Sidebar */}
          <div className="bg-[#121212] rounded-lg overflow-hidden p-4 text-white">
            <h2 className="font-bold mb-4">Sua biblioteca</h2>
            
            {/* Tabs da biblioteca - Playlist, Artistas, Álbums */}
            <div className="flex flex-col gap-6">
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
                  <ScrollArea className="h-[76vh] w-full rounded-md ">
                    {/* Lista de Playlists */}
                    {userPlaylists?.items.map((playlist) => {
                      // 1. Acessa o array de imagens da playlist.
                      const images = playlist.images;

                      // 2. Encontra o objeto de imagem onde 'height' é 60.
                      // O 'find' retorna o primeiro objeto que satisfaz a condição.
                      const image60 = images?.find(image => image.height === 60);

                      // 3. Define a URL, priorizando a imagem de 60px.
                      // Se a imagem de 60px não for encontrada, use a primeira imagem como fallback (ou uma imagem padrão).
                      const imageUrl = image60?.url || images?.[0]?.url || ImageNotFound;

                      return (
                        <div
                          key={playlist.id} // É crucial usar uma 'key' única no elemento raiz do map
                          className="flex items-center hover:bg-[#1F1F1F] rounded-md p-2 mb-2 cursor-pointer"
                        >
                          <img
                            src={imageUrl}
                            alt={`Capa da playlist ${playlist.name}`}
                            className="w-14 h-14 rounded-md"
                          />
                          <div className="ml-3">
                            <p className="text-md text-white">{playlist.name}</p>
                            <span className="text-sm text-[#AEAEAE]">{playlist.owner.display_name}</span>
                          </div>
                        </div>
                      );
                    })}
                    {/* Fim - Lista de Playlists */}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="artistas">
                  {/* Lista de Artistas */}
                  {userArtists?.artists.items.map((artists) => {
                    // 1. Acessa o array de imagens da playlist.
                    const images = artists.images;

                    // 2. Encontra o objeto de imagem onde 'height' é 640.
                    // O 'find' retorna o primeiro objeto que satisfaz a condição.
                    const image640 = images?.find(image => image.height === 640);

                    // 3. Define a URL, priorizando a imagem de 640px.
                    // Se a imagem de 60px não for encontrada, use a primeira imagem como fallback (ou uma imagem padrão).
                    const imageUrl = image640?.url || images?.[0]?.url || ImageNotFound;

                    return (
                      <div
                        key={artists.id} // É crucial usar uma 'key' única no elemento raiz do map
                        className="flex items-center hover:bg-[#1F1F1F] rounded-md p-2 mb-2 cursor-pointer"
                      >
                        <img
                          src={imageUrl}
                          alt={`Capa da playlist ${artists.name}`}
                          className="w-14 h-14 rounded-full"
                        />
                        <div className="ml-3">
                          <p className="text-md text-white">{artists.name}</p>
                        </div>
                      </div>
                    );
                  })}
                  { /* Fim - Lista de Artistas */}
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
      
      <div className="bg-blue-500">
          ...
      </div>
    </>
    
  )
}

export default Home
