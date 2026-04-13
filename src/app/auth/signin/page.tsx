"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Radio, ShieldCheck, ChevronLeft, Lock } from "lucide-react";
import { dictionaries, Language } from "@/lib/i18n/dictionaries";`nimport BrandLogo from "@/components/layout/BrandLogo";

export default function SignInPage() {
  const [lang, setLang] = useState<Language>('en');
  
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    };
    
    const savedLang = (getCookie('NEXT_LOCALE') || localStorage.getItem('hk-ops-lang')) as Language;
    if (savedLang && ['en', 'es', 'pt'].includes(savedLang)) {
      setLang(savedLang);
    }
  }, []);

  const t = dictionaries[lang];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#000', 
      color: '#fff', 
      position: 'relative', 
      overflow: 'hidden', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'Roboto, sans-serif'
    }}>
      
      {/* Background Video (Official Facepunch Mirror) */}
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
          opacity: 0.3,
          zIndex: 0,
          filter: 'grayscale(0.5) contrast(1.2)'
        }}
      >
        <source src="https://files.facepunch.com/paddy/20210324/rust_site2021_hero_v002.mp4" type="video/mp4" />
      </video>

      {/* Industrial Overlay */}
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%)',
        zIndex: 1
      }}></div>

      <div style={{ 
        position: 'relative', 
        zIndex: 10, 
        width: '100%', 
        maxWidth: '550px', 
        textAlign: 'center',
        padding: '2rem'
      }}>
        
        <div style={{ marginBottom: '4rem' }} className="animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--primary)', padding: '8px', display: 'flex' }}>
              <Radio color="white" size={40} />
            </div>
            <h1 style={{ fontSize: '4.5rem', fontWeight: 900, fontFamily: 'var(--font-barlow)', letterSpacing: '0.05em', lineHeight: 1 }}>
              RUST <span style={{ color: 'var\(--primary\)', fontStyle: 'italic' }}>SENTINEL</span>
            </h1>
          </div>
          <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.4em', textTransform: 'uppercase', textShadow: '0 0 10px rgba(206, 66, 43, 0.5)' }}>
            {t.login.terminal}
          </div>
        </div>

        <div className="premium-card" style={{ 
            background: 'rgba(5, 5, 5, 0.9)', 
            border: '2px solid var(--border)', 
            padding: '3.5rem 2.5rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}>
          <div style={{ opacity: 0.6, marginBottom: '2.5rem', display: 'flex', justifyContent: 'center' }}>
             <Lock size={48} />
          </div>
          
          <h2 style={{ 
            color: '#fff', 
            marginBottom: '2.5rem', 
            fontSize: '1.25rem', 
            fontWeight: 900, 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            lineHeight: 1.4,
            fontFamily: 'var(--font-barlow)'
          }}>
            {t.login.authenticate}
          </h2>
          
          <button 
            onClick={() => signIn('steam', { callbackUrl: '/dashboard' })}
            style={{ 
              width: '100%',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              padding: '1.75rem',
              fontWeight: 900,
              fontSize: '1.1rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              transition: 'all 0.1s ease-out',
              fontFamily: 'var(--font-barlow)'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#fff', e.currentTarget.style.color = '#000')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'var(--primary)', e.currentTarget.style.color = '#fff')}
          >
            <ShieldCheck size={28} /> {t.login.btn}
          </button>
          
          <div style={{ marginTop: '2.5rem', fontSize: '0.65rem', color: '#444', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1.5 }}>
            {t.login.disclaimer}
          </div>
        </div>

        <div style={{ marginTop: '3.5rem' }}>
          <a href="/" style={{ color: '#444', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }} onMouseOver={(e) => e.currentTarget.style.color = '#888'} onMouseOut={(e) => e.currentTarget.style.color = '#444'}>
            <ChevronLeft size={16} /> {t.login.return}
          </a>
        </div>
      </div>
      
      {/* Visual Tech Decals */}
      <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', fontSize: '0.6rem', color: '#222', fontWeight: 900, fontFamily: 'monospace' }}>
         Conexi�n Segura // Sentinel v3
      </div>
      <div style={{ position: 'absolute', top: '2rem', right: '2rem', fontSize: '0.6rem', color: '#222', fontWeight: 900, fontFamily: 'monospace' }}>
         Sistema: Activo // Encriptaci�n AES-256
      </div>
    </div>
  );
}
