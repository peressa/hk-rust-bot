"use client";

import React, { useState } from "react";
import { Send, User } from "lucide-react";

export default function TeamChat({ messages = [] }: { messages?: any[] }) {
  const [input, setInput] = useState("");

  return (
    <div className="premium-card" style={{ height: '700px', display: 'flex', flexDirection: 'column', padding: '0' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.02)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Chat de Equipo</h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mantenlo táctico, soldado.</span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
            No hay mensajes aún. Comienza la conversación.
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{ 
              alignSelf: msg.me ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem'
            }}>
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)', 
                display: 'flex', 
                justifyContent: msg.me ? 'flex-end' : 'flex-start',
                gap: '0.5rem',
                alignItems: 'center'
              }}>
                {!msg.me && <User size={12} />} {msg.user}
              </div>
              <div style={{ 
                padding: '0.75rem 1rem', 
                borderRadius: '12px',
                background: msg.me ? 'var(--primary)' : 'var(--secondary)',
                color: 'white',
                fontSize: '0.95rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                {msg.text}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem' }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe un mensaje al equipo..." 
          style={{ flex: 1 }}
          onKeyDown={(e) => e.key === 'Enter' && setInput("")}
        />
        <button className="btn-primary" style={{ padding: '0.75rem' }} onClick={() => setInput("")}>
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
