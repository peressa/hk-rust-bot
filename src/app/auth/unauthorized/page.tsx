"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, ChevronRight, ArrowLeft, Radio } from "lucide-react";
import { dictionaries, Language } from "@/lib/i18n/dictionaries";

function UnauthorizedPageContent() {
  const searchParams = useSearchParams();
  const steamId = searchParams.get("steamId");
  const [lang, setLang] = useState<Language>('en');
  const t = dictionaries[lang].unauthorized;
  const tp = dictionaries[lang].pricing;

  useEffect(() => {
    const savedLang = localStorage.getItem('rust-ops-lang') as Language;
    if (savedLang && ['en', 'es', 'pt'].includes(savedLang)) {
      setLang(savedLang);
    }
  }, []);

  const handleBuy = (mode: string) => {
    const checkoutUrls: any = {
      monthly: "https://rustops.lemonsqueezy.com/checkout/buy/tu-id-producto-mensual",
      annual: "https://rustops.lemonsqueezy.com/checkout/buy/tu-id-producto-anual"
    };

    let url = checkoutUrls[mode];
    if (steamId) {
      url += `?checkout[custom][steam_id]=${steamId}`;
    }
    
    window.open(url, "_blank");
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Video (Same as landing for consistency) */}
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
          zIndex: 0
        }}
      >
        <source src="https://files.facepunch.com/paddy/20210324/rust_site2021_hero_v002.mp4" type="video/mp4" />
      </video>

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
        
        <div style={{ maxWidth: '1000px', width: '100%', textAlign: 'center' }}>
          <div style={{ marginBottom: '4rem' }}>
            <div style={{ background: 'var(--primary)', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
              <ShieldAlert size={32} color="white" />
            </div>
            <h1 style={{ fontSize: '5rem', lineHeight: 0.9, marginBottom: '1.5rem', fontFamily: 'var(--font-barlow)' }}>{t.title}</h1>
            <p style={{ color: '#aaa', fontSize: '1.2rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              {t.desc.replace('{id}', steamId || 'TERMINAL')}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
            
            {/* Monthly Plan */}
            <div className="premium-card" style={{ textAlign: 'left', border: '1px solid #333' }}>
              <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.75rem', marginBottom: '1rem' }}>{tp.monthly.type}</div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{tp.monthly.title}</h2>
              <div style={{ fontSize: '3.5rem', marginBottom: '2rem' }}>{tp.monthly.price} <span style={{ fontSize: '1rem', color: '#555' }}>{tp.monthly.price_sub}</span></div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: '#888', fontWeight: 700, fontSize: '0.9rem' }}>
                <li>[+] FULL MODULE ACCESS</li>
                <li>[+] REAL-TIME DISCORD ALERTS</li>
                <li>[+] CCTV REMOTE TERMINAL</li>
                <li>[+] CANCEL ANYTIME</li>
              </ul>
              <button onClick={() => handleBuy('monthly')} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                {tp.monthly.cta} <ChevronRight size={18} />
              </button>
            </div>

            {/* Annual Plan */}
            <div className="premium-card" style={{ textAlign: 'left', border: '1px solid var(--primary)', background: 'rgba(206, 66, 43, 0.05)' }}>
              <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.75rem', marginBottom: '1rem' }}>{tp.annual.type}</div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{tp.annual.title}</h2>
              <div style={{ fontSize: '3.5rem', marginBottom: '2rem' }}>{tp.annual.price} <span style={{ fontSize: '1rem', color: '#555' }}>{tp.annual.price_sub}</span></div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: '#ccc', fontWeight: 700, fontSize: '0.9rem' }}>
                <li>[+] EVERYTHING IN MONTHLY</li>
                <li>[+] PRIORITY ALPHA SUPPORT</li>
                <li>[+] FOUNDER STATUS</li>
                <li>[+] 12 MONTHS OF DOMINANCE</li>
              </ul>
              <button onClick={() => handleBuy('annual')} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                {tp.annual.cta} <ChevronRight size={18} />
              </button>
            </div>

          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
            <Link href="/" style={{ color: '#555', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowLeft size={16} /> {t.return}
            </Link>
            <div style={{ opacity: 0.2, display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <Radio size={24} /> <div style={{ fontWeight: 900, fontFamily: 'Roboto' }}>RUST OPS GLOBAL</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: 'white' }}>
        <p>INITIALIZING SECURE LINK...</p>
      </div>
    }>
      <UnauthorizedPageContent />
    </Suspense>
  );
}
