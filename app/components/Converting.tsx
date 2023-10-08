"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import axios from "axios";
import addData from "../databaseFB/addData";
import getData from "../databaseFB/getData";
import "spotify-web-api-js";

var Spotify = require("spotify-web-api-js");
var s = new Spotify();

var pl_id = "";
var user_id = "";

export default function Converting() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const matches = [];
  var track_ids = [];

  useEffect(() => {
    async function run() {
      setLoading(true);
      await fetchData();
      setLoading(false);
      await window.open(`https://open.spotify.com/playlist/${pl_id}`, "_blank");
      window.location.reload();
    }

    run();
  }, []);

  async function fetchData() {
    if (status === "authenticated") {
      const { data } =
        (await axios.get("/api/getYTSongs", {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        })) || "";

      if (!data) return;
      let result = await data.map((song: any) => song.snippet.title);
      await searchSpotify(result);
    }
  }

  async function searchSpotify(names: any) {
    const cleanedSongs = names.map((name: string) =>
      name
        .toString()
        .toLowerCase()
        .replace(/official/g, "")
        .replace(/music/g, "")
        .replace(/video/g, "")
        .replace(/audio/g, "")
        .replace(/1080p/g, "")
        .replace(/mv/g, "")
        .replace(/hd/g, "")
        .replace(/4k/g, "")
        .replace(/performance/g, "")
        .replace(/version/g, "")
        .replace(/[-()]/g, "")
        .replace(/[^\w\s]|\d+/gi, "")
        .replace(/\s+/g, " ")
        .trim()
    );

    // console.log(cleanedSongs);

    await addTracks(cleanedSongs);
  }

  async function addTracks(songNames: any) {
    const access_token = localStorage.getItem("spotify_access_token");
    s.setAccessToken(access_token);
    s.getMe().then(
      async function (data: any) {
        // console.log("User ID:", data.id);
        const userId = {
          userId: data.id,
        };
        // add this data to the playlists collections in firebase
        const { result, error } = await addData(
          "playlists",
          session?.user?.id,
          userId
        );

        if (error) {
          return console.log("fberror:", error);
        }
      },
      function (err: any) {
        console.error(err);
      }
    );

    if (status === "authenticated") {
      // const temp = session?.user?.id;

      const choice = localStorage.getItem("currChoice");
      if (choice == "1") {
        const { result, error } = await getData(
          "playlists",
          session?.user?.id as string
        );

        if (error) {
          console.log(error);
        }

        if (result?.exists()) {
          let data = result.data();
          const userId = data["userId"];
          user_id = userId;
        }
        const plName = localStorage.getItem("plName");
        if (plName != null && plName !== "undefined") {
          var playlistDetails = {
            name: plName as string,
            public: false,
            collaborative: false,
            description: "Playlist for YouTube songs",
          };

          if (user_id != "") {
            s.createPlaylist(user_id, playlistDetails)
              .then(async (data: any) => {
                console.log("Created playlist!");

                const spotPl = {
                  spotPl: data.id,
                };

                const { result, error } = await addData(
                  "playlists",
                  session?.user?.id,
                  spotPl
                );

                if (error) {
                  return console.log("fberror:", error);
                }
              })
              .catch((error: any) => {
                console.error("Error:", error);
              });
          }
          const { result, error } = await getData(
            "playlists",
            session?.user?.id
          );

          if (error) {
            return console.log("fberror:", error);
          }
          if (result?.exists()) {
            console.log("exists2");
            let data = result.data();
            const playlistId = data["spotPl"];
            pl_id = playlistId;
          }
        }
      }

      const { result, error } = await getData(
        "playlists",
        session?.user?.id as string
      );

      if (error) {
        console.log(error);
      }
      if (result?.exists()) {
        let data = result.data();
        const playlistId = data["spotPl"];
        pl_id = playlistId;

        Promise.all(
          songNames.map((songName: any) => {
            return s.searchTracks(songName).then((data: any) => {
              const tracks = data.tracks.items;
              if (tracks.length > 0) {
                const trackUri = tracks[0].uri;

                return s.addTracksToPlaylist(playlistId, [trackUri]);
              }
            });
          })
        )
          .then(() => {
            console.log("Songs added to playlist successfully");
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      }
    }
  }

  return (
    <div>
    </div>
  );
}
