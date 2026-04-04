"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Store, RefreshCw, ShoppingCart, Info } from "lucide-react";
import { getItemName } from "@/lib/data/items";

export default function VendingTrackerPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [vendingMachines, setVendingMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchServers();
  }, []);

  useEffect(() => {
    if (selectedServer) {
      fetchVendingData(selectedServer.id);
    }
  }, [selectedServer?.id]);

  const fetchServers = async () => {
    try {
      const res = await fetch("/api/servers");
      const data = await res.json();
      setServers(data);
      if (data.length > 0 && !selectedServer) setSelectedServer(data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendingData = async (serverId: string) => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/rustplus/markers?serverId=${serverId}`);
      if (!res.ok) throw new Error("Error fetching map markers");
      const data = await res.json();
      
      const markers = data.markers || [];
      // Type 3 is Vending Machine
      const vms = markers.filter((m: any) => m.type === 3 && m.sellOrders && m.sellOrders.length > 0);
      setVendingMachines(vms);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  // Extraer TODAS las ofertas de ventas de todas las máquinas
  let allOffers: any[] = [];
  vendingMachines.forEach((vm) => {
    vm.sellOrders.forEach((order: any) => {
      allOffers.push({
        machineName: vm.name || "Vending Desconocido",
        itemToSell: order.itemId,
        amountToSell: order.quantity,
        currencyReq: order.currencyId,
        costPerItem: order.costPerItem,
        amountInStock: order.amountInStock,
      });
    });
  });

  // Filtrar ofertas si hay búsqueda
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    allOffers = allOffers.filter((o) => {
      const itemName = getItemName(o.itemToSell).toLowerCase();
      const machName = o.machineName.toLowerCase();
      return itemName.includes(q) || machName.includes(q);
    });
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'grid', placeItems: 'center', height: '80vh' }}>
          <RefreshCw className="animate-spin" size={40} color="var(--primary)" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Store color="var(--primary)" className="glow" /> Mercados (Vending)
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Rastreador de la economía de la isla en tiempo real.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select 
              value={selectedServer?.id} 
              onChange={(e) => setSelectedServer(servers.find(s => s.id === e.target.value))}
              style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
            >
              <option value="" disabled>Selecciona un servidor</option>
              {servers.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.ip})</option>
              ))}
            </select>
            <button 
              className="btn-secondary" 
              onClick={() => selectedServer && fetchVendingData(selectedServer.id)}
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refrescar
            </button>
          </div>
        </header>

        {!selectedServer ? (
          <div className="premium-card" style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--border)' }}>
            No hay ningún servidor seleccionado.
          </div>
        ) : (
          <div className="premium-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <ShoppingCart size={20} color="var(--primary)" />
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Ofertas Globales de la Isla</h2>
              </div>
              <input 
                type="text" 
                placeholder="Buscar ítem o vendedor..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', width: '300px' }}
              />
            </div>

            {vendingMachines.length === 0 && !refreshing ? (
              <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5, borderTop: '1px solid var(--border)' }}>
                <Info size={32} style={{ margin: '0 auto 1rem' }} />
                No se han detectado máquinas expendedoras con stock en este servidor.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                      <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Costo</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Obtienes</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--primary)' }}>Stock Restante</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Vendedor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allOffers.map((offer, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'var(--transition)' }}>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ fontWeight: 800, color: '#eab308' }}>{offer.costPerItem}x</span> {getItemName(offer.currencyReq)}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ fontWeight: 800, color: '#3b82f6' }}>{offer.amountToSell}x</span> {getItemName(offer.itemToSell)}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            background: offer.amountInStock === 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', 
                            color: offer.amountInStock === 0 ? '#ef4444' : '#22c55e', 
                            padding: '0.2rem 0.5rem', 
                            borderRadius: '4px',
                            fontWeight: 700 
                          }}>
                            {offer.amountInStock}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', opacity: 0.8 }}>
                          {offer.machineName}
                        </td>
                      </tr>
                    ))}
                    {allOffers.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
                          No hay ofertas que coincidan con la búsqueda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
