import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";
import LandingContent from "@/components/landing/LandingContent";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const session = await getServerSession(getAuthOptions());

  if (session) {
    redirect("/dashboard");
  }

  return <LandingContent />;
}
