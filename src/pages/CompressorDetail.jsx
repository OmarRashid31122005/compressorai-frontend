// CompressorDetail.jsx — v5
// ✅ FIX: Updated all API calls from v4 /compressors/${id} → v5 /compressors/units/${id}
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { BarChart3, ChevronRight, Cpu, TrendingDown, Activity, MapPin, Tag, Zap, Gauge } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function CompressorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [unit,  setUnit]  = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // ✅ FIX: v5 uses /compressors/units/{id} not /compressors/{id}
    Promise.all([
      api.get(`/compressors/units/${id}`),
      api.get(`/compressors/units/${id}/stats`).catch(() => ({ data: null })),
    ])
      .then(([u, s]) => { setUnit(u.data); setStats(s.data) })
      .catch(() => toast.error('Failed to load compressor details'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner-yellow w-10 h-10"/>
    </div>
  )

  if (!unit) return (
    <div className="text-center py-20">
      <p className="text-slate-500">Compressor unit not found.</p>
      <button onClick={() => navigate('/dashboard')} className="btn-ghost mt-4 text-sm">← Back to Dashboard</button>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-cyan-400 transition-colors">
          Dashboard
        </button>
        <ChevronRight size={14} className="text-slate-600"/>
        <span className="text-white font-display font-600">{unit.unit_id}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unit Info Card */}
        <div className="card lg:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
              <Cpu size={26} className="text-yellow-400"/>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] font-mono uppercase tracking-widest mb-0.5">
                {unit.type?.name || 'Compressor'}
              </div>
              <h1 className="font-display font-800 text-2xl text-white">{unit.unit_id}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                unit.is_active !== false
                  ? 'text-green-400 bg-green-400/10'
                  : 'text-red-400 bg-red-400/10'
              }`}>
                {unit.is_active !== false ? '● Active' : '○ Inactive'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {[
              [MapPin, 'Location',     unit.location],
              [Tag,    'Manufacturer', unit.type?.manufacturer],
              [Zap,    'Rated Power',  unit.type?.rated_power_kw     ? `${unit.type.rated_power_kw} kW`   : null],
              [Gauge,  'Pressure',     unit.type?.rated_pressure_bar ? `${unit.type.rated_pressure_bar} bar` : null],
              [Cpu,    'Serial No.',   unit.serial_number],
            ].filter(([, , v]) => v).map(([Icon, label, val]) => (
              <div key={label} className="flex items-center justify-between py-2 border-b"
                style={{borderColor:'rgba(255,255,255,0.05)'}}>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Icon size={12}/>{label}
                </div>
                <span className="text-slate-200 text-sm font-mono">{val}</span>
              </div>
            ))}
          </div>

          <button onClick={() => navigate(`/analysis/${id}`)}
            className="w-full mt-6 flex items-center justify-center gap-2 btn-cyan py-3 text-sm">
            <BarChart3 size={16}/> Run Analysis
          </button>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 space-y-4">
          {stats && stats.total_analyses > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                {[
                  {label:'Total Analyses', value:stats.total_analyses,                              color:'text-cyan-400' },
                  {label:'Best Saving',    value:`${stats.best_power_saving_percent ?? 0}%`,        color:'text-green-400'},
                  {label:'Avg Saving',     value:`${(stats.avg_power_saving_percent ?? 0).toFixed(1)}%`, color:'text-blue-400' },
                ].map(({label,value,color}) => (
                  <div key={label} className="card text-center">
                    <div className={`font-display font-800 text-2xl ${color}`}>{value}</div>
                    <div className="text-slate-400 text-xs mt-1">{label}</div>
                  </div>
                ))}
              </div>

              {stats.analysis_trend?.length > 1 && (
                <div className="card">
                  <h3 className="font-display font-700 text-white mb-4">Energy Saving Trend</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={[...stats.analysis_trend].reverse()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f"/>
                      <XAxis dataKey="date" stroke="#64748b" tick={{fontSize:10}}/>
                      <YAxis stroke="#64748b" tick={{fontSize:10}}/>
                      <Tooltip
                        contentStyle={{ background:'#0d1a2e', border:'1px solid rgba(0,212,255,0.2)', borderRadius:'8px', fontSize:'12px' }}
                      />
                      <Line type="monotone" dataKey="saving_pct" stroke="#00d4ff" strokeWidth={2}
                        dot={{fill:'#00d4ff', r:3}} name="Saving %"/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <div className="card text-center py-16"
              style={{border:'1px solid rgba(255,255,255,0.07)'}}>
              <Activity size={40} className="text-slate-600 mx-auto mb-4"/>
              <h3 className="font-display font-700 text-white mb-2">No Analyses Yet</h3>
              <p className="text-slate-400 text-sm mb-6">Run your first analysis to see performance stats here.</p>
              <button onClick={() => navigate(`/analysis/${id}`)}
                className="btn-primary inline-flex items-center gap-2 text-sm px-6 py-2.5">
                <BarChart3 size={14}/> Run First Analysis
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}