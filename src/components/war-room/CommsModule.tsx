"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, RefreshCw, Shield } from "lucide-react";

interface CommsModuleProps {
  serverId: string;
}

export default function CommsModule({ serverId }: CommsModuleProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChat();
    const interval = setInterval(fetchChat, 3000);
    return () => clearInterval(interval);
  }, [serverId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchChat = async () => {
    try {
      const res = await fetch(`/api/rustplus/chat?serverId=${serverId}`);
      const data = await res.json();
      if (!data.error) {
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/rustplus/chat", {
        method: "POST",
        body: JSON.stringify({
          serverId,
          message: newMessage
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al enviar");
      } else {
        setNewMessage("");
        fetchChat();
      }
    } catch (err) {
      setError("Error de red");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '1.5rem', paddingTop: '6rem' }}>
       <h2 style={{ fontSize: '3.5rem', fontFamily: 'var(--font-barlow)', lineHeight: 1, marginBottom: '0.5rem' }}>Canal de Radio</h2>
       <div style={{ color: 'var(--primary)', letterSpacing: '0.4em', fontSize: '0.7rem', marginBottom: '2rem' }}>Transmisión Segura</div>

       <div className="premium-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', background: 'rgba(5,5,5,0.8)' }}>
          <div 
            ref={scrollRef}
            style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            {messages.length === 0 ? (
               <div style={{ textAlign: 'center', opacity: 0.2, marginTop: '20%' }}>
                  <MessageSquare size={48} style={{ margin: '0 auto 1rem' }} />
                  <p style={{ fontFamily: 'var(--font-barlow)', letterSpacing: '0.1em' }}>SIN_SEÃ‘AL_DETECTADA</p>
               </div>
            ) : (
               messages.map((msg, i) => (
                  <div key={i} style={{ borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '1rem' }}>
                     <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--primary)', fontFamily: 'var(--font-barlow)' }}>{msg.name?.toUpperCase()}</span>
                        <span style={{ fontSize: '0.6rem', opacity: 0.3 }}>[{new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span>
                     </div>
                     <div style={{ fontSize: '0.9rem', color: '#ccc' }}>{msg.message}</div>
                  </div>
               ))
            )}
          </div>

          <form onSubmit={handleSend} style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', background: 'rgba(5,5,5,0.9)' }}>
             <div style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Transmitir mensaje..."
                  style={{ flex: 1, background: '#000', border: '1px solid var(--border)', color: 'white', fontFamily: 'var(--font-barlow)', fontSize: '1.1rem', padding: '0.75rem 1rem' }}
                />
                <button type="submit" disabled={sending || !newMessage.trim()} style={{ background: 'var(--primary)', border: 'none', padding: '0 1.5rem', color: 'white', cursor: 'pointer', transition: '0.1s' }}>
                   {sending ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
             </div>
             {error && <div style={{ color: '#ef4444', fontSize: '0.6rem', marginTop: '0.5rem', fontWeight: 900 }}>[ERROR]: {error.toUpperCase()}</div>}
          </form>
       </div>
    </div>
  );
}
