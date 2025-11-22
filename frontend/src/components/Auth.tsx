import { useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"
import { TokenContext } from "../contexts/TokenContext";

const Auth = () => {
  const { token } = useParams();
  const tokenCtx = useContext(TokenContext);
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = token?.split('&')[0].replace('token=', '');

    if (accessToken) {
      const bearerToken = `Bearer ${accessToken}`;
      tokenCtx?.setToken(bearerToken);
      navigate('/');
    }
  }, [token, tokenCtx, navigate]);

  return (
    <>
      <div>Loading..</div>
    </>
  )
}

export default Auth
