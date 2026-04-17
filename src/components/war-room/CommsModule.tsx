"use client";

import React, { useState, useEffect, useRef } from "react";
import { Radio, Send, Users, Shield, MessageSquare } from "lucide-react";

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  steamId?: string;
}

export default function CommsModule({ serverId }: { serverId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [serverId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/rustplus/comms?serverId=${serverId}`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch (err) {
      console.error("Comms fetch error:", err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      await fetch(`/api/rustplus/comms`, {
        method: "POST",
        body: JSON.stringify({ serverId, message: input })
      });
      setInput("");
      fetchMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 0, background: '#050505' }}>
      <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontFamily: 'var(--font-barlow)', fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
          <Radio size={18} /> Canal de Radio
        </h3>
        <span style={{ fontSize: '0.65rem', color: '#444', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Encriptado End-To-End
        </span>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--primary)', fontFamily: 'var(--font-barlow)' }}>
                {msg.sender.toUpperCase()}
              </span>
              <span style={{ fontSize: '0.6rem', color: '#333' }}>
                {(() => {
                  try {
                    const d = new Date(msg.timestamp);
                    return isNaN(d.getTime()) ? "..." : d.toLocaleTimeString();
                  } catch (e) {
                    return "...";
                  }
                })()}
              </span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderLeft: '2px solid #222', fontSize: '0.85rem', color: '#ccc', lineHeight: 1.4 }}>
              {msg.text}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1, flexDirection: 'column', gap: '1rem' }}>
             <MessageSquare size={48} />
             <span style={{ fontSize: '0.7rem', fontWeight: 900 }}>TRANSMISIÓN VACÍA</span>
          </div>
        )}
      </div>

      <div style={{ padding: '1rem', background: '#0a0a0b', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Transmitir mensaje..."
          style={{ 
            flex: 1, 
            background: '#000', 
            border: '1px solid #222', 
            padding: '0.75rem', 
            color: 'white', 
            fontSize: '0.8rem',
            fontFamily: 'var(--font-roboto)'
          }}
        />
        <button 
          onClick={sendMessage}
          disabled={loading}
          style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0 1.25rem', cursor: 'pointer' }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
