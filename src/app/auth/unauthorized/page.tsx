"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, MessageCircle, ArrowLeft, Check, Zap, Rocket } from "lucide-react";

export default function UnauthorizedPage() {
  const searchParams = useSearchParams();
  const steamId = searchParams.get("steamId");

  const handleBuy = (mode: string) => {
    // URL de ejemplo de Lemon Squeezy Checkout
    // Nota: El usuario debe reemplazar estos enlaces por sus links reales
    const checkoutUrls: any = {
      monthly: "https://hkbot.lemonsqueezy.com/checkout/buy/tu-id-producto-mensual",
      lifetime: "https://hkbot.lemonsqueezy.com/checkout/buy/tu-id-producto-unico"
    };

    let url = checkoutUrls[mode];
    if (steamId) {
      // Pasar el SteamID en custom_data para la activación automática del webhook
      url += `?checkout[custom][steam_id]=${steamId}`;
    }
    
    window.open(url, "_blank");
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'radial-gradient(circle at center, #1a1a1a 0%, #000 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '900px', width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            background: 'rgba(239, 68, 68, 0.1)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 1.5rem' 
          }}>
            <ShieldAlert size={30} color="#ef4444" />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: '1rem' }}>Desbloquea el Poder de HK Rust Bot</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Tu cuenta {steamId && <code style={{ color: 'var(--primary)' }}>({steamId})</code>} no tiene una licencia activa. 
            Elige un plan para activar tu acceso instantáneamente.
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {/* Plan Mensual */}
          <div className="premium-card" style={{ padding: '2.5rem', border: '1px solid var(--border)', position: 'relative' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '1rem' }}>Plan Táctico</div>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>$9.99 <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ mes</span></h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Ideal para wipes intensos y control total de clanes.</p>
            
            <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0, marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <FeatureItem text="Alertas de Muerte en Discord" />
              <FeatureItem text="Radar de Eventos Globales (Cargo/Heli)" />
              <FeatureItem text="Control de Equipos Ilimitado" />
              <FeatureItem text="Soporte Prioritario" />
            </ul>

            <button onClick={() => handleBuy('monthly')} className="btn-primary" style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Zap size={18} /> Adquirir Ahora
            </button>
          </div>

          {/* Plan Pro / Lifetime */}
          <div className="premium-card" style={{ padding: '2.5rem', border: '2px solid var(--primary)', transform: 'scale(1.05)', background: 'linear-gradient(165deg, rgba(205,65,43,0.05), transparent)' }}>
            <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', padding: '2px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800 }}>MÁS POPULAR</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '1rem' }}>Acceso Vitalicio</div>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>$49.99 <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>pago único</span></h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Olvídate de las cuotas. HK Bot para siempre.</p>
            
            <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0, marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <FeatureItem text="Todo lo del plan mensual" />
              <FeatureItem text="Sin renovaciones automáticas" />
              <FeatureItem text="Acceso a futuras betas" />
              <FeatureItem text="Insignia de Donador en Discord" />
            </ul>

            <button onClick={() => handleBuy('lifetime')} className="btn-primary" style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Rocket size={18} /> Acceso VIP
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>¿Prefieres pagar con Cripto o tienes dudas?</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a 
              href="https://discord.gg/TU_INVITACION"
              target="_blank"
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <MessageCircle size={18} /> Contactar Soporte
            </a>
            <Link 
              href="/"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', padding: '0.5rem 1rem' }}
            >
              <ArrowLeft size={16} /> Volver
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
      <Check size={16} color="#22c55e" /> {text}
    </li>
  );
}
