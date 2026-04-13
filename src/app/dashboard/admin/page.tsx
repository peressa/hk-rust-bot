"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Shield, 
  UserPlus, 
  Trash2, 
  Clock, 
  Search, 
  RefreshCw,
  UserCheck,
  Calendar
} from "lucide-react";

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form state
  const [newSteamId, setNewSteamId] = useState("");
  const [newName, setNewName] = useState("");
  const [newDays, setNewDays] = useState(30);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/whitelist");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await fetch("/api/admin/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          steamId: newSteamId,
          name: newName,
          days: newDays,
          role: "user"
        })
      });
      if (res.ok) {
        setNewSteamId("");
        setNewName("");
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (steamId: string) => {
    if (!confirm("¿Estás seguro de eliminar a este usuario de la whitelist?")) return;
    try {
      await fetch(`/api/admin/whitelist?steamId=${steamId}`, { method: "DELETE" });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.steamId.includes(searchTerm) || 
    (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Shield size={32} color="var(--primary)" /> Gestión de Whitelist
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Administra el acceso manual de tus clientes y licencias.</p>
          </div>
          <button onClick={fetchUsers} className="btn-secondary" style={{ padding: '0.5rem' }}>
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
          
          {/* Main List */}
          <div className="premium-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px' }}>
              <Search size={20} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Buscar por SteamID o Nombre..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', width: '100%' }}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>USUARIO</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>ROL</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>EXPIRACIÓN</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'right' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.steamId} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600 }}>{user.name || "Sin nombre"}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.steamId}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          padding: '0.2rem 0.6rem', 
                          borderRadius: '10px', 
                          background: user.role === 'admin' ? 'rgba(205,65,43,0.2)' : 'rgba(255,255,255,0.05)',
                          color: user.role === 'admin' ? 'var(--primary)' : 'white',
                          fontWeight: 700
                        }}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                        {user.expiresAt ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: new Date(user.expiresAt) < new Date() ? '#ef4444' : 'inherit' }}>
                            <Clock size={14} /> {new Date(user.expiresAt).toLocaleDateString()}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Permanente</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        {user.role !== 'admin' && (
                          <button 
                            onClick={() => handleDelete(user.steamId)}
                            className="btn-secondary" 
                            style={{ color: '#ef4444', padding: '0.5rem' }}
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No se encontraron usuarios.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Add User */}
          <div className="premium-card">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <UserPlus size={20} color="var(--primary)" /> Añadir Usuario
            </h3>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>SteamID 64</label>
                <input 
                  type="text" 
                  required
                  value={newSteamId}
                  onChange={(e) => setNewSteamId(e.target.value)}
                  placeholder="7656119..." 
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'white' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Nombre / Notas</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Cliente PayPal" 
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'white' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Días de Licencia</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                   {[30, 90, 365, 0].map(d => (
                     <button 
                      key={d} 
                      type="button"
                      onClick={() => setNewDays(d)}
                      style={{ 
                        flex: 1, 
                        padding: '0.5rem', 
                        fontSize: '0.7rem', 
                        borderRadius: '4px',
                        background: newDays === d ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: newDays === d ? 'white' : 'var(--text-muted)',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                     >
                       {d === 0 ? "LIFE" : d + "d"}
                     </button>
                   ))}
                </div>
              </div>
              <button disabled={isAdding} className="btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1rem' }}>
                {isAdding ? <RefreshCw className="animate-spin" /> : "Activar Licencia"}
              </button>
            </form>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
