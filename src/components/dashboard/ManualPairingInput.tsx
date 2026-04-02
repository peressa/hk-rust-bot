"use client";

import React, { useState } from "react";
import { Send, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

export default function ManualPairingInput({ onPaired }: { onPaired: () => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handlePair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.startsWith("rustplus://")) {
      setStatus({ type: 'error', msg: 'El enlace debe empezar por rustplus://' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/rustplus/pair-url", {
        method: "POST",
        body: JSON.stringify({ url })
      });
      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', msg: `¡Servidor "${data.server?.name}" enlazado con éxito!` });
        setUrl("");
        setTimeout(() => {
          onPaired();
        }, 1500);
      } else {
        setStatus({ type: 'error', msg: data.error || 'Error al procesar el enlace.' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'Error de conexión con la API.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <form onSubmit={handlePair} style={{ display: 'flex', gap: '0.75rem' }}>
        <input 
          type="text" 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Pega aquí el enlace rustplus://..."
          style={{ 
            flex: 1, 
            background: 'rgba(0,0,0,0.2)', 
            border: '1px solid var(--border)',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            color: 'white',
            fontSize: '0.9rem'
          }}
        />
        <button 
          type="submit" 
          className="btn-primary" 
          disabled={loading || !url.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
        >
          {loading ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
          Emparejar
        </button>
      </form>

      {status && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.75rem', 
          borderRadius: '6px', 
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: status.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: status.type === 'success' ? '#22c55e' : '#ef4444',
          border: `1px solid ${status.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
        }}>
          {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {status.msg}
        </div>
      )}
    </div>
  );
}
