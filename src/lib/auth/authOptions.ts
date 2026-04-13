import { NextAuthOptions } from "next-auth";
import SteamProvider from "next-auth-steam";
import { NextRequest } from "next/server";
import { isWhitelisted } from "@/lib/db";

export const getAuthOptions = (req?: NextRequest): NextAuthOptions => {
  return {
    providers: [
      SteamProvider(req as any, {
        clientSecret: process.env.STEAM_API_KEY!,
        callbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback`,
      }),
    ],
    callbacks: {
      async signIn({ user, account, profile }) {
        const steamId = (profile as any)?.steamid;
        const whitelistEntry = steamId ? isWhitelisted(steamId) : null;
        
        if (whitelistEntry) {
          // Guardar rol temporalmente en el objeto user para que jwt() lo vea
          (user as any).role = whitelistEntry.role;
          return true;
        }
        
        console.warn(`[Auth] Bloqueado inicio de sesión para SteamID: ${steamId} (No en whitelist o expirado)`);
        return `/auth/unauthorized?steamId=${steamId}`;
      },
      jwt({ token, user, account, profile }) {
        if (account?.provider === "steam" && profile) {
          token.steamId = (profile as any).steamid;
          token.name = (profile as any).personaname;
          token.image = (profile as any).avatarfull;
        }
        if (user) {
          token.role = (user as any).role;
        }
        return token;
      },
      session({ session, token }) {
        if (session.user) {
          (session.user as any).steamId = token.steamId;
          (session.user as any).role = token.role || 'user';
        }
        return session;
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
  };
};
