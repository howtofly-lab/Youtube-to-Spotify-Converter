import NextAuth from "next-auth"
import { AppProviders } from "next-auth/providers/index";
import GoogleProvider from "next-auth/providers/google";
import SpotifyProvider from "next-auth/providers/spotify";
import { AuthOptions, User } from "next-auth";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { cert } from "firebase-admin/app";
import { Adapter } from "next-auth/adapters";

async function refreshAccessToken(token: any) {
  console.log("needs refresh");
  try {
    const url =
      "https://oauth2.googleapis.com/token?" +
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      })

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    })

    const refreshedTokens = await response.json()
    console.log("refreshed");

    if (!response.ok) {
      throw refreshedTokens
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    }
  } catch (error) {
    console.log(error)

    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
}

export const Options: AuthOptions = {
  // Configure one or more authentication providers
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          access_type: 'offline',
          scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly"
        }
      },
      
    })
  ],adapter: FirestoreAdapter({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  }) as Adapter,
  secret: process.env.NEXTAUTH_SECRET,
  callbacks:{
    async session({ session, user, token }) {
          if (token) {
            // session.user = token.user;
            session.accessToken= token.accessToken as string;
            session = {
              ...session,
              user: {
                  id: token?.sub as string
              }
          }
          return session
          }

        return session
      },
      async signIn({ user, account, profile, email, credentials }) {
        return true;
      },


    async jwt({ token, account, user }) {
    if (account && user) {
        // Add access_token, refresh_token and expirations to the token right after signin
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account!.expires_at! * 1000;
        token.user = user;
        console.log("account: ", account);
        return token;
    }

    // Return previous token if the access token has not expired yet
    if (token){
        if (Date.now() < (token!.accessTokenExpires! as number)) {
            return token;
        }
    }
    

    // Access token has expired, try to update it
    return refreshAccessToken(token);
    }
  },session:{
    strategy: "jwt"
  },
  debug: process.env.NODE_ENV === "development",
  
}
export default NextAuth(Options)