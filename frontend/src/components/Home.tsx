
import { useContext } from "react";
import { TokenContext } from "../contexts/TokenContext";
import LogoIcon from "../../public/logo_icon.png";
import { useMe } from "@/utils/queries";
import { Search } from "lucide-react";
import { Input } from "./ui/input";

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
      <div className="bg-red-300 h-12 mt-2 mb-2 flex items-center justify-between">
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



      







      <h1 className="text-white">Home - Bem-vindo(a), {me?.display_name || 'usuário'}!</h1>
    </>
  )
}

export default Home
