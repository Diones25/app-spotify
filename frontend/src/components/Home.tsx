
import { useContext, useEffect, useState } from "react";
import { TokenContext } from "../contexts/TokenContext";
import { requester } from "../utils/api";
import type { UserProfile } from "@/types/UserProfile";
import LogoIcon from "../../public/logo_icon.png";

const Home = () => {
  const tokenCtx = useContext(TokenContext);
  const [me, setMe] = useState<UserProfile>();

  useEffect(() => {
    const fetchUserData = async () => {
      if (tokenCtx?.token) {
        try {
          const { data } = await requester({
            Authorization: tokenCtx.token
          }).get("/me");
          setMe(data);
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
        }
      }
    };

    fetchUserData();
  }, [tokenCtx?.token]);

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
