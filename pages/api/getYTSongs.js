import axios from 'axios';
import { getSession } from 'next-auth/react';
import { getToken } from 'next-auth/jwt';
import { db } from '../../app/firebase';
import {doc, getDoc } from "firebase/firestore";

const secret = process.env.NEXTAUTH_SECRET;
let accessToken;
let playlistId;


const getYTSongs = async (pageToken = '') => {
  const { data } = await axios.get(
    `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet%2CcontentDetails&playlistId=${playlistId}&pageToken=${pageToken}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (data?.nextPageToken) {
    return data.items.concat(await getYTSongs(data.nextPageToken));
  }

  return data.items;
};

const fetchYTSongs = async (req, res) => {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).end();
  }

  const token = await getToken({ req, secret, encryption: true });

  
  accessToken = token?.accessToken;

  const userId = session.user.id;
  let docRef = doc(db, 'playlists', userId);

    let result = null;
    let error = null;

    try {
        result = await getDoc(docRef);
    } catch (e) {
        error = e;
    }
    
    if (error) {
       console.log(error);
    } 
      if(result.exists()){
        let data = result.data();
        playlistId = data['ytPl'];
      }
  const data = await getYTSongs();

  res.status(200).json(data);
};

export default fetchYTSongs;