"use client";

import React from "react";
import { signIn } from "next-auth/react";
import { Radio, ShieldCheck } from "lucide-react";

export default function SignInPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* Background Video (Official Mirror) */}
      <video 
        autoPlay 
        muted 
        loop 
        playsInline 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          opacity: 0.4,
          zIndex: 0
        }}
      >
        <source src="https://files.facepunch.com/paddy/20210324/rust_site2021_hero_v002.mp4" type="video/mp4" />
      </video>

      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        width: '100%', 
        maxWidth: '500px', 
        textAlign: 'center',
        padding: '2rem'
      }}>
        
        <div style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--primary)', padding: '4px', display: 'flex' }}>
              <Radio color="white" size={32} />
            </div>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'Bebas Neue', letterSpacing: '0.05em' }}>RUST <span style={{ color: 'var(--primary)' }}>OPS</span></h1>
          </div>
          <div style={{ color: '#888', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            // TERMINAL ACCESS REQUIRED
          </div>
        </div>

        <div className="premium-card" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: '#ccc', marginBottom: '2.5rem', fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            AUTHENTICATE VIA STEAM TO DEPLOY YOUR TACTICAL INTERFACE
          </p>
          
          <button 
            onClick={() => signIn('steam', { callbackUrl: '/dashboard' })}
            style={{ 
              width: '100%',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              padding: '1.5rem',
              fontWeight: 900,
              fontSize: '1rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#fff', e.currentTarget.style.color = '#000')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'var(--primary)', e.currentTarget.style.color = '#fff')}
          >
            <ShieldCheck size={24} /> SIGN IN WITH STEAM
          </button>
          
          <div style={{ marginTop: '2rem', fontSize: '0.7rem', color: '#555', fontWeight: 700, textTransform: 'uppercase' }}>
            BY SIGNING IN, YOU ACKNOWLEDGE THE MISSION PROTOCOLS.
          </div>
        </div>

        <div style={{ marginTop: '3rem' }}>
          <a href="/" style={{ color: '#444', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 900 }}>
            RETURN TO COMMAND CENTER
          </a>
        </div>
      </div>
    </div>
  );
}
