import axios from 'axios';
import { getSession } from 'next-auth/react';
import { getToken } from 'next-auth/jwt';

const secret = process.env.NEXTAUTH_SECRET;
let accessToken;

const getYTPlaylists = async (pageToken = '') => {
  try{
  const { data } = await axios.get(
    `https://youtube.googleapis.com/youtube/v3/playlists?mine=true&pageToken=${pageToken}&maxResults=50&part=snippet`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (data?.nextPageToken) {
    return data.items.concat(await getYTPlaylists(data.nextPageToken));
  }
  return data.items;
  } catch (error){
    console.error(error.response.data);
  }
};

const fetchYTPlaylists = async (req, res) => {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).end();
  }

  const token = await getToken({ req, secret, encryption: true });

  accessToken = token?.accessToken;
  const data = await getYTPlaylists();

  res.status(200).json(data);
};

export default fetchYTPlaylists;