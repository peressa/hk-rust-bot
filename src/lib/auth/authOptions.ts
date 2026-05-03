import SteamProvider from "next-auth-steam";
import DiscordProvider from "next-auth/providers/discord";
import { NextRequest } from "next/server";
import { isWhitelisted, linkDiscordId, getWhitelistByDiscordId } from "@/lib/db";

export const getAuthOptions = (req?: NextRequest): NextAuthOptions => {
  return {
    providers: [
      SteamProvider(req as any, {
        clientSecret: process.env.STEAM_API_KEY!,
        callbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback`,
      }),
      DiscordProvider({
        clientId: process.env.DISCORD_CLIENT_ID!,
        clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      }),
    ],
    callbacks: {
      async signIn({ user, account, profile }) {
        if (account?.provider === "steam") {
          const steamId = (profile as any)?.steamid;
          console.log(`[Auth] Intento de login Steam: ${steamId}`);
          
          const whitelistEntry = steamId ? isWhitelisted(String(steamId).trim()) : null;
          
          if (whitelistEntry) {
            console.log(`[Auth] Acceso concedido para ${steamId} (Rol: ${whitelistEntry.role})`);
            (user as any).role = whitelistEntry.role;
            return true;
          }
          console.warn(`[Auth] Bloqueado SteamID: ${steamId} - No está en whitelist o expiró.`);
          return `/auth/unauthorized?steamId=${steamId}`;
        }

        if (account?.provider === "discord") {
          const discordId = profile?.id;
          const whitelistEntry = discordId ? getWhitelistByDiscordId(discordId) : null;
          
          if (whitelistEntry) {
            (user as any).role = whitelistEntry.role;
            (user as any).steamId = whitelistEntry.steamId;
            return true;
          }
          
          // Si no está en whitelist, pero tenemos una sesión de Steam activa, podríamos vincularlos.
          // Pero NextAuth no facilita acceder a la sesión actual aquí fácilmente sin trucos.
          console.warn(`[Auth] Bloqueado DiscordID: ${discordId}`);
          return `/auth/unauthorized?discordId=${discordId}`;
        }
        
        return false;
      },
      jwt({ token, user, account, profile }) {
        if (account?.provider === "steam" && profile) {
          token.steamId = (profile as any).steamid;
          token.name = (profile as any).personaname;
          token.image = (profile as any).avatarfull;
        }
        if (account?.provider === "discord" && profile) {
          token.discordId = (profile as any).id;
          if ((user as any).steamId) token.steamId = (user as any).steamId;
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
      pages: {
        signIn: '/auth/signin',
        error: '/auth/unauthorized',
      },
    };
};
