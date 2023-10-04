'use client';
import { signOut,useSession } from "next-auth/react";
import { useEffect ,useState} from "react";
import axios from "axios";
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import SpotifyLogin from "./components/SpotifyLogin";
import './firebase';
import addData from "./databaseFB/addData";
import getData from "./databaseFB/getData";
import Image from "next/image";

export default function Home() {
  const session = useSession();
  const [renderState, setRenderState] = useState(true);
  const [loadingP, setLoading] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [currentUser, setCurrentUser]=useState([]);
  const [ytPlaylist, setYTPlaylist]=useState('-1');

  const [dropdown, setDropdown] = useState(false);
  // const [options, setOptions]=useState([]);


  const [optionState, setOptionState] =useState('-1');
  const [showSpotifyLogin, setShowSpotifyLogin] = useState(false);


  useEffect(() => {
    async function fetchData(){
        setLoading(true);
        try{
          const { data } = await axios.get('/api/getYTPlaylists', {
            withCredentials: true,
            headers: {'Content-Type': 'application/json'}
          });
  
          
          setPlaylists(
            data.map((pl: any) => ({
              id: pl.id,
              title: pl.snippet.title,
            }))
          );
        } catch (error){
          alert("In order to continue, your YouTube account must have a channel. Please create a channel and return.")
        }
        
        setLoading(false);
  }

  async function fetchSelect(){
    const $select = document.querySelector('#yt-select');
    
      if(session?.status=="authenticated"){
      
      
      const { result, error } = await getData('playlists', session?.data?.user?.id as string );
    
    if (error) {
       console.log(error);
    } 
      if(result?.exists()){
        let data = result.data();
        const choice = data['ytPl'];
        setYTPlaylist(choice);


        // show spotify
        if (choice!='-1' && choice!='' && choice!=null && choice!=='undefined'){
          setShowSpotifyLogin(true);
        }else{
          setShowSpotifyLogin(false);
        }
      }  
    }
  }

  if (session.status === 'authenticated'){
    fetchData();
    fetchSelect();
  }
  
  }, [session.status]);

  
  const [users, loading, error] = useCollection(query(collection(db, 'users')));

  useEffect(()=>{
    async function docs(){
      if (session){
        if (session?.status=="authenticated"){
          const q = query(collection(db, 'users'), where('__name__', '==', session?.data?.user?.id as string));
          const querySnapshot = await getDocs(q);
          if(!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            if (data){
              const dataCpy = {...querySnapshot.docs[0].data()} as any;
              setCurrentUser(dataCpy);
            };
          }
          
        }
     }
     if (!session){
      console.log("user logged out")
      setCurrentUser([]);
     }

    };
    docs();
  },[session]);

  async function handleChange(e : any) {
    e.preventDefault();
    // console.log("Playlist Selected!!");
    e.target.blur();
    const selectedIndex = e.target.options.selectedIndex;
    const ytPlKey = e.target.options[selectedIndex].getAttribute('pl-id');
    const ytPlName = e.target.options[selectedIndex].value;
    const data = {
      "ytPl": ytPlKey
    }
    
    if(ytPlKey!='-1'&& ytPlKey!=''){
      setShowSpotifyLogin(true);
      setYTPlaylist(ytPlKey);

      const { result, error } = await addData('playlists',  session?.data?.user?.id, data)

      if (error) {
        return console.log("FBerror:",error)
      }

    }else{
      setShowSpotifyLogin(false);
      setYTPlaylist('');
      
      const { result, error } = await addData('playlists',  session?.data?.user?.id, data)

      if (error) {
        return console.log("FBerror:",error)
      }
    }
  }

  const toggleDropdown = () => {
    setDropdown(!dropdown);
  };
  
  function spotLogout() {
    window.localStorage.removeItem("authToken");
    window.localStorage.removeItem("spotify_access_token");
    window.localStorage.removeItem("spotify_refresh_token");
    window.localStorage.removeItem("token_expiry");
}

async function fullLogout(){
  await spotLogout();
  await signOut();
  window.location.href ='http://localhost:3000/';
}
  return (
    <div className="overflow-hidden bg-gradient-to-tr from-gray-800 to-black w-screen h-screen font-sans font-medium"> 
      <div className='relative w-screen h-screen'>
          <div className=' absolute top-0 -left-4 w-80 h-80 bg-green-400  filter opacity-30 blur-3xl rounded-lg animate-blob'></div>
          <div className='absolute -bottom-4 left-[68%] w-80 h-80 bg-green-600 opacity-30 filter blur-3xl rounded-lg animate-blob animation-delay-2000'></div>
          <div className='absolute -top-10 -right-6 w-64 h-64 bg-green-800 opacity-40 rounded-full filter blur-3xl animate-blob animation-delay-4000'></div>
      </div>
      {session.status ==='authenticated' ?
      <div>
      <div onClick={toggleDropdown} className="absolute top-8 right-8 w-20 h-20 rounded-full bg-gray-300 overflow-hidden justify-items-center">
        <Image src={currentUser['image' as any]} alt='' width={80} height={80} />
      </div>
      {dropdown && (
        <div className="dropdown-menu absolute top-[115px] right-10 h-12 w-32 rounded-md bg-neutral-200">
          <button className="h-12 w-32 rounded-md bg-neutral-200 hover:bg-green-200 text-lg text-slate-800 transition-colors" onClick={()=> fullLogout()}>Logout</button>
        </div>
      )}
      </div>
      :
        <div className="animate-pulse absolute top-8 right-8 w-20 h-20 rounded-full bg-gray-300 overflow-hidden justify-items-center"></div>
      }
      {session.status === 'authenticated' ?
      <div className=" absolute top-[12%] left-10  text-neutral-200 text-5xl drop-shadow-lg"> Hello, {currentUser['name' as any]}! </div>
      
      :<div></div>}
      
      {session.status==='authenticated' ?
      
      
      <div className={'h-[73%] w-3/4 absolute left-10 top-1/4 mt-4 rounded-tr-lg rounded-tl-lg bg-gradient-to-br from-green-700 to-neutral-200 shadow-lg'}>
      <div id="container" className='flex justify-center'>
          <div className="absolute left-10 top-5 text-slate-800 text-xl">To get started, choose a playlist from your YouTube Library:</div>
          <form>
              {loadingP ? 
              <div className="absolute left-1/4 top-[15%]">
                <div role="status" className="flex items-center justify-center">
                  <svg aria-hidden="true" className="w-8 h-8 mr-2 text-lg text-gray-200 animate-spin fill-slate-700" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                      <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                  </svg> Retrieving Playlists...
                  <span className="sr-only">Loading...</span>
                </div>
            </div>
              // <p className="absolute left-1/4 top-[15%]">Loading...</p> 
              :
              <label>
              <select id='yt-select'  size={1} onFocus={(e)=>{e.target.size = 5}} onBlur={(e)=>{e.target.size = 1}} value={ytPlaylist} onChange={handleChange}  className="z-[1000] accent-green-400 text-slate-800 text-xl w-2/3 h-12 absolute left-[15%] top-[15%]  focus:ring-2 focus:ring-green-600 focus:h-64 shadow-lg rounded-lg border-r-8 border-white pr-4">
                  <option key= '-1' pl-id='-1' value='-1' className="hover:bg-green-200 h-10 pb-2 checked:h-10 accent-green-400">---</option>
                  {playlists.map((pl: any) => (
                    <option className="text-xl hover:bg-green-200 h-10 pb-2 checked:h-10 accent-green-400" key={pl.id} pl-id={pl.id} value={pl.id}>{pl.title}</option>
                  ))}
                </select>
              </label>}
              
                <div id ='spotify-container' className={`${showSpotifyLogin ? "opacity-100 transition-opacity duration-300 delay-300" : "opacity-0"}`}>
                  <SpotifyLogin />
                </div>
              
          </form>
      </div>
      </div>
      :
      <div className={'h-[73%] w-3/4 absolute left-10 top-1/4 mt-4 rounded-tr-lg rounded-tl-lg bg-gradient-to-br from-green-700 to-neutral-200 shadow-lg'}>
           <div className="flex items-center justify-center text-lg">
            <div className="absolute top-[40%]">
                <div role="status" className="flex items-center justify-center text-xl">
                  <svg aria-hidden="true" className="w-16 h-16 mr-2 text-lg text-gray-200 animate-spin fill-slate-700" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                      <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                  </svg> Retrieving Data...
                  <span className="sr-only">Loading...</span>
                </div>
              </div>
            </div>
      </div>
      }
  </div>
  )
}