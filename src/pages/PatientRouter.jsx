import React, { useState, useEffect, useRef } from 'react';
import { routingAPI } from '../services/api';
import { toast } from 'react-toastify';
import { InlineLoader } from '../components/Loader';

const CLUSTER_COLORS = ['#00d4aa','#f59e0b','#ef4444','#8b5cf6','#22c55e','#0ea5e9','#f97316','#e879f9'];

/** Pure-SVG geographic scatter plot — no npm packages needed */
function PinMap({ pins }) {
  const [hovered, setHovered] = useState(null);
  const svgRef = useRef(null);

  if (!pins || pins.length === 0) {
    return (
      <div style={{ height: 480, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)',
        border: '1px dashed var(--glass-border)', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 48 }}>📍</div>
        <p>No GPS coordinates in uploaded data</p>
        <p style={{ fontSize: 'var(--text-xs)' }}>Add <code style={{ color: 'var(--teal)' }}>latitude,longitude</code> columns to your CSV</p>
      </div>
    );
  }

  const validPins = pins.filter(p => p.latitude && p.longitude);
  if (validPins.length === 0) return (
    <div style={{ height: 480, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', color: 'var(--text-muted)' }}>
      No valid GPS data to display
    </div>
  );

  const lats = validPins.map(p => p.latitude);
  const lngs = validPins.map(p => p.longitude);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);

  const W = 800, H = 440, PAD = 40;
  const toX = (lng) => PAD + ((lng - minLng) / (maxLng - minLng || 1)) * (W - 2 * PAD);
  const toY = (lat) => H - PAD - ((lat - minLat) / (maxLat - minLat || 1)) * (H - 2 * PAD);

  const pinColor = (score) => score >= 15 ? '#ef4444' : score >= 8 ? '#f59e0b' : '#22c55e';
  const pinR = (score) => score >= 15 ? 10 : score >= 8 ? 7 : 5;

  return (
    <div style={{ position: 'relative', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
      {/* Legend */}
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: '0.75rem',
        background: 'rgba(10,14,26,0.9)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.85rem',
        border: '1px solid var(--glass-border)', zIndex: 10 }}>
        {[['#ef4444','Critical (≥15)'],['#f59e0b','Urgent (8-14)'],['#22c55e','Stable (<8)']].map(([c,l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: 11 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
            <span style={{ color: 'var(--text-muted)' }}>{l}</span>
          </div>
        ))}
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 480, display: 'block' }}>
        {/* Grid lines */}
        {[...Array(8)].map((_, i) => (
          <line key={`h${i}`} x1={PAD} x2={W - PAD} y1={PAD + (i * (H - 2*PAD)) / 7}
            y2={PAD + (i * (H - 2*PAD)) / 7} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
        ))}
        {[...Array(10)].map((_, i) => (
          <line key={`v${i}`} y1={PAD} y2={H - PAD} x1={PAD + (i * (W - 2*PAD)) / 9}
            x2={PAD + (i * (W - 2*PAD)) / 9} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
        ))}

        {/* Pins */}
        {validPins.map((p, i) => {
          const cx = toX(p.longitude);
          const cy = toY(p.latitude);
          const score = p.urgency_score || 0;
          const color = pinColor(score);
          const r = pinR(score);
          const isHov = hovered?.id === (p.id ?? i);
          return (
            <g key={p.id ?? i}
              onMouseEnter={() => setHovered({ ...p, _idx: i })}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}>
              {/* Pulse ring for critical */}
              {score >= 15 && (
                <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke={color} strokeWidth={1.5} opacity={0.4}
                  style={{ animation: 'pulseGlow 2s infinite' }} />
              )}
              <circle cx={cx} cy={cy} r={isHov ? r + 3 : r} fill={color} fillOpacity={0.9}
                stroke="white" strokeWidth={1.5} style={{ transition: 'r 0.15s ease' }} />
            </g>
          );
        })}

        {/* Tooltip */}
        {hovered && (() => {
          const cx = toX(hovered.longitude);
          const cy = toY(hovered.latitude);
          const flip = cx > W * 0.65;
          const tx = flip ? cx - 175 : cx + 14;
          const ty = Math.max(PAD, Math.min(cy - 30, H - PAD - 80));
          return (
            <g>
              <rect x={tx} y={ty} width={165} height={76} rx={8} fill="rgba(17,24,39,0.97)"
                stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
              <text x={tx + 10} y={ty + 20} fill="#f1f5f9" fontSize={13} fontWeight="700">{hovered.name}</text>
              <text x={tx + 10} y={ty + 36} fill="#94a3b8" fontSize={11}>{hovered.village} • Age {hovered.age}</text>
              <text x={tx + 10} y={ty + 52} fill={pinColor(hovered.urgency_score || 0)} fontSize={12} fontWeight="700">
                Score: {hovered.urgency_score || 0}
              </text>
              <text x={tx + 10} y={ty + 68} fill="#94a3b8" fontSize={11}>{hovered.severity_level || 'Unknown'}</text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

export default function PatientRouter() {
  const [clusters, setClusters] = useState({});
  const [mapPins, setMapPins] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [priorityInput, setPriorityInput] = useState('');
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [tab, setTab] = useState('map');
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([routingAPI.clusters(), routingAPI.map()])
      .then(([c, m]) => {
        setClusters(c.clusters || {});
        setMapPins(m.pins || []);
        setHasData(Object.keys(c.clusters || {}).length > 0);
      }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await routingAPI.upload(file);
      toast.success(`Clustering done: ${res.total_patients} patients in ${res.total_clusters} clusters`);
      setClusters(res.clusters || {});
      routingAPI.map().then(m => setMapPins(m.pins || []));
      setHasData(true);
    } catch (err) { toast.error(err.response?.data?.error || 'Upload failed'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handlePriority = async () => {
    if (!priorityInput.trim()) return;
    setPriorityLoading(true);
    try {
      const res = await routingAPI.priority(priorityInput);
      setClusters(res.clusters || {});
      toast.success(res.message || 'Priorities updated');
    } catch { toast.error('Priority update failed'); }
    finally { setPriorityLoading(false); }
  };

  const allPatients = Object.entries(clusters).flatMap(([cid, ps]) => ps.map(p => ({ ...p, cluster: cid })));
  const filteredPatients = selectedCluster !== null
    ? (clusters[selectedCluster] || []).map(p => ({ ...p, cluster: selectedCluster }))
    : allPatients;


  const filteredPins = selectedCluster !== null
    ? mapPins.filter(p => String(p.cluster) === String(selectedCluster))
    : mapPins;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 72, paddingBottom: '3rem' }}>
      <div className="container" style={{ paddingTop: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 className="page-title">🗺️ Patient Routing & Clustering</h1>
            <p className="page-subtitle">KMeans geographic clusters + AI urgency priority</p>
          </div>
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            {uploading ? <><InlineLoader size={16} color="#0a0e1a" /> Processing...</> : '📤 Upload Patients CSV'}
            <input type="file" accept=".csv" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
        </div>

        {/* Empty state */}
        {!hasData && !loading && (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)', border: '1px dashed var(--glass-border)', marginBottom: '2rem' }}>
            <div style={{ fontSize: 56, marginBottom: '1rem' }}>🗺️</div>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.75rem' }}>No patient data yet</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: 520, margin: '0 auto 1.5rem' }}>
              Upload a CSV with columns:{' '}
              <code style={{ color: 'var(--teal)', fontSize: 'var(--text-xs)' }}>
                patient_id, name, latitude, longitude, age, village, severity_level, last_consultation_date, stock_available
              </code>
            </p>
            <label className="btn btn-primary btn-lg" style={{ cursor: 'pointer' }}>
              📤 Upload Patient CSV
              <input type="file" accept=".csv" onChange={handleUpload} style={{ display: 'none' }} />
            </label>
          </div>
        )}

        {hasData && (
          <>
            {/* Cluster filter pills */}
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <button onClick={() => setSelectedCluster(null)} style={{
                padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)',
                border: `1px solid ${selectedCluster === null ? 'var(--teal)' : 'var(--glass-border)'}`,
                background: selectedCluster === null ? 'rgba(0,212,170,0.1)' : 'var(--bg-elevated)',
                color: selectedCluster === null ? 'var(--teal)' : 'var(--text-muted)',
                cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600, whiteSpace: 'nowrap',
              }}>
                All Clusters ({allPatients.length})
              </button>
              {Object.entries(clusters).map(([cid, ps], i) => (
                <button key={cid} onClick={() => setSelectedCluster(cid === selectedCluster ? null : cid)} style={{
                  padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)',
                  border: `1px solid ${selectedCluster === cid ? CLUSTER_COLORS[i % 8] : 'var(--glass-border)'}`,
                  background: selectedCluster === cid ? `${CLUSTER_COLORS[i % 8]}20` : 'var(--bg-elevated)',
                  color: selectedCluster === cid ? CLUSTER_COLORS[i % 8] : 'var(--text-muted)',
                  cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600, whiteSpace: 'nowrap',
                }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                    background: CLUSTER_COLORS[i % 8], marginRight: '0.4rem' }} />
                  Zone {cid} ({ps.length})
                </button>
              ))}
            </div>

            {/* AI Priority */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.75rem',
                fontSize: 'var(--text-lg)' }}>🤖 AI Priority Command</h3>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input className="form-input" style={{ flex: 1 }}
                  placeholder='e.g. "Prioritize elderly patients with no stock" or "Flag critical patients under 5"'
                  value={priorityInput} onChange={e => setPriorityInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePriority()}
                />
                <button className="btn btn-primary" onClick={handlePriority} disabled={priorityLoading}>
                  {priorityLoading ? <><InlineLoader size={16} color="#0a0e1a" /> Updating...</> : '⚡ Update Priority'}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
              <button className={`tab ${tab === 'map' ? 'active' : ''}`} onClick={() => setTab('map')}>📍 Map View</button>
              <button className={`tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>📋 List View</button>
            </div>

            {/* SVG Map */}
            {tab === 'map' && <PinMap pins={filteredPins} />}

            {/* List View */}
            {tab === 'list' && (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>#</th><th>Patient</th><th>Village</th><th>Age</th>
                      <th>Severity</th><th>Urgency Score</th><th>Cluster</th><th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients
                      .sort((a, b) => (b.urgency_score || 0) - (a.urgency_score || 0))
                      .map((p, i) => {
                        const score = p.urgency_score || 0;
                        const level = score >= 15 ? 'RED' : score >= 8 ? 'AMBER' : 'GREEN';
                        const levelColor = { RED: '#ef4444', AMBER: '#f59e0b', GREEN: '#22c55e' }[level];
                        const ci = Object.keys(clusters).indexOf(String(p.cluster));
                        return (
                          <tr key={p.patient_id || i}>
                            <td style={{ color: 'var(--text-dim)', fontWeight: 700 }}>{i + 1}</td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{p.name}</div>
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{p.patient_id}</div>
                            </td>
                            <td>{p.village}</td>
                            <td>{p.age}</td>
                            <td>
                              <span style={{ color: { Critical:'#ef4444', Severe:'#f97316', Moderate:'#f59e0b', Mild:'#22c55e' }[p.severity_level] || 'var(--text-muted)' }}>
                                {p.severity_level || '—'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ flex: 1, maxWidth: 80, height: 6, borderRadius: 3, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${Math.min(100, score * 5)}%`, background: levelColor }} />
                                </div>
                                <span style={{ fontWeight: 700, color: levelColor, fontSize: 'var(--text-xs)', minWidth: 24 }}>{score}</span>
                              </div>
                            </td>
                            <td>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span style={{ width: 9, height: 9, borderRadius: '50%', background: CLUSTER_COLORS[ci % 8], display: 'inline-block' }} />
                                Zone {p.cluster}
                              </span>
                            </td>
                            <td>
                              <span className={`badge badge-${p.stock_available === 'No' ? 'red' : p.stock_available === 'Low' ? 'amber' : 'green'}`}>
                                {p.stock_available || 'Yes'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
