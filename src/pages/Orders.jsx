import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/api';
import { toast } from 'react-toastify';
import { InlineLoader } from '../components/Loader';

const STATUS_COLORS = { pending: '#f59e0b', confirmed: '#0ea5e9', delivered: '#22c55e', cancelled: '#ef4444' };

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [updating, setUpdating] = useState(null);

  const load = (status = filter) => {
    setLoading(true);
    inventoryAPI.getOrders(status).then(d => setOrders(d.orders || [])).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await inventoryAPI.updateOrder(id, status);
      toast.success(`Order ${status}`);
      load();
    } catch { toast.error('Update failed'); }
    finally { setUpdating(null); }
  };

  const counts = orders.reduce((a, o) => { a[o.status] = (a[o.status] || 0) + 1; return a; }, {});

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 72, paddingBottom: '3rem' }}>
      <div className="container" style={{ paddingTop: '2rem' }}>
        <h1 className="page-title">📦 Orders</h1>
        <p className="page-subtitle" style={{ marginBottom: '2rem' }}>Track medicine orders — place new orders from Inventory page</p>

        {/* Status tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {['', 'pending', 'confirmed', 'delivered', 'cancelled'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '0.45rem 1.1rem', borderRadius: 'var(--radius-full)',
              border: `1px solid ${filter === s ? STATUS_COLORS[s] || 'var(--teal)' : 'var(--glass-border)'}`,
              background: filter === s ? `${STATUS_COLORS[s] || 'var(--teal)'}18` : 'var(--bg-elevated)',
              color: filter === s ? STATUS_COLORS[s] || 'var(--teal)' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600,
            }}>
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)} {counts[s] ? `(${counts[s]})` : ''}
            </button>
          ))}
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Product</th><th>SKU</th><th>Quantity</th><th>Order Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3].map(i => <tr key={i}>{Array(6).fill(0).map((_, j) => <td key={j}><div className="skeleton skeleton-text" /></td>)}</tr>)
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 48, marginBottom: '1rem' }}>📦</div>
                  <p>No orders {filter ? `with status "${filter}"` : 'yet'}.</p>
                  <p style={{ fontSize: 'var(--text-sm)', marginTop: '0.5rem' }}>Go to Inventory to place orders from the medicines table.</p>
                </td></tr>
              ) : orders.map(o => (
                <tr key={o.id}>
                  <td><div style={{ fontWeight: 600 }}>{o.product_name || o.sku}</div>{o.notes && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{o.notes}</div>}</td>
                  <td><code style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{o.sku}</code></td>
                  <td style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--teal)' }}>{o.quantity}</td>
                  <td style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{o.order_date?.slice(0, 10)}</td>
                  <td>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 700, background: `${STATUS_COLORS[o.status]}18`, color: STATUS_COLORS[o.status] || 'var(--text-muted)', border: `1px solid ${STATUS_COLORS[o.status]}40` }}>
                      {o.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {o.status === 'pending' && (
                        <>
                          <button className="btn btn-ghost btn-sm" disabled={updating === o.id} onClick={() => updateStatus(o.id, 'confirmed')}>
                            {updating === o.id ? <InlineLoader size={12} /> : '✓ Confirm'}
                          </button>
                          <button className="btn btn-danger btn-sm" disabled={updating === o.id} onClick={() => updateStatus(o.id, 'cancelled')}>Cancel</button>
                        </>
                      )}
                      {o.status === 'confirmed' && (
                        <button className="btn btn-primary btn-sm" disabled={updating === o.id} onClick={() => updateStatus(o.id, 'delivered')}>
                          {updating === o.id ? <InlineLoader size={12} color="#0a0e1a" /> : '📦 Mark Delivered'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
