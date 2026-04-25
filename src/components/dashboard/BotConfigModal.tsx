"use client";

import React, { useState } from "react";
import { Settings, Save, X, MessageSquare, Terminal } from "lucide-react";

interface BotConfigModalProps {
  serverId: string;
  initialPrefix?: string;
  initialTemplates?: any;
  onClose: () => void;
  onSave: () => void;
}

export default function BotConfigModal({ serverId, initialPrefix = "!", initialTemplates = {}, onClose, onSave }: BotConfigModalProps) {
  const [prefix, setPrefix] = useState(initialPrefix);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await fetch("/api/rustplus/settings", {
        method: "POST",
        body: JSON.stringify({ serverId, prefix })
      });
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.9)',
      zIndex: 10000,
      display: 'grid',
      placeItems: 'center',
      backdropFilter: 'blur(10px)'
    }}>
      <div className="premium-card" style={{ width: '500px', padding: '2rem', border: '1px solid var(--primary)' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'var(--font-barlow)', fontSize: '1.5rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Settings color="var(--primary)" /> CONFIGURACIÓN DEL BOT
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X /></button>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              <Terminal size={14} /> Prefijo de Comandos
            </label>
            <input 
              type="text" 
              value={prefix} 
              onChange={(e) => setPrefix(e.target.value)} 
              style={{ width: '100%', padding: '0.75rem', background: '#0a0a0a', border: '1px solid var(--border)', color: 'white', fontFamily: 'monospace', fontSize: '1.2rem' }}
            />
          </div>

          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border)', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '0.8rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={14} /> Sistema de Plantillas
            </h4>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Las plantillas de respuesta personalizadas estarán disponibles en la próxima actualización del Panel Pro. 
              Por ahora, puedes cambiar el prefijo global del bot.
            </p>
          </div>

          <button 
            className="btn-primary" 
            style={{ width: '100%', padding: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
            onClick={handleSave}
            disabled={loading}
          >
            <Save size={18} /> {loading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
