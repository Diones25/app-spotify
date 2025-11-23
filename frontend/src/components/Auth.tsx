import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom"
import { TokenContext } from "../contexts/TokenContext";

const Auth = () => {
  const tokenCtx = useContext(TokenContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Usa URLSearchParams para ler os tokens da query string da URL
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken && tokenCtx) {
      // Salva ambos os tokens usando a nova função do contexto
      tokenCtx.setTokens(accessToken, refreshToken);
      navigate('/');
    }
  }, [tokenCtx, navigate]);

  return (
    <>
      <div>Loading..</div>
    </>
  )
}

export default Auth
