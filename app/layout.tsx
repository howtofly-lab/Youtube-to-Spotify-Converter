import "./globals.css";
import { Inter } from "next/font/google";
import { Options } from "@/pages/api/auth/[...nextauth]";
import { AuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import SessionProvider from "./SessionProvider";
import Login from "./Login";
import Home from "./page";

const inter = Inter({ subsets: ["latin"] });

// since page is server side rendered, we need
// to use getServerSession instead of useSession
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(Options);
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>
          {/* if session doesn't exist, show login page.
          if session does exist, show Home page */}
          {!session ? (
            <Login />
          ) : (
            <div>
              <Home />
              {/* <TransferPage/> */}
            </div>
          )}
        </SessionProvider>
      </body>
    </html>
  );
}
