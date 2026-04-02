import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      steamId?: string;
    } & DefaultSession["user"];
  }

  interface JWT {
    steamId?: string;
  }
}
