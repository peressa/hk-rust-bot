"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, ChevronRight, ArrowLeft, Check, Zap, Rocket, Radio } from "lucide-react";

function UnauthorizedPageContent() {
  const searchParams = useSearchParams();
  const steamId = searchParams.get("steamId");

  const handleBuy = (mode: string) => {
    const checkoutUrls: any = {
      monthly: "https://hkbot.lemonsqueezy.com/checkout/buy/tu-id-producto-mensual",
      annual: "https://hkbot.lemonsqueezy.com/checkout/buy/tu-id-producto-anual"
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
        <source src="https://files.facepunch.com/rust/companion/hero-video.mp4" type="video/mp4" />
      </video>

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
        
        <div style={{ maxWidth: '1000px', width: '100%', textAlign: 'center' }}>
          <div style={{ marginBottom: '4rem' }}>
            <div style={{ background: 'var(--primary)', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
              <ShieldAlert size={32} color="white" />
            </div>
            <h1 style={{ fontSize: '5rem', lineHeight: 0.9, marginBottom: '1.5rem' }}>UNAUTHORIZED <br/> <span style={{ color: 'var(--primary)' }}>ACCESS</span></h1>
            <p style={{ color: '#aaa', fontSize: '1.2rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              Account {steamId && <span style={{ color: '#fff' }}>[{steamId}]</span>} has no active surveillance contract.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
            
            {/* Monthly Plan */}
            <div className="premium-card" style={{ textAlign: 'left', border: '1px solid #333' }}>
              <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.75rem', marginBottom: '1rem' }}>RECURRING CONTRACT</div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>MONTHLY TACTICAL</h2>
              <div style={{ fontSize: '3.5rem', marginBottom: '2rem' }}>$9.99 <span style={{ fontSize: '1rem', color: '#555' }}>/ MO</span></div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: '#888', fontWeight: 700, fontSize: '0.9rem' }}>
                <li>[+] FULL MODULE ACCESS</li>
                <li>[+] REAL-TIME DISCORD ALERTS</li>
                <li>[+] CCTV REMOTE TERMINAL</li>
                <li>[+] CANCEL ANYTIME</li>
              </ul>
              <button onClick={() => handleBuy('monthly')} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                SELECT PLAN <ChevronRight size={18} />
              </button>
            </div>

            {/* Annual Plan */}
            <div className="premium-card" style={{ textAlign: 'left', border: '1px solid var(--primary)', background: 'rgba(206, 66, 43, 0.05)' }}>
              <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.75rem', marginBottom: '1rem' }}>BEST VALUE (25% SAVINGS)</div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>ANNUAL STRATEGIC</h2>
              <div style={{ fontSize: '3.5rem', marginBottom: '2rem' }}>$89.99 <span style={{ fontSize: '1rem', color: '#555' }}>/ YR</span></div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: '#ccc', fontWeight: 700, fontSize: '0.9rem' }}>
                <li>[+] EVERYTHING IN MONTHLY</li>
                <li>[+] PRIORITY ALPHA SUPPORT</li>
                <li>[+] FOUNDER STATUS</li>
                <li>[+] 12 MONTHS OF DOMINANCE</li>
              </ul>
              <button onClick={() => handleBuy('annual')} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                GET ANNUAL PASS <ChevronRight size={18} />
              </button>
            </div>

          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
            <Link href="/" style={{ color: '#555', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowLeft size={16} /> RETURN TO MAIN TERMINAL
            </Link>
            <div style={{ opacity: 0.2, display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <Radio size={24} /> <div style={{ fontWeight: 900, fontFamily: 'Roboto' }}>HK SENTINEL</div>
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
