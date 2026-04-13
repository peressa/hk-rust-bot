"use client";

import React, { useState } from "react";
import { Lock, Unlock, X, ShieldAlert } from "lucide-react";`nimport BrandLogo from "@/components/layout/BrandLogo";

interface CodelockGateProps {
  onSuccess: (code: string) => void;
  error?: string;
  loading?: boolean;
}

export default function CodelockGate({ onSuccess, error, loading }: CodelockGateProps) {
  const [pin, setPin] = useState("");

  const handlePress = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const clear = () => setPin("");

  const submit = () => {
    if (pin.length === 4) {
      onSuccess(pin);
    }
  };

  const keypad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "C"];

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100vw', 
      background: '#0a0a0b', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'column',
      fontFamily: 'Roboto, sans-serif'
    }}>
      
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
         <div style={{ background: 'var(--primary)', padding: '12px', display: 'inline-block', marginBottom: '1rem' }}>
            <Lock size={40} color="white" />
         </div>
         <h1 style={{ fontFamily: 'var(--font-barlow)', fontSize: '3rem', letterSpacing: '0.1em' }}>Acceso Seguro</h1>
         <p style={{ color: '#444', fontSize: '0.8rem', letterSpacing: '0.2rem', textTransform: 'uppercase', fontWeight: 900 }}>Identificación Requerida para Mando Central</p>
      </div>

      <div style={{ 
        background: '#1a1a1c', 
        padding: '2.5rem', 
        border: '4px solid #333',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
        width: '320px'
      }}>
        
        {/* Screen */}
        <div style={{ 
            background: '#050505', 
            padding: '1.5rem', 
            marginBottom: '2rem', 
            textAlign: 'center',
            border: '2px solid #222',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
        }}>
           {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  background: pin.length > i ? 'var(--primary)' : '#222',
                  boxShadow: pin.length > i ? '0 0 10px var(--primary)' : 'none',
                  transition: 'all 0.1s'
              }}></div>
           ))}
        </div>

        {/* Keypad */}
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '0.75rem' 
        }}>
           {keypad.map((key, idx) => (
              <button 
                key={idx}
                onClick={() => key === "C" ? clear() : (key ? handlePress(key) : null)}
                disabled={loading || (!key && key !== "0")}
                style={{ 
                    height: '60px', 
                    background: key === "C" ? '#333' : (key ? '#252527' : 'transparent'),
                    border: key ? '1px solid #444' : 'none',
                    color: '#fff',
                    fontFamily: 'var(--font-barlow)',
                    fontSize: '1.5rem',
                    cursor: key ? 'pointer' : 'default',
                    transition: 'all 0.05s',
                    opacity: key ? 1 : 0
                }}
                onMouseDown={(e) => key && (e.currentTarget.style.transform = 'scale(0.95)', e.currentTarget.style.background = 'var(--primary)')}
                onMouseUp={(e) => key && (e.currentTarget.style.transform = 'scale(1)', e.currentTarget.style.background = key === "C" ? '#333' : '#252527')}
              >
                {key}
              </button>
           ))}
        </div>

        <button 
            onClick={submit}
            disabled={pin.length < 4 || loading}
            style={{ 
                width: '100%', 
                marginTop: '1.5rem', 
                background: pin.length === 4 ? 'var(--primary)' : '#222',
                color: '#fff',
                border: 'none',
                padding: '1rem',
                fontFamily: 'var(--font-barlow)',
                fontSize: '1.2rem',
                letterSpacing: '0.1em',
                cursor: pin.length === 4 ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
            }}
        >
            {loading ? 'Validando...' : 'Confirmar'}
        </button>

        {error && (
            <div style={{ marginTop: '1.5rem', color: '#ef4444', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', fontWeight: 900 }}>
                <ShieldAlert size={16} /> {error.toUpperCase()}
            </div>
        )}
      </div>

      <div style={{ marginTop: '3rem', color: '#222', fontSize: '0.6rem', letterSpacing: '0.5em', fontWeight: 900 }}>
         Encriptaci�n AES-256 Activa
      </div>
    </div>
  );
}
