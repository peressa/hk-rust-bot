import React, { useEffect, useRef } from "react";
import { Skull, Bell, Zap, Radio, Clock } from "lucide-react";

interface IntelItem {
  id: string;
  type: 'DEATH' | 'EVENT' | 'RAID' | 'SYS';
  message: string;
  timestamp: number;
  data?: any;
}

export default function IntelFeed({ log }: { log: IntelItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [log]);

  return (
    <div className="premium-card" style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      padding: '1.25rem',
      gap: '1rem',
      height: '100%',
      minHeight: 0,
      background: '#050505',
      borderLeft: '2px solid var(--border)'
    }}>
      <h3 style={{ 
        fontFamily: 'var(--font-barlow)', 
        fontSize: '1.25rem', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        color: 'var(--primary)',
        letterSpacing: '0.05em'
      }}>
        <Radio size={18} className="animate-pulse" /> Registro de Actividad
      </h3>

      <div 
        ref={scrollRef}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.75rem',
          paddingRight: '0.5rem'
        }}
      >
        {log.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.3, fontSize: '0.7rem', fontWeight: 900 }}>
             Esperando actividad...
          </div>
        ) : (
          log.map((item) => (
            <div key={item.id} className="animate-fade-in" style={{ 
              padding: '0.75rem', 
              background: 'rgba(255,255,255,0.02)', 
              borderLeft: `2px solid ${getTypeColor(item.type)}`,
              fontSize: '0.8rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ 
                    fontWeight: 900, 
                    color: getTypeColor(item.type), 
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                }}>
                  {getTypeIcon(item.type)} {item.type}
                </span>
                <span style={{ fontSize: '0.65rem', opacity: 0.4, fontWeight: 700 }}>
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p style={{ fontWeight: 600, color: '#ddd', margin: 0 }}>{item.message}</p>
              {item.data?.grid && (
                <div style={{ marginTop: '0.25rem', fontSize: '0.7rem', fontWeight: 900, color: 'var(--primary)' }}>
                   UBICACIÓN: {item.data.grid}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getTypeColor(type: string) {
  switch (type) {
    case 'DEATH': return '#ef4444';
    case 'EVENT': return '#fbbf24';
    case 'RAID': return '#f87171';
    case 'SYS': return '#3b82f6';
    default: return '#888';
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'DEATH': return <Skull size={10} />;
    case 'EVENT': return <Bell size={10} />;
    case 'RAID': return <Zap size={10} />;
    case 'SYS': return <Clock size={10} />;
    default: return null;
  }
}
