
import { Link } from 'react-router-dom';
import Logo from "../../public/logo.png";
import { Button } from './ui/button';

const Login = () => {
  return (
    <div
      className="relative flex justify-center items-center w-screen h-screen"
      style={{
        backgroundImage: "url('/thumb-spotify.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to top, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0.3))',
        }}
      ></div>
      <div className="relative z-10 w-xl flex flex-col items-center">
        <img src={Logo} alt="Logo Spotify" className="w-90" />
        <div className="text-center my-3">
          <h2 className="text-white text-6xl">Milhões de músicas</h2>
          <h2 className="text-white text-6xl">grátis no Spotify</h2>
        </div>
        <Link to={"http://localhost:8888/login"} className="w-full">
          <Button className="mt-5 cursor-pointer bg-[#57e453] hover:bg-[#57e453] text-black w-full h-[60px] rounded-full text-2xl">
            Login com Spotify
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default Login