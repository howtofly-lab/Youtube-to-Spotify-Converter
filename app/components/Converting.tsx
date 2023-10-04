'use client';
import { useSession } from "next-auth/react";
import { useEffect ,useState} from "react";
import axios from "axios";
import getData from '../databaseFB/getData';
import 'spotify-web-api-js';



var Spotify = require('spotify-web-api-js');
var s = new Spotify();

var pl_id = '';

export default function Converting() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const matches = [];

  useEffect(()=>{
    
    async function run(){
    setLoading(true);
    await fetchData();
    setLoading(false);
    await window.open(`https://open.spotify.com/playlist/${pl_id}`, '_blank');
    window.location.reload();
    }

    run();
    },[]);

  async function fetchData(){
    if (status === "authenticated") {
        
        const { data } = await axios.get('/api/getYTSongs', {
            withCredentials: true,
            headers: {'Content-Type': 'application/json'}
          }) || "";
        

        if (!data) return;
        let result = await data.map((song : any) => song.snippet.title);
        await searchSpotify(result);
        
        
      };
    }
  
  async function searchSpotify(names : any) {
    
    const cleanedSongs = names.map((name: string) => 
      name.toString().toLowerCase().replace(/official/g, '')
      .replace(/music/g, '')
      .replace(/video/g, '')
      .replace(/audio/g, '')
      .replace(/1080p/g, '')
      .replace(/mv/g, '')
      .replace(/hd/g, '')
      .replace(/4k/g, '')
      .replace(/performance/g,'')
      .replace(/version/g,'')
      .replace(/[-()]/g, '')
      .replace(/[^\w\s]|\d+/gi, '')
      .replace(/\s+/g, ' ').trim()
    );

    // console.log(cleanedSongs);

    await addTracks(cleanedSongs);
    
    
  }
   


  async function addTracks(songNames: any){

    if (status==="authenticated"){
        const temp = session?.user?.id;

        const { result, error } = await getData('playlists', session?.user?.id as string );
    
    
       
    if (error) {
       console.log(error);
    } 
      if(result?.exists()){
        let data = result.data();
        const playlistId = data['spotPl'];
        pl_id = playlistId;
    Promise.all(
        songNames.map((songName : any) => {
          return s.searchTracks(songName)
            .then((data: any) => {
              const tracks = data.tracks.items;
              if (tracks.length > 0) {
                const trackUri = tracks[0].uri;
                return s.addTracksToPlaylist(playlistId, [trackUri]);
              }
            });
        })
      )
        .then(() => {
          console.log('Songs added to playlist successfully');
          
        })
        .catch(error => {
          console.error('Error:', error);
        });
        
      }
    }
  }
  


  
  return (
    <div>
       {/* {loading ?
       <p>Loading...Currently converting your playlist. This may take few minutes. You will be redirected to your Spotify playlist when finished.</p>:
       <div></div>} */}
    </div>

  )
}
