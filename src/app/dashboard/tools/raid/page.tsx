"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { RAID_TARGETS } from "@/lib/data/raid";
import { Calculator, Target, Zap, Waves, Bomb, Flame } from "lucide-react";

export default function RaidCalculatorPage() {
  const [selectedTargets, setSelectedTargets] = useState<any[]>([]);

  const addTarget = (key: string) => {
    setSelectedTargets([...selectedTargets, { ...RAID_TARGETS[key], id: Date.now() }]);
  };

  const removeTarget = (id: number) => {
    setSelectedTargets(selectedTargets.filter(t => t.id !== id));
  };

  const totals = selectedTargets.reduce((acc, curr) => ({
    c4: acc.c4 + curr.costs.c4,
    rocket: acc.rocket + curr.costs.rocket,
    satchel: acc.satchel + curr.costs.satchel,
    explosiveAmmo: acc.explosiveAmmo + curr.costs.explosiveAmmo,
  }), { c4: 0, rocket: 0, satchel: 0, explosiveAmmo: 0 });

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Calculator color="var(--primary)" className="glow" /> Calculadora de Raideo
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Analiza los costos de demolición técnica para tu próximo asalto.</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
          {/* Selector de Objetivos */}
          <section>
            <div className="premium-card">
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Target size={20} color="var(--primary)" /> Selecciona Estructuras
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                {Object.keys(RAID_TARGETS).map(key => (
                  <button 
                    key={key} 
                    onClick={() => addTarget(key)}
                    style={{ 
                      background: 'rgba(255,255,255,0.03)', 
                      border: '1px solid var(--border)', 
                      padding: '1rem', 
                      borderRadius: '12px',
                      color: 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                    className="raid-btn-hover"
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{RAID_TARGETS[key].name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Costo Rocket: {RAID_TARGETS[key].costs.rocket}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Listado de Selección actual */}
            <div className="premium-card" style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Plan de Asalto ({selectedTargets.length} items)</h3>
              {selectedTargets.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.3, border: '1px dashed var(--border)', borderRadius: '8px' }}>
                  Añade estructuras para calcular el total.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedTargets.map(t => (
                    <div key={t.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem 1.25rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{t.name}</span>
                      <button 
                        onClick={() => removeTarget(t.id)} 
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.7rem' }}
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Resumen de Totales */}
          <aside>
            <div className="premium-card" style={{ position: 'sticky', top: '2rem', border: '1px solid var(--primary)', background: 'linear-gradient(165deg, rgba(205,65,43,0.1), transparent)' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={18} color="var(--primary)" /> Totales Estimados
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <TotalLine icon={<Bomb color="#ef4444" size={16}/>} label="C4 Requerido" value={totals.c4} />
                <TotalLine icon={<Waves color="#3b82f6" size={16}/>} label="Cohetes (Rockets)" value={totals.rocket} />
                <TotalLine icon={<Flame color="#fbbf24" size={16}/>} label="Satchels" value={totals.satchel} />
                <TotalLine icon={<Zap color="var(--primary)" size={16}/>} label="Munición Explosiva" value={totals.explosiveAmmo} />
                
                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  * Los cálculos asumen daño directo al punto más débil. Utiliza lanzagranadas para puertas dobles si es posible.
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style jsx>{`
        .raid-btn-hover:hover {
          background: rgba(205,65,43,0.1) !important;
          border-color: var(--primary) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </DashboardLayout>
  );
}

function TotalLine({ icon, label, value }: { icon: any, label: string, value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '8px' }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{value}</div>
      </div>
    </div>
  );
}
