import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../utils/api'
import toast from 'react-hot-toast'
import {
  BarChart3, Activity, TrendingDown, Zap, RefreshCw,
  Cpu, FileText, MapPin, Tag, Clock
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

// ── Single unit performance card ─────────────────────────────
function UnitStatsCard({ unit, stats, i }) {
  const navigate = useNavigate()
  const hasData  = stats && stats.total_analyses > 0

  return (
    <motion.div
      initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.07 }}
      className="card space-y-5"
      style={{ border: '1px solid rgba(255,255,255,0.07)' }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center flex-shrink-0">
            <Cpu size={20} className="text-yellow-400"/>
          </div>
          <div>
            <div className="font-display font-700 text-white text-lg leading-tight">
              {unit.unit_id}
            </div>
            <div className="text-slate-500 text-xs font-mono mt-0.5 flex items-center gap-2">
              <span>{unit.type?.name || '—'}</span>
              {unit.location && (
                <>
                  <span className="text-slate-700">·</span>
                  <span className="flex items-center gap-1">
                    <MapPin size={9}/>{unit.location}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate(`/analysis/${unit.id}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-display font-600 transition-all flex-shrink-0"
          style={{ background:'rgba(0,212,255,0.08)', border:'1px solid rgba(0,212,255,0.2)', color:'#00d4ff' }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(0,212,255,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(0,212,255,0.08)'}>
          <BarChart3 size={12}/> New Analysis
        </button>
      </div>

      {/* ── No data state ── */}
      {!hasData ? (
        <div className="rounded-xl py-8 text-center"
          style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
          <Activity size={28} className="text-slate-700 mx-auto mb-3"/>
          <p className="text-slate-500 text-sm">No analyses run yet</p>
          <button
            onClick={() => navigate(`/analysis/${unit.id}`)}
            className="mt-3 text-xs text-yellow-400 hover:text-yellow-300 font-display font-600 transition-colors">
            Run first analysis →
          </button>
        </div>
      ) : (
        <>
          {/* ── KPI row ── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Analyses', value: stats.total_analyses,                                    color: 'text-cyan-400'  },
              { label: 'Best Saving',    value: `${stats.best_power_saving_percent ?? 0}%`,              color: 'text-green-400' },
              { label: 'Avg Saving',     value: `${(stats.avg_power_saving_percent ?? 0).toFixed(1)}%`, color: 'text-blue-400'  },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl p-3 text-center"
                style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div className={`font-display font-800 text-xl ${color}`}>{value}</div>
                <div className="text-slate-500 text-xs mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* ── Trend chart ── */}
          {stats.analysis_trend?.length > 1 && (
            <div>
              <p className="text-slate-500 text-xs font-mono mb-3 flex items-center gap-1.5">
                <TrendingDown size={11}/> Energy Saving Trend
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={[...stats.analysis_trend].reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f"/>
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize:10 }}/>
                  <YAxis stroke="#64748b" tick={{ fontSize:10 }} unit="%"/>
                  <Tooltip
                    contentStyle={{ background:'#0d1a2e', border:'1px solid rgba(0,212,255,0.2)', borderRadius:'8px', fontSize:'12px' }}
                    formatter={v => [`${v}%`, 'Saving']}
                  />
                  <Line
                    type="monotone" dataKey="saving_pct" stroke="#00d4ff"
                    strokeWidth={2} dot={{ fill:'#00d4ff', r:3 }} name="Saving %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Generate report prompt ── */}
          <div className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background:'rgba(250,204,21,0.04)', border:'1px solid rgba(250,204,21,0.1)' }}>
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-yellow-400"/>
              <span className="text-slate-400 text-xs">
                To download a report, run an analysis and use the
                <span className="text-yellow-400 font-600"> Excel / PDF </span>
                buttons on the results page.
              </span>
            </div>
            <button
              onClick={() => navigate(`/analysis/${unit.id}`)}
              className="text-xs text-yellow-400 hover:text-yellow-300 font-display font-600 transition-colors whitespace-nowrap ml-3">
              Go →
            </button>
          </div>
        </>
      )}
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function Reports() {
  const [units,   setUnits]   = useState([])
  const [statsMap, setStats]  = useState({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      // Fetch engineer's linked units
      const r  = await api.get('/compressors/units/my')
      const us = Array.isArray(r.data)
        ? r.data
        : (r.data?.items || r.data?.units || [])
      setUnits(us)

      // Fetch stats for every unit in parallel (this endpoint works ✅)
      const sm = {}
      await Promise.all(us.map(async u => {
        try {
          const s   = await api.get(`/compressors/units/${u.id}/stats`)
          sm[u.id]  = s.data
        } catch { sm[u.id] = null }
      }))
      setStats(sm)
    } catch {
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // ── Loading ───────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="spinner-yellow w-12 h-12 mx-auto mb-4"/>
        <p className="text-slate-400 font-mono text-sm">Loading performance data...</p>
      </div>
    </div>
  )

  // ── Empty ─────────────────────────────────────────────────
  if (units.length === 0) return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-800 text-white">Reports</h1>
          <p className="text-slate-400 text-sm mt-1">Performance overview per compressor unit</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-display font-600 transition-all"
            style={{ background:'rgba(0,212,255,0.08)', border:'1px solid rgba(0,212,255,0.2)', color:'#00d4ff' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(0,212,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(0,212,255,0.08)'}>
            <Clock size={13}/> Saved Reports
          </button>
          <button onClick={load}
            className="p-2.5 text-slate-400 hover:text-yellow-400 transition-colors rounded-xl hover:bg-yellow-400/10">
            <RefreshCw size={18}/>
          </button>
        </div>
      </div>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
        className="card text-center py-20"
        style={{ border:'1px solid rgba(255,255,255,0.07)' }}>
        <Cpu size={36} className="text-slate-700 mx-auto mb-4"/>
        <h3 className="font-display font-700 text-white text-xl mb-2">No Units Linked</h3>
        <p className="text-slate-500 text-sm mb-6">Add a compressor unit to start running analyses</p>
        <button onClick={() => navigate('/dashboard')}
          className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm">
          <Cpu size={14}/> Go to Dashboard
        </button>
      </motion.div>
    </div>
  )

  // ── Main ──────────────────────────────────────────────────
  const totalAnalyses = Object.values(statsMap).reduce((s, st) => s + (st?.total_analyses || 0), 0)
  const unitsWithData = Object.values(statsMap).filter(st => st?.total_analyses > 0).length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-800 text-white">Reports</h1>
          <p className="text-slate-400 text-sm mt-1">Performance overview per compressor unit</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-display font-600 transition-all"
            style={{ background:'rgba(0,212,255,0.08)', border:'1px solid rgba(0,212,255,0.2)', color:'#00d4ff' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(0,212,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(0,212,255,0.08)'}>
            <Clock size={13}/> Saved Reports
          </button>
          <button onClick={load}
            className="p-2.5 text-slate-400 hover:text-yellow-400 transition-colors rounded-xl hover:bg-yellow-400/10">
            <RefreshCw size={18}/>
          </button>
        </div>
      </div>

      {/* Summary bar */}
      {totalAnalyses > 0 && (
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
          className="grid grid-cols-3 gap-4">
          {[
            { label:'Total Units',      value: units.length,    color:'text-yellow-400' },
            { label:'Total Analyses',   value: totalAnalyses,   color:'text-cyan-400'   },
            { label:'Units Optimized',  value: unitsWithData,   color:'text-green-400'  },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center py-4"
              style={{ border:'1px solid rgba(255,255,255,0.06)' }}>
              <div className={`font-display font-800 text-2xl ${color}`}>{value}</div>
              <div className="text-slate-500 text-xs mt-1">{label}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Per-unit cards */}
      <div className="space-y-4">
        {units.map((unit, i) => (
          <UnitStatsCard
            key={unit.id}
            unit={unit}
            stats={statsMap[unit.id]}
            i={i}
          />
        ))}
      </div>

    </div>
  )
}