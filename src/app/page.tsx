import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";
import { 
  ShieldAlert, 
  Terminal, 
  Map as MapIcon, 
  Crosshair, 
  Radio, 
  Activity, 
  ChevronRight,
  Wifi,
  Lock,
  Zap,
  Monitor
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const session = await getServerSession(getAuthOptions());

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* Facepunch Style Sticky Nav */}
      <nav style={{ 
        padding: '0.75rem 4rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '24px', height: '24px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Radio size={16} color="white" />
            </div>
            RUST<span style={{ color: 'var(--primary)' }}>OPS</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginLeft: '2rem' }}>
            <NavLink label="OPERATIONS" href="#news" />
            <NavLink label="INTEL" href="/dashboard" />
            <NavLink label="COMMS" href="https://discord.gg/yourserver" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/api/auth/signin" className="btn-primary" style={{ padding: '0.6rem 2rem', fontSize: '0.8rem' }}>
            DEPLOY TERMINAL
          </Link>
        </div>
      </nav>

      {/* Hero with EXACT Official Video Background */}
      <section style={{ 
        height: '100vh', 
        position: 'relative', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center',
        background: '#000'
      }}>
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
            opacity: 0.5,
            zIndex: 0
          }}
        >
          <source src="https://files.facepunch.com/paddy/20210324/rust_site2021_hero_v002.mp4" type="video/mp4" />
        </video>
        
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'linear-gradient(to top, #000 0%, transparent 60%, rgba(0,0,0,0.6) 100%)',
          zIndex: 1
        }}></div>

        <div className="animate-fade-in" style={{ position: 'relative', zIndex: 2, maxWidth: '1200px', padding: '0 2rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.3em', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
            // CLAN INTELLIGENCE SUITE
          </div>
          <h1 style={{ fontSize: '12vw', lineHeight: 0.8, marginBottom: '2.5rem', letterSpacing: '-0.04em' }}>
            RUST <br/> OPS
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#888', maxWidth: '600px', margin: '0 auto 3.5rem', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em', lineHeight: 1.5 }}>
            Total tactical dominance. <br/>
            Real-time server data for high-tier operations.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/api/auth/signin" className="btn-primary" style={{ padding: '1.5rem 3rem' }}>
              RECLAIM ACCESS
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid - Clean Industrial */}
      <section id="news" style={{ padding: '10rem 4rem', maxWidth: '1400px', margin: '0 auto' }}>
        <h2 className="section-title">MISSION MODULES</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '2.5rem'
        }}>
          <RustGridItem 
            title="FIELD RADAR"
            desc="Triangulate member positions and enemy signatures via secure satellite uplink."
            icon={<MapIcon size={32} />}
          />
          <RustGridItem 
            title="KIA ALERTS"
            desc="Instant Discord notifications on member casualties with precise enemy coordinates."
            icon={<ShieldAlert size={32} />}
          />
          <RustGridItem 
            title="RAID ALERT"
            desc="Stay connected 24/7. Detect nearby combat and unauthorized structure changes."
            icon={<Activity size={32} />}
          />
          <RustGridItem 
            title="SMART CONTROL"
            desc="Manage your base electrical grid and CCTV cameras from any remote terminal."
            icon={<Monitor size={32} />}
          />
        </div>
      </section>

      {/* Pricing - Facepunch Style */}
      <section style={{ padding: '10rem 4rem', background: '#0a0a0a' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h2 className="section-title">SUBSCRIPTION PLANS</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '4rem' }}>
            
            {/* Monthly */}
            <div style={{ borderLeft: '4px solid #333', paddingLeft: '3rem' }}>
              <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.8rem', marginBottom: '1rem' }}>RECURRING</div>
              <h3 style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>TACTICAL MONTHLY</h3>
              <p style={{ color: '#888', marginBottom: '3rem', fontSize: '1.1rem' }}>Full access to all Sentinel modules. Billed every 30 days. Cancel anytime.</p>
              <div style={{ fontSize: '4rem', marginBottom: '3rem' }}>$9.99 <span style={{ fontSize: '1rem', color: '#555' }}>/ MONTH</span></div>
              <Link href="/api/auth/signin" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                SUBSCRIBE NOW <ChevronRight size={18} />
              </Link>
            </div>

            {/* Annual */}
            <div style={{ borderLeft: '4px solid var(--primary)', paddingLeft: '3rem' }}>
              <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.8rem', marginBottom: '1rem' }}>BEST VALUE (25% OFF)</div>
              <h3 style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>STRATEGIC ANNUAL</h3>
              <p style={{ color: '#888', marginBottom: '3rem', fontSize: '1.1rem' }}>The dedicated survivor's choice. 12 months of total dominance for $7.50/mo equivalent.</p>
              <div style={{ fontSize: '4rem', marginBottom: '3rem' }}>$89.99 <span style={{ fontSize: '1rem', color: '#555' }}>/ YEAR</span></div>
              <Link href="/api/auth/signin" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                GET ANNUAL PASS <ChevronRight size={18} />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Footer Minimalist */}
      <footer style={{ padding: '8rem 4rem', borderTop: '1px solid #111', color: '#444', fontSize: '0.75rem', fontWeight: 700 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: '#888', marginBottom: '1rem' }}>HK SENTINEL PROTOCOL</div>
            <p>&copy; 2026. ALL RIGHTS RESERVED.</p>
            <p style={{ marginTop: '0.5rem' }}>NOT AFFILIATED WITH FACEPUNCH STUDIOS.</p>
          </div>
          <div style={{ display: 'flex', gap: '4rem' }}>
            <FooterList title="SYSTEM" items={["Status", "Changelog", "Security"]} />
            <FooterList title="SOCIAL" items={["Discord", "Twitter", "Twitch"]} />
            <FooterList title="LEGAL" items={["Privacy", "Terms", "Support"]} />
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ label, href }: { label: string, href: string }) {
  return (
    <a href={href} style={{ color: '#888', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 900, transition: 'var(--transition)' }}>
      {label}
    </a>
  );
}

function RustGridItem({ title, desc, icon }: { title: string, desc: string, icon: React.ReactNode }) {
  return (
    <div className="premium-card">
      <div style={{ color: 'var(--primary)', marginBottom: '1.5rem' }}>{icon}</div>
      <h3 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{title}</h3>
      <p style={{ color: '#888', lineHeight: 1.4, fontSize: '1.1rem' }}>{desc}</p>
    </div>
  );
}

function FooterList({ title, items }: { title: string, items: string[] }) {
  return (
    <div>
      <div style={{ color: '#888', marginBottom: '1rem' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map(item => <div key={item}>{item}</div>)}
      </div>
    </div>
  );
}
