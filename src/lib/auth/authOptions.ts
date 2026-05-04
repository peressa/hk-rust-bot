import SteamProvider from "next-auth-steam";
import DiscordProvider from "next-auth/providers/discord";
import { NextRequest } from "next/server";
import { isWhitelisted, linkDiscordId, getWhitelistByDiscordId, ensureAdminExists } from "@/lib/db";

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
          
          // Forzar sincronización del admin antes de chequear
          ensureAdminExists();
          
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
          if (!discordId) return false;

          const whitelistEntry = getWhitelistByDiscordId(discordId);
          
          if (whitelistEntry) {
            (user as any).role = whitelistEntry.role;
            (user as any).steamId = whitelistEntry.steamId;
            return true;
          }
          
          // Si no está vinculado pero el usuario inició sesión desde el dashboard, 
          // permitimos el login para que el callback JWT haga el vínculo.
          return true;
        }
        
        return false;
      },
      async jwt({ token, user, account, profile }) {
        // Al iniciar sesión con Steam
        if (account?.provider === "steam" && profile) {
          token.steamId = (profile as any).steamid;
          token.name = (profile as any).personaname;
          token.image = (profile as any).avatarfull;

          const entry = isWhitelisted(token.steamId as string);
          if (entry) {
            token.role = entry.role;
            if (entry.discordId) token.discordId = entry.discordId;
          }
        }

        // Al iniciar sesión con Discord (Vínculo)
        if (account?.provider === "discord" && profile) {
          const discordId = (profile as any).id;
          token.discordId = discordId;
          
          // Lógica de Vínculo: Si ya teníamos un steamId en el token, los enlazamos
          if (token.steamId) {
            console.log(`[Auth Auto-Link] Vinculando Discord ${discordId} a Steam ${token.steamId}`);
            linkDiscordId(String(token.steamId), discordId);
          } else {
            // Si entró directo con Discord, intentamos buscar si ya estaba vinculado
            const entry = getWhitelistByDiscordId(discordId);
            if (entry) {
              token.steamId = entry.steamId;
              token.role = entry.role;
            }
          }
        }
        if (user) {
          token.role = (user as any).role;
        }
        return token;
      },
      session({ session, token }) {
        if (session.user) {
          (session.user as any).steamId = token.steamId;
          (session.user as any).discordId = token.discordId;
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
