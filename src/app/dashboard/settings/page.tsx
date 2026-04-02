"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Settings, ShieldCheck, Cpu, Bell, ExternalLink, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const [authToken, setAuthToken] = useState("");
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fcm/register", {
        method: "POST",
        body: JSON.stringify({ authToken })
      });
      const data = await res.json();
      if (res.ok) {
        alert("¡Registro exitoso! Tu dispositivo ahora está vinculado con Facepunch.");
        fetchStatus();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/fcm/status");
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Settings color="var(--primary)" /> Configuración de Identidad
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Configura tu conexión con los servicios oficiales de Rust.</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Status Section */}
          <section className="premium-card">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="#22c55e" /> Estado del Dispositivo Virtual
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <StatusBox 
                label="FCM Listener" 
                value={status?.listening ? "Activo" : "Inactivo"} 
                color={status?.listening ? "#22c55e" : "var(--text-muted)"} 
              />
              <StatusBox 
                label="Credenciales FCM" 
                value={status?.hasKeys ? "Configuradas" : "Pendientes"} 
                color={status?.hasKeys ? "#22c55e" : "#ef4444"} 
              />
            </div>
          </section>

          {/* Registration Section */}
          <section className="premium-card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={20} color="var(--primary)" /> Vincular con Facepunch
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Para recibir notificaciones de "Pairing" directamente en esta web, necesitas registrar tu navegador como un dispositivo virtual.
            </p>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Rust+ Auth Token</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  type="password" 
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  placeholder="Introduce tu Token de Autenticación..." 
                  style={{ flex: 1 }}
                />
                <button 
                  className="btn-primary" 
                  disabled={loading || !authToken}
                  onClick={handleRegister}
                >
                  {loading ? <RefreshCw size={18} className="animate-spin" /> : "Vincular Ahora"}
                </button>
              </div>
              <a 
                href="https://companion-rust.facepunch.com/" 
                target="_blank" 
                style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                ¿Dónde consigo mi token? <ExternalLink size={12} />
              </a>
            </div>
          </section>

          <section className="premium-card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={20} color="var(--primary)" /> Notificaciones y Persistencia
            </h3>
            <p style={{ fontSize: '0.85rem' }}>
              Una vez vinculado, las notificaciones de emparejamiento llegarán automáticamente. 
            </p>
            <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <p style={{ fontSize: '0.75rem', color: '#fca5a5', margin: 0 }}>
                <strong>⚠️ Nota para Coolify:</strong> Para que tus credenciales no se borren en cada actualización, asegúrate de añadir un <strong>Volume</strong> en tu panel de Coolify mapeando la carpeta <code>/app/data</code>.
              </p>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatusBox({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '1.1rem', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
