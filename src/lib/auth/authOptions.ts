import { NextAuthOptions } from "next-auth";
import SteamProvider, { PROXIED_STEAM_COMMON_URL } from "next-auth-steam";
import { NextRequest } from "next/server";

export const getAuthOptions = (req?: NextRequest): NextAuthOptions => {
  return {
    providers: [
      SteamProvider(req as any, {
        clientSecret: process.env.STEAM_API_KEY!,
        callbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback`,
      }),
    ],
    callbacks: {
      jwt({ token, account, profile }) {
        if (account?.provider === "steam" && profile) {
          token.steamId = (profile as any).steamid;
          token.name = (profile as any).personaname;
          token.image = (profile as any).avatarfull;
        }
        return token;
      },
      session({ session, token }) {
        if (session.user) {
          (session.user as any).steamId = token.steamId;
        }
        return session;
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
  };
};
