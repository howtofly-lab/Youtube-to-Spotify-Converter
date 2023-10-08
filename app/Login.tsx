"use client";
import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";

export default function Login() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <div className=" overflow-hidden bg-gradient-to-tr from-gray-800 to-black w-screen h-screen font-sans font-medium">
      <div className="relative w-screen h-screen">
        <div className=" absolute top-0 -left-4 w-80 h-80 bg-green-400  filter opacity-30 blur-3xl rounded-lg animate-blob"></div>
        <div className="absolute -bottom-4 left-1/2 w-80 h-80 bg-green-600 opacity-30 filter blur-3xl rounded-lg animate-blob animation-delay-2000"></div>
        <div className="absolute -top-10 -right-6 w-64 h-64 bg-green-800 opacity-40 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>
      <div
        id="auth-container"
        className={`${
          loaded
            ? "flex gap-6 w-48 h-16 items-center absolute  top-2 right-3  transition-opacity duration-500 delay-[2000ms]"
            : "opacity-0"
        }`}
      >
        <button
          className="bg-slate-800 w-20 h-12 text-neutral-300 rounded-lg shadow-lg transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-105"
          onClick={() => signIn("google")}
        >
          Signup
        </button>
        <button
          className="bg-neutral-300 w-20 h-12 text-slate-800 rounded-lg shadow-lg transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-105"
          onClick={() => signIn("google")}
        >
          Login
        </button>
      </div>
      <div id="container" className=" flex justify-center">
        <p
          className={`${
            loaded
              ? "drop-shadow-2xl absolute top-[20%] text-neutral-200 font-sans font-bold text-5xl transition -translate-y-10 duration-500"
              : "opacity-0"
          }`}
        >
          Welcome to Spotify-to-YouTube Converter
        </p>
        <div
          id="hover-container"
          className={`${
            loaded
              ? "flex justify-center transition-opacity duration-500 delay-1000"
              : "opacity-0"
          }`}
        >
          <div
            className={
              "h-96 w-2/3 absolute top-1/4 mt-4 rounded-lg bg-gradient-to-br from-green-700 to-neutral-200 shadow-lg transition hover:scale-105 duration-300"
            }
          >
            <div className="flex justify-center">
              <p className="text-slate-800 w-[80%] absolute top-[20%] text-3xl text-center">
                A simple application that allows you to convert a YouTube
                playlist to a Spotify playlist without all the hard work.
              </p>
              <b />
              <p className="text-slate-800 w-2/3 absolute top-2/3 text-3xl text-center inline-block">
                <span
                  className="text-green-800 hover:bg-green-500 hover:rounded-lg transition-all bg-green-400 rounded-md px-1"
                  onClick={() => signIn("google")}
                >
                  Sign up
                </span>{" "}
                to get started!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
