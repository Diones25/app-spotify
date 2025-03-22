import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom"
import { TokenContext } from "../contexts/TokenContext";
import { requester } from "../utils/api";


const Auth = () => {
  const { token } = useParams();
  const Token = token?.replace('token=', 'Bearer ');
  const tokenCtx = useContext(TokenContext);
  const [me, setMe] = useState([]);

  console.log(token?.replace('token=', ''))

  useEffect(() => {
    if (Token) {
      tokenCtx?.setToken(Token);
    }
  }, [token]);

  useEffect(() => {
    (async() => {
      const { data } = await requester({
        Authorization: Token
      }).get("/me")
      setMe(data);
    })
    console.log(me)
  }, []);

  return (
    <>
      <div>Loading..</div>
    </>
  )
}

export default Auth
