
import { useContext, useEffect, useState } from "react";
import { TokenContext } from "../contexts/TokenContext";
import { requester } from "../utils/api";
import type { UserProfile } from "@/types/UserProfile";
import LogoIcon from "../../public/logo_icon.png";

const Home = () => {
  const tokenCtx = useContext(TokenContext);
  const [me, setMe] = useState<UserProfile>();

  useEffect(() => {
    // Captura os tokens da URL na primeira renderização
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlRefreshToken = params.get('refresh_token');

    if (urlToken && urlRefreshToken && tokenCtx) {
      tokenCtx.setTokens(urlToken, urlRefreshToken);
      // Limpa a URL para não exibir os tokens
      window.history.replaceState({}, document.title, "/");
    }

    const fetchUserData = async () => {
      // Usa o accessToken do contexto
      if (tokenCtx?.accessToken) {
        try {
          const { data } = await requester({
            Authorization: `Bearer ${tokenCtx.accessToken}`
          }).get("/me");
          setMe(data);
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
        }
      }
    };

    fetchUserData();
  }, [tokenCtx]);

  return (
    <>
      <div className="bg-red-300 h-12 mt-2 mb-2 flex items-center">
        <div>
          <img src={LogoIcon} alt="" className="w-12" />
        </div>
      </div>











      <h1 className="text-white">Home - Bem-vindo(a), {me?.display_name || 'usuário'}!</h1>
    </>
  )
}

export default Home
