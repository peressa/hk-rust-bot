import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import db from "@/lib/db";
import { rustPlusManager } from "@/lib/rustplus/RustPlusManager";

export async function GET() {
  const session = await getServerSession(getAuthOptions());
  
  // En un sistema real, aquí verificaríamos si el usuario es Admin
  // if (session?.user?.role !== 'admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const managerStats = rustPlusManager.getGlobalStats();
    
    const totalServers = db.prepare("SELECT COUNT(*) as count FROM servers").get() as any;
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM whitelist").get() as any;
    
    // Alertas hoy (esto requiere que la DB guarde timestamps de intel, por ahora simulamos con el manager)
    const alertsToday = managerStats.servers.reduce((acc, s) => acc + (s.ready ? 1 : 0), 0) * 12; // Simulación

    return NextResponse.json({
      ...managerStats,
      totalServers: totalServers.count,
      totalUsers: totalUsers.count,
      alertsToday
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
