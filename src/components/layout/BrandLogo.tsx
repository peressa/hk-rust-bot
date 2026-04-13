import React from "react";
import { Target, Activity } from "lucide-react";

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function BrandLogo({ size = 'md', showText = true }: BrandLogoProps) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';
  
  const iconSize = isSm ? 18 : isLg ? 40 : 24;
  const fontSize = isSm ? '1rem' : isLg ? '3.5rem' : '1.25rem';
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: isSm ? '0.5rem' : isLg ? '1.5rem' : '0.75rem',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      cursor: 'default',
      pointerEvents: 'none'
    }}>
      <div style={{ 
        background: 'var(--primary)', 
        padding: isSm ? '3px' : isLg ? '8px' : '4px', 
        display: 'flex',
        borderRadius: '2px',
        boxShadow: isLg ? '0 0 30px rgba(206, 66, 43, 0.4)' : 'none',
        position: 'relative'
      }}>
        <Target color="white" size={iconSize} />
        {/* Live Heartbeat Dot */}
        <div style={{ 
            position: 'absolute', 
            top: -2, 
            right: -2, 
            width: '8px', 
            height: '8px', 
            background: '#22c55e', 
            borderRadius: '50%',
            border: '2px solid #050505',
            boxShadow: '0 0 5px #22c55e'
        }}></div>
      </div>
      
      {showText && (
        <h2 style={{ 
          fontSize: fontSize, 
          fontWeight: 800, 
          fontFamily: 'var(--font-barlow)', 
          letterSpacing: isLg ? '0.05em' : '-0.02em', 
          lineHeight: 1,
          margin: 0,
          color: '#fff',
          textTransform: 'uppercase'
        }}>
          RUST <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>OPS</span>
        </h2>
      )}
    </div>
  );
}
