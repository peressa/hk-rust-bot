import { NextResponse } from "next/server";
import { addTrackedPlayer } from "@/lib/db";
import { TrackingManager } from "@/lib/intel/TrackingManager";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "Missing id or name" }, { status: 400 });
    }

    // Guardar en DB
    addTrackedPlayer({ id, name });

    // Asegurarse de que el servicio de tracking esté corriendo
    TrackingManager.start();

    return NextResponse.json({ status: "success", message: `Player ${name} is now being tracked.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
