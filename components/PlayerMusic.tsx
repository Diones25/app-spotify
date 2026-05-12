import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faPause, faStepForward, faStepBackward } from '@fortawesome/free-solid-svg-icons'

export default function PlayerMusic() {
  return (
    <div className="bg-black">
      <div className='flex flex-col items-center pb-4'>
        <div className="flex items-center justify-center my-4">
          <FontAwesomeIcon icon={faStepBackward} className="text-[#4d4d4d] text-lg mr-5" />
          {/* <div className="bg-[#4d4d4d] w-9 h-9 flex items-center justify-center rounded-full">
          <FontAwesomeIcon icon={faPlay} />
        </div> */}
          <div className="bg-[#4d4d4d] w-9 h-9 flex items-center justify-center rounded-full">
            <FontAwesomeIcon icon={faPause} />
          </div>
          <FontAwesomeIcon icon={faStepForward} className="text-[#4d4d4d] text-lg ml-5" />
        </div>
        <div className='w-151 h-1 bg-[#4d4d4d] rounded'></div>
      </div>
    </div>
  );
}