"use client";

import React, { useEffect } from "react";
import { XCircle, RefreshCw, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WarRoomError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("WAR ROOM CRITICAL ERROR:", error);
  }, [error]);

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw', 
      background: '#050505', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      color: 'white', 
      fontFamily: 'Inter, sans-serif',
      padding: '2rem'
    }}>
      <div style={{ 
        maxWidth: '500px', 
        width: '100%',
        background: 'rgba(239, 68, 68, 0.05)', 
        border: '1px solid rgba(239, 68, 68, 0.2)', 
        padding: '3rem', 
        borderRadius: '1.5rem',
        textAlign: 'center'
      }}>
        <XCircle size={64} color="#ef4444" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
        
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '0.05em' }}>
          FALLA EN EL SISTEMA TÁCTICO
        </h1>
        
        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          Se ha producido un error inesperado al inicializar los módulos de la War Room. Esto puede deberse a datos corruptos del servidor o una falla en la conexión de red.
        </p>

        <div style={{ 
          background: 'rgba(0,0,0,0.3)', 
          padding: '1rem', 
          borderRadius: '0.5rem', 
          marginBottom: '2.5rem',
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          color: '#ef4444',
          textAlign: 'left',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          border: '1px solid rgba(255,255,255,0.03)'
        }}>
          <strong>DEBUG_INFO:</strong> {error.message || "Error desconocido"}
          {error.digest && <div style={{ opacity: 0.5, marginTop: '0.2rem' }}>Digest: {error.digest}</div>}
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => reset()}
            style={{ 
              flex: 1,
              background: '#ef4444', 
              color: '#white', 
              border: 'none', 
              padding: '0.8rem', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: '0.2s'
            }}
          >
            <RefreshCw size={16} /> REINTENTAR
          </button>
          
          <button 
            onClick={() => router.push('/dashboard')}
            style={{ 
              flex: 1,
              background: 'rgba(255,255,255,0.05)', 
              color: '#fff', 
              border: '1px solid rgba(255,255,255,0.1)', 
              padding: '0.8rem', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <ChevronLeft size={16} /> VOLVER
          </button>
        </div>
      </div>
    </div>
  );
}
