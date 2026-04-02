import NextAuth from "next-auth";
import { getAuthOptions } from "../../../lib/auth/authOptions";
import { NextRequest } from "next/server";

async function handler(req: NextRequest, ctx: { params: any }) {
  const options = getAuthOptions(req);
  return await NextAuth(req as any, ctx as any, options);
}

export { handler as GET, handler as POST };
