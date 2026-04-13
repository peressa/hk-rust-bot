import React from "react";
import { Users, MapPin, Heart, Wifi, WifiOff } from "lucide-react";

interface TeamMember {
  steamId: string;
  name: string;
  x: number;
  y: number;
  isOnline: boolean;
  isAlive: boolean;
  grid?: string;
  lastDeathTime?: number;
}

export default function TeamRoster({ members }: { members: TeamMember[] }) {
  // Sort: online first, then by name
  const sortedMembers = [...members].sort((a, b) => {
    if (a.isOnline === b.isOnline) return a.name.localeCompare(b.name);
    return a.isOnline ? -1 : 1;
  });

  return (
    <div className="premium-card" style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      padding: '1.25rem',
      gap: '1.25rem',
      height: '100%',
      minHeight: 0,
      background: '#050505',
      borderRight: '2px solid var(--border)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ 
            fontFamily: 'Bebas Neue', 
            fontSize: '1.25rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            color: 'white',
            letterSpacing: '0.05em'
        }}>
            <Users size={18} /> ROSTER_EQUIPO
        </h3>
        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)' }}>
            ONLINE: {members.filter(m => m.isOnline).length} / {members.length}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {sortedMembers.map((member) => (
          <div key={member.steamId} style={{ 
            padding: '0.75rem', 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            opacity: member.isOnline ? 1 : 0.5
          }}>
             <div style={{ position: 'relative' }}>
                <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    background: '#111', 
                    border: `1px solid ${member.isOnline ? 'var(--primary)' : '#444'}` 
                }}></div>
                <div style={{ 
                    position: 'absolute', 
                    bottom: -2, 
                    right: -2, 
                    width: '10px', 
                    height: '10px', 
                    background: member.isOnline ? '#22c55e' : '#666',
                    border: '2px solid #050505'
                }}></div>
             </div>

             <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {member.name.toUpperCase()}
                    </span>
                    {!member.isAlive && (
                        <span style={{ fontSize: '0.6rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.1rem 0.3rem', fontWeight: 900 }}>DEAD</span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.2rem', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <MapPin size={10} color={member.isOnline ? 'var(--primary)' : 'inherit'} /> {member.grid || '---'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Heart size={10} color={member.isAlive ? '#22c55e' : '#ef4444'} /> {member.isAlive ? 'VITAL' : 'KIA'}
                    </span>
                </div>
             </div>

             <div style={{ color: member.isOnline ? 'var(--primary)' : '#333' }}>
                {member.isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
