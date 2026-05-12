"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Radio, ShieldCheck, ChevronLeft, Lock } from "lucide-react";
import { dictionaries, Language } from "@/lib/i18n/dictionaries";
import BrandLogo from "@/components/layout/BrandLogo";

export default function SignInPage() {
  const [lang, setLang] = useState<Language>('en');
  
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    };
    
    const savedLang = (getCookie('NEXT_LOCALE') || localStorage.getItem('rust-ops-lang')) as Language;
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
      
      {/* Background Video with Tactical Filter */}
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
          opacity: 0.15,
          zIndex: 0,
          filter: 'contrast(1.5) grayscale(1) brightness(0.5)'
        }}
      >
        <source src="https://files.facepunch.com/paddy/20210324/rust_site2021_hero_v002.mp4" type="video/mp4" />
      </video>

      {/* Industrial Overlay & Grid */}
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        background: 'radial-gradient(circle at center, transparent 0%, rgba(5,5,6,0.9) 100%)',
        zIndex: 1
      }}></div>

      <div style={{ 
        position: 'relative', 
        zIndex: 10, 
        width: '100%', 
        maxWidth: '480px', 
        textAlign: 'center',
        padding: '2rem'
      }}>
        
        <div style={{ marginBottom: '3.5rem', display: 'flex', justifyContent: 'center' }} className="animate-fade-in">
           <BrandLogo size="lg" />
        </div>

        <div className="premium-card" style={{ 
            background: 'rgba(10, 10, 12, 0.95)', 
            border: '1px solid rgba(232, 0, 28, 0.2)', 
            padding: '4rem 2.5rem',
            boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)'
        }}>
          <div style={{ color: 'var(--primary)', marginBottom: '2.5rem', display: 'flex', justifyContent: 'center', opacity: 0.8 }}>
             <div style={{ position: 'relative' }}>
                <Lock size={56} strokeWidth={1.5} />
                <div style={{ position: 'absolute', inset: -10, background: 'rgba(232, 0, 28, 0.1)', filter: 'blur(15px)', borderRadius: '50%' }}></div>
             </div>
          </div>
          
          <h2 style={{ 
            color: '#fff', 
            marginBottom: '3rem', 
            fontSize: '1.4rem', 
            fontWeight: 900, 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            lineHeight: 1.2,
            fontFamily: 'var(--font-barlow)'
          }}>
            {t.login.authenticate.toUpperCase()}
          </h2>
          
          <button 
            onClick={() => signIn('steam', { callbackUrl: '/dashboard' })}
            style={{ 
              width: '100%',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              padding: '1.5rem',
              fontWeight: 900,
              fontSize: '1.2rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.25rem',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              fontFamily: 'var(--font-barlow)',
              boxShadow: '0 10px 30px rgba(232, 0, 28, 0.2)'
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-3px)', e.currentTarget.style.boxShadow = '0 20px 40px rgba(232, 0, 28, 0.3)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 10px 30px rgba(232, 0, 28, 0.2)')}
          >
            <ShieldCheck size={26} /> {t.login.btn}
          </button>
          
          <div className="text-tech" style={{ marginTop: '3rem', fontSize: '0.6rem', color: '#555', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', lineHeight: 1.6 }}>
            {t.login.disclaimer}
          </div>
        </div>

        <div style={{ marginTop: '4rem' }}>
          <a href="/" style={{ color: '#444', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.2em', fontFamily: 'var(--font-barlow)', transition: '0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseOut={(e) => e.currentTarget.style.color = '#444'}>
            <ChevronLeft size={16} /> {t.login.return}
          </a>
        </div>
      </div>
      
      {/* Visual Tech Decals */}
      <div className="text-tech" style={{ position: 'absolute', bottom: '3rem', left: '3rem', color: 'rgba(232, 0, 28, 0.1)', fontSize: '0.65rem' }}>
         <div style={{ marginBottom: '4px' }}>SECURE_UPLINK: ACTIVE</div>
         <div style={{ marginBottom: '4px' }}>ENCRYPTION: AES_256_GCM</div>
         <div>OPERATOR_AUTH: PENDING...</div>
      </div>

      <div className="text-tech" style={{ position: 'absolute', top: '3rem', right: '3rem', color: 'rgba(255, 255, 255, 0.03)', fontSize: '0.65rem', textAlign: 'right' }}>
         <div style={{ marginBottom: '4px' }}>RUST_OPS_NODE_B49</div>
         <div style={{ marginBottom: '4px' }}>COORDINATES: UNKNOWN</div>
         <div>SIGNAL_STRENGTH: NOMINAL</div>
      </div>
    </div>
  );
}
