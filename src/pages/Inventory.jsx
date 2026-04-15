import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { inventoryAPI } from '../services/api';
import StatCard from '../components/StatCard';
import { InlineLoader } from '../components/Loader';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const TABS = ['Overview', 'Predictions', 'Orders', 'AI Insights'];

export default function Inventory() {
  const [tab, setTab] = useState(0);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [uploading, setUploading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [predSku, setPredSku] = useState('');
  const [predLoading, setPredLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [insights, setInsights] = useState('');
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [nlQuery, setNlQuery] = useState('');
  const [nlAnswer, setNlAnswer] = useState('');
  const [nlLoading, setNlLoading] = useState(false);
  const [orderModal, setOrderModal] = useState(null);
  const [orderQty, setOrderQty] = useState(10);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([inventoryAPI.dashboard(), inventoryAPI.list({ q, status: statusFilter })])
      .then(([s, d]) => { setStats(s); setItems(d.items || []); })
      .catch(() => toast.error('Failed to load inventory'))
      .finally(() => setLoading(false));
  }, [q, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (tab === 2) inventoryAPI.getOrders().then(d => setOrders(d.orders || [])).catch(console.error);
  }, [tab]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await inventoryAPI.upload(file);
      toast.success(res.message);
      loadData();
    } catch (err) {
      toast.error('Upload failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false); e.target.value = '';
    }
  };

  const handlePredict = async () => {
    if (!predSku.trim()) return;
    setPredLoading(true);
    try {
      const res = await inventoryAPI.predict(predSku.trim().toUpperCase());
      setPrediction(res);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Prediction failed');
    } finally { setPredLoading(false); }
  };

  const handleInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await inventoryAPI.insights();
      setInsights(res.report);
    } catch { toast.error('AI insights failed'); }
    finally { setInsightsLoading(false); }
  };

  const handleNLQuery = async () => {
    if (!nlQuery.trim()) return;
    setNlLoading(true);
    try {
      const res = await inventoryAPI.query(nlQuery);
      setNlAnswer(res.answer);
    } catch { toast.error('Query failed'); }
    finally { setNlLoading(false); }
  };

  const handleOrder = async () => {
    if (!orderModal || orderQty <= 0) return;
    try {
      await inventoryAPI.placeOrder({ sku: orderModal.sku, quantity: orderQty });
      toast.success(`Order placed: ${orderQty} units of ${orderModal.product_name}`);
      setOrderModal(null);
    } catch { toast.error('Order failed'); }
  };

  const stockColor = (s) => s === 'critical' ? 'var(--red)' : s === 'low' ? 'var(--amber)' : 'var(--green)';
  const chartData = prediction
    ? [...(prediction.historical || []).map(d => ({ ...d, type: 'historical' })),
       ...(prediction.predicted || []).map(d => ({ ...d, type: 'predicted' }))]
    : [];

  return (
    <div className="page" style={{ paddingTop: '72px', paddingBottom: '3rem' }}>
      <div className="container" style={{ paddingTop: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 className="page-title">💊 Inventory Management</h1>
            <p className="page-subtitle">Stock levels, predictions, orders and AI insights</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
              {uploading ? <><InlineLoader size={16} color="#0a0e1a" /> Uploading...</> : '📤 Upload CSV'}
              <input type="file" accept=".csv" onChange={handleUpload} style={{ display: 'none' }} />
            </label>
            <button className="btn btn-ghost" onClick={() => inventoryAPI.export()}>📥 Export</button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <StatCard label="Total Products"    value={stats?.total_products}   icon="📦" accent="teal"   loading={loading} />
          <StatCard label="Low Stock"         value={stats?.low_stock_count}  icon="⚠️" accent="red"    loading={loading} />
          <StatCard label="Expiring (30d)"    value={stats?.expiring_count}   icon="📅" accent="amber"  loading={loading} />
          <StatCard label="Total Value"       value={stats ? `₹${Math.round(stats.total_value).toLocaleString()}` : null} icon="💰" accent="green" loading={loading} />
        </div>

        {/* Tabs */}
        <div className="tabs">
          {TABS.map((t, i) => <button key={i} className={`tab ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>{t}</button>)}
        </div>

        {/* ── Overview ── */}
        {tab === 0 && (
          <>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <input className="form-input" placeholder="🔍 Search medicines..." value={q} onChange={e => setQ(e.target.value)} style={{ flex: '1 1 240px', maxWidth: 360 }} />
              <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ flex: '1 1 160px', maxWidth: 200 }}>
                <option value="">All Status</option>
                <option value="low">Low Stock</option>
                <option value="expiring">Expiring</option>
                <option value="ok">OK</option>
              </select>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Medicine</th><th>SKU</th><th>Category</th>
                    <th>Stock</th><th>Reorder</th><th>Expiry</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [1,2,3,4,5].map(i => (
                      <tr key={i}>{Array(7).fill(0).map((_, j) => <td key={j}><div className="skeleton skeleton-text" /></td>)}</tr>
                    ))
                  ) : items.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '3rem', paddingBottom: '3rem' }}>
                      No items found. <label style={{ color: 'var(--teal)', cursor: 'pointer', textDecoration: 'underline' }}>
                        Upload a CSV<input type="file" accept=".csv" onChange={handleUpload} style={{ display: 'none' }} />
                      </label> to get started.
                    </td></tr>
                  ) : items.map(item => (
                    <tr key={item.sku}>
                      <td><div style={{ fontWeight: 600 }}>{item.product_name}</div></td>
                      <td><code style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>{item.sku}</code></td>
                      <td><span className="badge badge-gray">{item.category}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, color: stockColor(item.stock_status) }}>{item.current_stock}</span>
                          <span className={`badge badge-${item.stock_status === 'critical' ? 'red' : item.stock_status === 'low' ? 'amber' : 'green'}`}>
                            {item.stock_status.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{item.reorder_level}</td>
                      <td style={{ fontSize: 'var(--text-xs)', color: item.expiry_status === 'soon' ? 'var(--amber)' : item.expiry_status === 'expired' ? 'var(--red)' : 'var(--text-muted)' }}>
                        {item.expiry_date || '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setPredSku(item.sku); setTab(1); }}>📈 Predict</button>
                          <button className="btn btn-primary btn-sm" onClick={() => setOrderModal(item)}>🛒 Order</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Predictions ── */}
        {tab === 1 && (
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.25rem' }}>📈 30-Day Stock Forecast</h3>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <input className="form-input" placeholder="Enter SKU (e.g., MED-001)" value={predSku} onChange={e => setPredSku(e.target.value)} style={{ flex: 1, maxWidth: 320 }}
                onKeyDown={e => e.key === 'Enter' && handlePredict()} />
              <button className="btn btn-primary" onClick={handlePredict} disabled={predLoading}>
                {predLoading ? <><InlineLoader size={16} color="#0a0e1a" /> Forecasting...</> : '🔮 Forecast'}
              </button>
            </div>
            {prediction && (
              <>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                  <div className="card" style={{ flex: 1, padding: '1rem', minWidth: 140 }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Product</div>
                    <div style={{ fontWeight: 700 }}>{prediction.product_name}</div>
                  </div>
                  <div className="card" style={{ flex: 1, padding: '1rem', minWidth: 140 }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Current Stock</div>
                    <div style={{ fontWeight: 700, color: 'var(--teal)' }}>{prediction.current_stock}</div>
                  </div>
                  <div className="card" style={{ flex: 1, padding: '1rem', minWidth: 140 }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Reorder Alert</div>
                    <div style={{ fontWeight: 700, color: prediction.reorder_needed ? 'var(--red)' : 'var(--green)' }}>
                      {prediction.reorder_needed ? `⚠️ ${prediction.stockout_date}` : '✅ Stock OK'}
                    </div>
                  </div>
                </div>
                {chartData.length > 0 && (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: 8 }} labelStyle={{ color: 'var(--text-muted)' }} itemStyle={{ color: 'var(--teal)' }} />
                      <ReferenceLine y={prediction.reorder_level} stroke="var(--red)" strokeDasharray="4 4" label={{ value: 'Reorder', fill: 'var(--red)', fontSize: 11 }} />
                      <Line type="monotone" dataKey="stock" stroke="var(--teal)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
                {prediction.message && <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginTop: '1rem' }}>ℹ️ {prediction.message}</p>}
              </>
            )}
          </div>
        )}

        {/* ── Orders ── */}
        {tab === 2 && (
          <div className="table-wrapper">
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>📦 Order History</h3>
            </div>
            <table>
              <thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '2rem', paddingBottom: '2rem' }}>No orders placed yet.</td></tr>
                ) : orders.map(o => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600 }}>{o.product_name || o.sku}</td>
                    <td><code style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{o.sku}</code></td>
                    <td style={{ fontWeight: 700 }}>{o.quantity}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{o.order_date?.slice(0,10)}</td>
                    <td><span className={`badge badge-${o.status === 'delivered' ? 'green' : o.status === 'cancelled' ? 'red' : 'amber'}`}>{o.status}</span></td>
                    <td>
                      {o.status === 'pending' && (
                        <button className="btn btn-ghost btn-sm" onClick={async () => {
                          await inventoryAPI.updateOrder(o.id, 'delivered');
                          toast.success('Order marked delivered');
                          inventoryAPI.getOrders().then(d => setOrders(d.orders || []));
                        }}>✓ Delivered</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── AI Insights ── */}
        {tab === 3 && (
          <div>
            {/* NL Query */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1rem' }}>🔍 Ask About Your Inventory</h3>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input className="form-input" placeholder='e.g. "Which medicines expire this month?" or "What is low stock?"' value={nlQuery} onChange={e => setNlQuery(e.target.value)} style={{ flex: 1 }}
                  onKeyDown={e => e.key === 'Enter' && handleNLQuery()} />
                <button className="btn btn-primary" onClick={handleNLQuery} disabled={nlLoading}>
                  {nlLoading ? <><InlineLoader size={16} color="#0a0e1a" /> Thinking...</> : '🤖 Ask AI'}
                </button>
              </div>
              {nlAnswer && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,212,170,0.2)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  💬 {nlAnswer}
                </div>
              )}
            </div>

            {/* Full Insights */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>📊 Full AI Report</h3>
                <button className="btn btn-primary" onClick={handleInsights} disabled={insightsLoading}>
                  {insightsLoading ? <><InlineLoader size={16} color="#0a0e1a" /> Analyzing...</> : '✨ Generate Report'}
                </button>
              </div>
              {insights ? (
                <div style={{ lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontSize: 'var(--text-sm)' }}>{insights}</div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Click "Generate Report" to get AI-powered analysis of your inventory situation.</p>
              )}
            </div>
          </div>
        )}

        {/* Order Modal */}
        {orderModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={() => setOrderModal(null)}>
            <div className="card" style={{ width: '100%', maxWidth: 400, margin: '1rem' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.5rem' }}>🛒 Place Order</h3>
              <p style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{orderModal.product_name} ({orderModal.sku})</p>
              <label className="form-label">Quantity</label>
              <input type="number" className="form-input" value={orderQty} onChange={e => setOrderQty(Number(e.target.value))} min={1} style={{ marginBottom: '1.5rem' }} />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setOrderModal(null)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleOrder}>Place Order</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
