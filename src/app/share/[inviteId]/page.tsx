"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import CodelockGate from "@/components/auth/CodelockGate";
import RustMap from "@/components/map/RustMap";
import { ShieldCheck, Share2, Users, RefreshCw, Map as MapIcon } from "lucide-react";

export default function GuestSharePage() {
  const params = useParams();
  const inviteId = params.inviteId as string;
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authData, setAuthData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Tactical Data (Simplified for guests)
  const [mapData, setMapData] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const handleVerify = async (code: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/rustplus/invites/verify", {
        method: "POST",
        body: JSON.stringify({ inviteId, code })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Fallo de autenticación");
      }

      setAuthData(data);
      setIsAuthorized(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized && authData?.serverId) {
       fetchTacticalData();
       const interval = setInterval(fetchTacticalData, 5000);
       return () => clearInterval(interval);
    }
  }, [isAuthorized, authData?.serverId]);

  const fetchTacticalData = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const [mRes, markRes] = await Promise.all([
        fetch(`/api/rustplus/map?serverId=${authData.serverId}`),
        fetch(`/api/rustplus/markers?serverId=${authData.serverId}`)
      ]);
      
      const mData = await mRes.json();
      setMapData(mData);
      
      const markersData = await markRes.json();
      setMarkers(markersData.markers || []);
    } catch (err) {
      console.error("Guest sync failed:", err);
    } finally {
      setRefreshing(false);
    }
  };

  if (!isAuthorized) {
    return <CodelockGate onSuccess={handleVerify} error={error} loading={loading} />;
  }

  return (
    <div className="guest-war-room" style={{ height: '100vh', width: '100vw', background: '#050505', color: '#fff', overflow: 'hidden', position: 'relative' }}>
        
        {/* TACTICAL OVERLAY */}
        <div style={{ 
          position: 'absolute', 
          top: '1.5rem', 
          left: '1.5rem', 
          zIndex: 1000, 
          background: 'rgba(5, 5, 5, 0.9)', 
          padding: '1rem', 
          border: '1px solid var(--border)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
            <div style={{ background: 'var(--primary)', padding: '6px' }}>
                <MapIcon size={20} color="white" />
            </div>
            <div>
                <div style={{ fontFamily: 'var(--font-barlow)', fontSize: '1.2rem', letterSpacing: '0.1em' }}>Acceso de Invitado</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div className="status-blink" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></div>
                    <span style={{ fontSize: '0.6rem', color: '#666', fontWeight: 900 }}>Modo Lectura Activo</span>
                </div>
            </div>
        </div>

        {/* REFRESH STATUS */}
        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 1000 }}>
             <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} color="#444" />
        </div>

        <main style={{ height: '100%', width: '100%' }}>
            <RustMap 
              mapJpg={mapData?.jpgImage} 
              mapSize={mapData?.mapSize || 4000} 
              oceanMargin={mapData?.oceanMargin || 0}
              monuments={mapData?.monuments || []}
              markers={markers}
              serverId={authData?.serverId}
              allowDrawing={authData?.canDraw}
            />
        </main>

        <style jsx global>{`
           .status-blink { animation: blink 1s infinite; }
           @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        `}</style>
    </div>
  );
}
