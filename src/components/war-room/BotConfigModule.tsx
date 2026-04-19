"use client";

import React, { useState, useEffect } from "react";
import { Settings, MessageSquare, Info, Save, RotateCcw, AlertTriangle } from "lucide-react";

interface BotConfigModuleProps {
  serverId: string;
  initialPrefix?: string;
  initialTemplates?: Record<string, string>;
}

const DEFAULT_TEMPLATES = {
  cmd_time: "Hora: {time} ({remaining})",
  cmd_pop: "Población: {players}/{maxPlayers} online (Cola: {queued})",
  cmd_wipe: "Último Wipe: {date}",
  cmd_wipe_none: "No hay datos del Wipe.",
  cmd_events: "Eventos Activos: {list}",
  cmd_events_none: "No hay eventos globales activos en este momento.",
  cmd_team: "Equipo: {online}/{total} Online. {details}",
  cmd_map: "Mapa: {map} (Tamaño: {size} | Seed: {seed})",
  cmd_dashboard_reminder: "Utiliza el Dashboard para ver el mapa y cámaras.",
  alert_death: "El miembro del equipo '{name}' ha muerto mientras estaba {status} @ {grid} (Coord: {x}, {y}{timeStr})",
  alert_afk_start: "El miembro del equipo '{name}' lleva AFK {mins} minutos en {grid}",
  alert_afk_end: "El miembro del equipo '{name}' ya no está AFK después de {mins} minutos en {grid}",
  event_cargo_start: "Un Barco de Carga (Cargo Ship) está activo en {region} ({grid})",
  event_cargo_exit: "El Barco de Carga (Cargo Ship) ha salido del mapa.",
  event_cargo_dock: "El Barco de Carga (Cargo Ship) ha atracado en {grid} ({monumentName})",
  event_heli_start: "Un Helicóptero de Patrulla está activo en {region} ({grid})",
  event_chinook_start: "Un Chinook CH-47 con caja fuerte está activo en {region} ({grid})",
  event_oilrig_crate: "¡Oil Rig (Petro) activo en {grid}! Caja fuerte detectada.",
  event_crate: "¡Caja Fuerte (Locked Crate) detectada en {grid}!",
  event_deepsea: "¡Deepsea Event iniciado en el {region} ({grid})! Vendedor de Casino detectado.",
  event_vending_new: "¡Nueva máquina expendedora '{name}' con {stock} artículos en stock en {grid}!"
};

const TEMPLATE_DESCRIPTIONS: Record<string, string> = {
  cmd_time: "Respuesta al comando !time. {time}, {remaining}",
  cmd_pop: "Respuesta a !pop. {players}, {maxPlayers}, {queued}",
  alert_death: "Notificación de muerte. {name}, {status}, {grid}, {x}, {y}, {timeStr}",
  event_cargo_start: "Cuando entra el barco. {region}, {grid}",
  event_vending_new: "Nueva tienda detectada. {name}, {stock}, {grid}"
};

export default function BotConfigModule({ serverId, initialPrefix, initialTemplates }: BotConfigModuleProps) {
  const [prefix, setPrefix] = useState(initialPrefix || ":exclamation:");
  const [templates, setTemplates] = useState<Record<string, string>>(initialTemplates || DEFAULT_TEMPLATES);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // Asegurarse de que tenemos todas las claves, incluso las nuevas
    setTemplates(prev => ({ ...DEFAULT_TEMPLATES, ...prev, ...initialTemplates }));
  }, [initialTemplates]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/servers", {
        method: "POST",
        body: JSON.stringify({
          serverId,
          botPrefix: prefix,
          botTemplates: templates
        })
      });
      if (res.ok) {
        setMessage({ text: "Configuración guardada correctamente. Reinicia el bot si es necesario.", type: 'success' });
      } else {
        setMessage({ text: "Error al guardar la configuración.", type: 'error' });
      }
    } catch (err) {
      setMessage({ text: "Fallo de red al guardar.", type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const updateTemplate = (key: string, val: string) => {
    setTemplates(prev => ({ ...prev, [key]: val }));
  };

  const resetToDefault = (key: string) => {
    setTemplates(prev => ({ ...prev, [key]: (DEFAULT_TEMPLATES as any)[key] }));
  };

  return (
    <div style={{ padding: '2rem', height: '100%', overflowY: 'auto', background: '#0a0a0b' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'var(--font-barlow)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Settings color="var(--primary)" /> CONFIGURACIÓN DEL BOT
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Personaliza el prefijo y todos los mensajes que el robot envía al chat del equipo.
          </p>
        </header>

        {message && (
          <div style={{ 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '2rem', 
            background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            color: message.type === 'success' ? '#22c55e' : '#ef4444',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            {message.type === 'success' ? <Save size={18} /> : <AlertTriangle size={18} />}
            {message.text}
          </div>
        )}

        <section style={{ marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem' }}>Símbolo de Identidad (Prefijo)</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input 
              type="text" 
              value={prefix} 
              onChange={(e) => setPrefix(e.target.value)}
              placeholder=":exclamation:"
              style={{ width: '120px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 900, background: 'rgba(255,255,255,0.03)' }}
            />
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Se antepondrá a todos los mensajes. Puedes usar texto o emojis.
            </div>
          </div>
        </section>

        <section>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: '1.5rem' }}>Diccionario de Mensajes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {Object.keys(DEFAULT_TEMPLATES).map(key => (
              <div key={key} className="premium-card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{key}</label>
                  <button onClick={() => resetToDefault(key)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}>
                    <RotateCcw size={10} /> Reset
                  </button>
                </div>
                <textarea 
                  value={templates[key] || ""}
                  onChange={(e) => updateTemplate(key, e.target.value)}
                  style={{ 
                    width: '100%', 
                    background: 'rgba(0,0,0,0.3)', 
                    border: '1px solid rgba(255,255,255,0.05)', 
                    borderRadius: '4px', 
                    color: '#ccc', 
                    padding: '0.75rem', 
                    fontSize: '0.9rem', 
                    minHeight: '60px',
                    fontFamily: 'inherit'
                  }}
                />
                {TEMPLATE_DESCRIPTIONS[key] && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'rgba(34, 197, 94, 0.4)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Info size={10} /> {TEMPLATE_DESCRIPTIONS[key]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <footer style={{ 
          marginTop: '4rem', 
          padding: '2rem 0', 
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button 
            className="btn-primary" 
            style={{ padding: '1rem 3rem', fontSize: '1rem' }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <RotateCcw size={20} className="animate-spin" /> : "GUARDAR CONFIGURACIÓN"}
          </button>
        </footer>
      </div>
    </div>
  );
}
