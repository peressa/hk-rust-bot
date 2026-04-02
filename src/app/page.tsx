import Image from "next/image";
import styles from "./page.module.css";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(getAuthOptions());

  // Si el usuario ya está logueado, mandarlo al dashboard directamente
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="animate-fade-in">
      <main className={styles.hero}>
        <div className={styles.logoContainer}>
          <Image
            src="/logo.png"
            alt="Rust Plus Web Logo"
            width={160}
            height={160}
            className={styles.logo}
            priority
          />
        </div>
        
        <h1 className={styles.title}>Rust Plus Web</h1>
        <p className={styles.subtitle}>
          Controla tu base, chatea con tu equipo y mantente a salvo desde cualquier lugar. 
          La potencia de Rust Plus Desktop, ahora totalmente en la web para que puedas acceder desde tu VPS o móvil.
        </p>

        <div className={styles.ctas}>
          <a href="/api/auth/signin?callbackUrl=/dashboard" className="btn-primary">
            <svg width="24" height="24" viewBox="0 0 24 21" fill="currentColor" style={{ marginRight: '1rem' }}>
              <path d="M12 0C5.372 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.776-.2-1.959.042-2.801.219-.762 1.411-5.991 1.411-5.991s-.361-.722-.361-1.79c0-1.677.973-2.93 2.185-2.93 1.03 0 1.528.773 1.528 1.698 0 1.035-.66 2.581-.999 4.016-.284 1.201.599 2.18 1.782 2.18 2.14 0 3.782-2.257 3.782-5.513 0-2.883-2.072-4.9-5.033-4.9-3.428 0-5.441 2.571-5.441 5.23 0 1.035.398 2.146.896 2.748.1.121.114.227.085.344l-.329 1.341c-.053.216-.174.262-.401.157-1.493-.695-2.427-2.879-2.427-4.632 0-3.772 2.74-7.234 7.901-7.234 4.148 0 7.371 2.955 7.371 6.907 0 4.122-2.599 7.44-6.205 7.44-1.211 0-2.35-.629-2.739-1.372 0 0-.599 2.278-.744 2.834-.27 1.026-1.002 2.308-1.491 3.102 1.124.347 2.316.535 3.551.535 6.628 0 12-5.372 12-12S18.628 0 12 0z"/>
            </svg>
            Conectarse con Steam
          </a>
        </div>

        <div className={styles.features}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📡</div>
            <h3 className={styles.featureTitle}>Control Remoto</h3>
            <p className={styles.featureDesc}>Enciende luces, activa torretas y gestiona tus Smart Switches en tiempo real.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💬</div>
            <h3 className={styles.featureTitle}>Chat de Equipo</h3>
            <p className={styles.featureDesc}>Mantente en contacto con tus compañeros sin entrar al juego.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🗺️</div>
            <h3 className={styles.featureTitle}>Mapa Táctico</h3>
            <p className={styles.featureDesc}>Visualiza el mapa oficial, monumentos y la posición de tu equipo.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📹</div>
            <h3 className={styles.featureTitle}>Cámaras CCTV</h3>
            <p className={styles.featureDesc}>Vigila tu base desde cualquier navegador con soporte para cámaras y torretas.</p>
          </div>
        </div>
      </main>

      <footer style={{ padding: '2rem', textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>
        &copy; 2026 Rust Plus Web - Potenciado por HK Team
      </footer>
    </div>
  );
}
