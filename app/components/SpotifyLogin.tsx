"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Converting from "./Converting";

import addData from "../databaseFB/addData";
import { useSession } from "next-auth/react";
var Spotify = require("spotify-web-api-js");
var s = new Spotify();

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

export default function SpotifyLogin() {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET!;
  const redirectUrl = "http://localhost:3000";
  const scopes =
    "playlist-modify-private+playlist-modify-public+playlist-read-private+playlist-read-collaborative";
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${process.env.SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${redirectUrl}&scope=${scopes}`;

  const session = useSession();
  const [authToken, setAuthToken] = useState("");
  const [tokenInfo, setTokenInfo] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [tokenExpiresAt, setTokenExpiresAt] = useState("");

  const [choice, setChoice] = useState("");

  const [input, setInput] = useState("");
  const [plName, setPlName] = useState(input);

  const [plId, setPlId] = useState("");

  const [spotifyPlaylists, setSpotifyPlaylists] = useState([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);

  const [selected, setSelected] = useState(true);

  const [convert, setConvert] = useState(false);
  useEffect(() => {
    const currentLink = document.location.search;
    let authToken = window.localStorage.getItem("authToken");
    let accessToken = window.localStorage.getItem("spotify_access_token");
    let refreshToken = window.localStorage.getItem("spotify_access_token");
    let tokenExpiresAt = window.localStorage.getItem("token_expiry");

    if (
      (accessToken == "undefined" ||
        accessToken === "undefined" ||
        accessToken == null) &&
      (refreshToken == "undefined" ||
        refreshToken === "undefined" ||
        refreshToken == null)
    ) {
      if ((authToken === "undefined" || authToken == null) && currentLink) {
        let url = new URLSearchParams(currentLink);
        authToken = url.get("code") as string;

        // change link back  to localhost, remove code portion
        // window.location.replace('http://localhost:3000/');
        // window.location.href ='http://localhost:3000/';
        window.localStorage.setItem("authToken", authToken);
      }

      fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + btoa(clientId + ":" + clientSecret),
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: authToken as string,
          redirect_uri: redirectUrl as string,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          // store access and refresh tokens in state or local storage
          // console.log("spotdata: ", data);
          const access_token = data["access_token"];
          const refresh_token = data["refresh_token"];

          localStorage.setItem("spotify_access_token", access_token);
          localStorage.setItem("spotify_refresh_token", refresh_token);

          const expiresDate = addSeconds(data["expires_in"]);

          localStorage.setItem("token_expiry", expiresDate);
        });
    }
    setAuthToken(authToken as string);
    setAccessToken(accessToken as string);
    setRefreshToken(refreshToken as string);
    setTokenExpiresAt(tokenExpiresAt as string);

    if (
      (accessToken != "undefined" || accessToken !== "undefined") &&
      (refreshToken != "undefined" || refreshToken !== "undefined")
    ) {
      const now = new Date();
      if (tokenExpiresAt != "undefined" || tokenExpiresAt !== "undefined") {
        if (now.getTime() > new Date(tokenExpiresAt as string).getTime()) {
          refreshAccessToken();
        }
      }
    }
  }, []);

  function addSeconds(seconds: number) {
    // Making a copy with the Date() constructor
    const date = new Date();
    const dateCopy = new Date();
    dateCopy.setSeconds(date.getSeconds() + seconds);
    return dateCopy.toString();
  }

  const logout = () => {
    setAuthToken("");
    setAccessToken("");
    setRefreshToken("");
    setTokenExpiresAt("");

    window.localStorage.removeItem("authToken");
    window.localStorage.removeItem("spotify_access_token");
    window.localStorage.removeItem("spotify_refresh_token");
    window.localStorage.removeItem("token_expiry");

    // window.location.href ='http://localhost:3000/';
  };

  async function refreshAccessToken() {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
    const clientSecret = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET!;
    const redirectUrl = "http://localhost:3000";
    const scopes =
      "playlist-modify-private+playlist-modify-public+playlist-read-private+playlist-read-collaborative";

    const refresh_token = localStorage.getItem("spotify_refresh_token");
    var access_token = "";
    var expiresDate = "";

    fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(clientId + ":" + clientSecret),
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refresh_token as string,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        // update access token in state or local storage
        access_token = data["access_token"];
        window.localStorage.setItem(
          "spotify_access_token",
          data["access_token"]
        );

        expiresDate = addSeconds(data["expires_in"]);

        localStorage.setItem("token_expiry", expiresDate);
      });

    setAccessToken(access_token);
    setTokenExpiresAt(expiresDate);
  }

  async function getUserPlaylists() {
    // run this function onSubmit for the form
    // e.preventDefault();
    if (playlistsLoading == false) {
      const access_token = localStorage.getItem("spotify_access_token");
      setPlaylistsLoading(true);
      if (access_token != null && access_token !== "undefined") {
        s.setAccessToken(access_token);
        s.getUserPlaylists().then(
          function (data: any) {
            // console.log('User playlists', data);
            setSpotifyPlaylists(
              data["items"].map((pl: any) => ({
                id: pl.id,
                name: pl.name,
              }))
            );
          },
          function (err: any) {
            console.error(err);
          }
        );
      }
    }
    setPlaylistsLoading(false);
  }

  const handleInputChange = (e: any) => {
    e.preventDefault();
    setInput(e.target.value);
  };

  const createPlaylist = async (e: any) => {
    e.preventDefault();
    setPlName(input);
    localStorage.setItem("plName", input);
    setConvert(true);
  };

  const handleSelectChange = async (e: any) => {
    e.preventDefault();
    e.target.blur();
    const selectedIndex = e.target.options.selectedIndex;
    const spotifyPlKey = e.target.options[selectedIndex].getAttribute("pl-id");
    const data = {
      spotPl: spotifyPlKey,
    };

    if (spotifyPlKey != "-1" && spotifyPlKey != "") {
      setSelected(false);
      setPlId(spotifyPlKey);
      const { result, error } = await addData(
        "playlists",
        session?.data?.user?.id,
        data
      );

      if (error) {
        return console.log("fberror:", error);
      }
    } else {
      setSelected(true);
      setPlId("");
      const { result, error } = await addData(
        "playlists",
        session?.data?.user?.id,
        data
      );

      if (error) {
        return console.log("fberror:", error);
      }
    }
  };


  return (
    <div className="w-full h-full">
      {!authToken ? (
        <div className="text-slate-800 text-xl absolute top-[30%] left-10">
          {" "}
          Now, please{" "}
          <a
            className="bg-green-300 px-1 rounded-md hover:bg-green-500 transition-all"
            href={`https://accounts.spotify.com/en/authorize?client_id=${clientId}&response_type=code&redirect_uri=http://localhost:3000&scope=${scopes}`}
          >
            Login to Spotify
          </a>{" "}
          to grant us access to your library.
        </div>
      ) : (
        <div className="w-full h-full">
          <div className="text-slate-800 text-xl absolute top-[30%] left-10 w-[90%]">
            {/* <button className="" onClick={logout}>Logout of Spotify</button> */}

            <p>
              Choose whether you would like to create a new Spotify playlist for
              your YouTube songs or add them to an existing playlist:
            </p>
            <div className="flex justify-center gap-10 text-xl mt-8">
              <button
                className="bg-green-300 p-2 hover:bg-green-500 rounded-md shadow-md disabled:bg-green-500 transition-colors"
                disabled={choice && choice == "Create"}
                onClick={(e) => {
                  e.preventDefault();
                  setChoice("Create");
                  localStorage.setItem("currChoice", "1");
                }}
              >
                Create New Playlist
              </button>
              <button
                className="bg-green-300 p-2 hover:bg-green-500 rounded-md shadow-md disabled:bg-green-500 transition-colors"
                disabled={choice && choice == "Existing"}
                onClick={(e) => {
                  e.preventDefault();
                  setChoice("Existing");
                  getUserPlaylists();
                  localStorage.setItem("currChoice", "2");
                }}
              >
                Use Existing Playlist
              </button>
            </div>
            {choice == "Create" && (
              <div>
                <p className="mt-5">
                  Enter a name for your new Spotify playlist:
                </p>
                <div className="flex justify-center"></div>
              </div>
            )}
            {choice == "Existing" && (
              <div>
                <p className="mt-5">Choose an existing Spotify playlist:</p>
              </div>
            )}
          </div>
          {choice == "Create" && (
            <div className="flex justify-center">
              <input
                type="text"
                placeholder="Playlist Name"
                onChange={handleInputChange}
                className="text-black mt-5 absolute top-[60%] w-1/4 h-10 placeholder-gray-500 rounded-md shadow-md pl-2"
              ></input>
              {!convert ? (
                <button
                  className="absolute top-3/4 bg-slate-800 text-neutral-200 text-lg p-2 rounded-lg shadow-lg transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-105"
                  onClick={createPlaylist}
                  disabled={!input}
                >
                  Submit Request
                </button>
              ) : (
                <div className="absolute top-3/4">
                  <div
                    role="status"
                    className="flex items-center justify-center"
                  >
                    <svg
                      aria-hidden="true"
                      className="w-8 h-8 mr-2 text-gray-200 animate-spin fill-slate-700"
                      viewBox="0 0 100 101"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"
                      />
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"
                      />
                    </svg>{" "}
                    Processing...
                    <span className="sr-only">Loading...</span>
                  </div>
                </div>
              )}
            </div>
          )}
          {choice == "Existing" && (
            <div className="flex justify-center">
              {playlistsLoading ? (
                <p>Loading...</p>
              ) : (
                <select
                  id="spot-select"
                  onChange={handleSelectChange}
                  size={1}
                  onFocus={(e) => {
                    e.target.size = 5;
                  }}
                  onBlur={(e) => {
                    e.target.size = 1;
                  }}
                  className="z-[1000] accent-green-400 text-slate-800 text-lg w-1/4 h-10 absolute mt-5 top-[60%] focus:ring-2 focus:ring-green-600 focus:h-40 shadow-md rounded-md border-r-8 border-white pr-4"
                >
                  <option
                    pl-id="-1"
                    className="hover:bg-green-200 h-10 pb-2 checked:h-10 accent-green-400"
                  >
                    ---
                  </option>
                  {spotifyPlaylists.map((pl: any) => (
                    <option
                      key={pl.id}
                      pl-id={pl.id}
                      className="hover:bg-green-200 h-10 pb-2 checked:h-10 accent-green-400"
                    >
                      {pl.name}
                    </option>
                  ))}
                </select>
              )}
              {!convert ? (
                <button
                  className="absolute top-3/4 bg-slate-800 text-neutral-200 text-lg p-2 rounded-lg shadow-lg transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-105"
                  disabled={selected}
                  onClick={(e) => {
                    e.preventDefault();
                    setConvert(true);
                  }}
                >
                  Submit Request
                </button>
              ) : (
                <div className="absolute top-3/4">
                  <div
                    role="status"
                    className="flex items-center justify-center"
                  >
                    <svg
                      aria-hidden="true"
                      className="w-8 h-8 mr-2 text-gray-200 animate-spin fill-slate-700"
                      viewBox="0 0 100 101"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"
                      />
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"
                      />
                    </svg>{" "}
                    Processing...
                    <span className="sr-only">Loading...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {convert && <Converting />}
        </div>
      )}
    </div>
  );
}
