
import { Link } from 'react-router-dom';
import iconSpofity from '../assets/spotify.svg';

const Login = () => {
  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-green-100">
        
        <div className='flex justify-center flex-col'>

          <div className='flex items-center justify-center mb-8'>
            <img src={iconSpofity} className='h-[60px] mr-3' alt="icone spotify" />
            <span className='text-5xl font-bold text-[#10BC4C]'>Spotify</span>
          </div>

          <Link to={"http://localhost:8888/login"} className="bg-green-400 text-center text-white text-lg rounded-full py-3 font-semibold">
            Login com Spotify
          </Link>
        </div>
      </div>
    </>
  )
}

export default Login
