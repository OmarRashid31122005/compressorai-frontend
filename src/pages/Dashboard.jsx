import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Cpu, TrendingDown, Activity, Zap, BarChart3, RefreshCw, X,
  MapPin, ArrowRight, Gauge, Search, Database, ChevronRight,
  Layers, Tag, CheckCircle, Brain, Users, Settings, Wrench
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import useAuthStore from '../store/authStore'

/* ── KPI Card (unchanged from v4) ──────────────────────── */
function KPICard({ label, value, unit, icon: Icon, color = 'cyan', delay = 0 }) {
  const colors = {
    cyan:   { bg:'bg-cyan-400/10',   border:'border-cyan-400/20',   text:'text-cyan-400',   glow:'rgba(0,212,255,0.3)'  },
    yellow: { bg:'bg-yellow-400/10', border:'border-yellow-400/20', text:'text-yellow-400', glow:'rgba(250,204,21,0.3)' },
    white:  { bg:'bg-white/5',       border:'border-white/10',      text:'text-white',      glow:'rgba(255,255,255,0.2)'},
    green:  { bg:'bg-green-400/10',  border:'border-green-400/20',  text:'text-green-400',  glow:'rgba(74,222,128,0.3)' },
  }
  const c = colors[color]
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay }}
      className="card card-hover"
      style={{ border:`1px solid ${c.glow.replace('0.3','0.15')}` }}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.bg} border ${c.border}`}>
          <Icon size={20} className={c.text} />
        </div>
        <div className={`text-xs font-mono px-2 py-0.5 rounded-full ${c.bg} ${c.text} border ${c.border}`}>LIVE</div>
      </div>
      <div className={`font-display font-900 text-3xl ${c.text} mb-1`} style={{ textShadow:`0 0 20px ${c.glow}` }}>
        {value ?? '—'}<span className="text-lg text-slate-500 ml-1">{unit}</span>
      </div>
      <div className="text-slate-400 text-sm">{label}</div>
    </motion.div>
  )
}

/* ── Unit Card (v5 — engineer view) ────────────────────── */
function UnitCard({ unit, onUnlink, i }) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
      whileHover={{ y:-5, scale:1.01 }}
      className="card card-hover cursor-pointer group relative overflow-hidden"
      style={{ border:'1px solid rgba(255,255,255,0.07)' }}
      onClick={() => navigate(`/analysis/${unit.id}`)}>

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-400/0 via-yellow-400/60 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Unlink button */}
      <button onClick={e => { e.stopPropagation(); onUnlink(unit.id) }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10">
        <X size={14} />
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-12 h-12 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-400/20 transition-colors">
          <Cpu size={22} className="text-yellow-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-slate-500 text-[10px] font-mono uppercase tracking-widest mb-0.5">
            {unit.type?.name || unit.type?.manufacturer || 'Compressor'}
          </div>
          <div className="font-display font-700 text-white text-lg">{unit.unit_id}</div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-mono flex-shrink-0 ${
          unit.is_active !== false
            ? 'bg-green-400/10 text-green-400 border border-green-400/20'
            : 'bg-red-400/10 text-red-400 border border-red-400/20'
        }`}>{unit.is_active !== false ? '● Active' : '○ Inactive'}</span>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {[
          { icon: MapPin,   label:'Location',     value: unit.location },
          { icon: Tag,      label:'Manufacturer', value: unit.type?.manufacturer },
          { icon: Zap,      label:'Rated Power',  value: unit.type?.rated_power_kw ? `${unit.type.rated_power_kw} kW` : null },
          { icon: Gauge,    label:'Pressure',     value: unit.type?.rated_pressure_bar ? `${unit.type.rated_pressure_bar} bar` : null },
        ].map(({ icon: Ic, label, value }) => (
          <div key={label} className="rounded-xl p-2.5" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Ic size={10} className="text-slate-600" />
              <div className="text-[10px] text-slate-600 font-mono uppercase tracking-wide">{label}</div>
            </div>
            <div className="text-sm text-slate-300 truncate">{value || '—'}</div>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-4 px-0.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Database size={11} className="text-slate-600" />
          <span>{unit.dataset_count ?? 0} datasets</span>
        </div>
        {unit.latest_saving != null && (
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <TrendingDown size={11} /><span>{unit.latest_saving?.toFixed(1)}% saved</span>
          </div>
        )}
      </div>

      {/* Action buttons — per unit */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={e => { e.stopPropagation(); navigate(`/analysis/${unit.id}`) }}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-display font-600 text-sm transition-all"
          style={{ background:'rgba(250,204,21,0.08)', border:'1px solid rgba(250,204,21,0.2)', color:'#facc15' }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(250,204,21,0.15)' }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(250,204,21,0.08)' }}>
          <BarChart3 size={13} /> Optimize
        </button>
        <button
          onClick={e => e.stopPropagation()}
          title="Coming Soon"
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-display font-600 text-sm relative"
          style={{ background:'rgba(148,163,184,0.05)', border:'1px solid rgba(148,163,184,0.12)', color:'#64748b', cursor:'not-allowed' }}>
          <Wrench size={13} /> Maintenance
          <span className="absolute -top-2 -right-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full"
            style={{ background:'rgba(250,204,21,0.15)', color:'#facc15', border:'1px solid rgba(250,204,21,0.2)' }}>
            Soon
          </span>
        </button>
      </div>
    </motion.div>
  )
}

/* ── Admin Type Card (v5 — admin view) ─────────────────── */
function AdminTypeCard({ type, i }) {
  const navigate = useNavigate()

  // Navigate to the first unit of THIS specific type only
  const handleOptimize = async (e) => {
    e.stopPropagation()
    try {
      // Get units filtered by this compressor type
      const res = await api.get(`/compressors/units?type_id=${type.id}`)
      const typeUnits = Array.isArray(res.data)
        ? res.data
        : (res.data?.results ?? res.data?.units ?? [])

      const match = typeUnits.find(u => u.is_active !== false) || typeUnits[0]
      if (match) {
        localStorage.setItem('last_unit_id', match.id)
        navigate(`/analysis/${match.id}`)
      } else {
        // No units for this type — navigate to dashboard to add one
        toast('No units found for this compressor type. Add a unit first.', {
          icon: '⚠️', style: { background:'#0d1a2e', color:'#e2e8f0' }
        })
      }
    } catch {
      toast.error('Could not load units.')
    }
  }

  return (
    <motion.div
      initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
      whileHover={{ y:-5, scale:1.01 }}
      className="card card-hover cursor-pointer group relative overflow-hidden"
      style={{ border:'1px solid rgba(255,255,255,0.07)' }}
      onClick={() => navigate('/admin')}>

      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400/0 via-cyan-400/60 to-cyan-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex items-start gap-3 mb-5">
        <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-400/20 transition-colors">
          <Layers size={22} className="text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-slate-500 text-[10px] font-mono uppercase tracking-widest mb-0.5">{type.manufacturer || 'Manufacturer'}</div>
          <div className="font-display font-700 text-white text-lg truncate">{type.name}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label:'Units',    value: type.unit_count ?? 0 },
          { label:'Power',    value: type.rated_power_kw ? `${type.rated_power_kw}kW` : '—' },
          { label:'Pressure', value: type.rated_pressure_bar ? `${type.rated_pressure_bar}bar` : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl p-2.5 text-center" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-xs text-slate-600 font-mono mb-1">{label}</div>
            <div className="text-sm text-slate-300 font-display font-600">{value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 p-2.5 rounded-xl mb-4"
        style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
        <Brain size={14} className={type.ml_model ? 'text-green-400' : 'text-slate-600'} />
        <div className="flex-1 text-xs text-slate-400 truncate">
          {type.ml_model ? `ML Model · R² ${type.ml_model.r2_score?.toFixed(3) ?? '—'}` : 'No ML model trained yet'}
        </div>
        {type.ml_model && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button onClick={e => { e.stopPropagation(); navigate('/admin') }}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-display font-600 text-sm transition-all"
          style={{ background:'rgba(0,212,255,0.08)', border:'1px solid rgba(0,212,255,0.2)', color:'#00d4ff' }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(0,212,255,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(0,212,255,0.08)'}>
          <Settings size={13}/> Manage
        </button>
        <button onClick={handleOptimize}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-display font-600 text-sm transition-all"
          style={{ background:'rgba(250,204,21,0.08)', border:'1px solid rgba(250,204,21,0.2)', color:'#facc15' }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(250,204,21,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(250,204,21,0.08)'}>
          <BarChart3 size={13}/> Optimize
        </button>
        <button onClick={e => e.stopPropagation()} title="Coming Soon"
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-display font-600 text-sm relative"
          style={{ background:'rgba(148,163,184,0.05)', border:'1px solid rgba(148,163,184,0.12)', color:'#64748b', cursor:'not-allowed' }}>
          <Wrench size={13}/> Maintain
          <span className="absolute -top-2 -right-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full"
            style={{ background:'rgba(250,204,21,0.15)', color:'#facc15', border:'1px solid rgba(250,204,21,0.2)' }}>
            Soon
          </span>
        </button>
      </div>
    </motion.div>
  )
}

/* ── Add Unit Modal — 2-step (v5) ───────────────────────── */
function AddCompressorModal({ onClose, onAdd }) {
  const [step, setStep]         = useState('type')   // 'type' | 'unit'
  const [typeSearch, setSearch] = useState('')
  const [typeResults, setTypes] = useState([])
  const [selectedType, setSel]  = useState(null)
  const [createNew, setNew]     = useState(false)
  const [searchLoading, setSL]  = useState(false)
  const [loading, setLoading]   = useState(false)
  const [newType, setNewType]   = useState({ name:'', manufacturer:'', rated_power_kw:'', rated_pressure_bar:'', description:'' })
  const [form, setForm]         = useState({ unit_id:'', serial_number:'', location:'', notes:'' })

  const searchTypes = async (q) => {
    setSL(true)
    try {
      const r = await api.get(`/compressors/types/search?q=${encodeURIComponent(q)}`)
      setTypes(r.data.results || r.data || [])
    } catch { setTypes([]) }
    finally { setSL(false) }
  }

  useEffect(() => { searchTypes('') }, [])
  useEffect(() => {
    const t = setTimeout(() => searchTypes(typeSearch), 300)
    return () => clearTimeout(t)
  }, [typeSearch])

  const submit = async () => {
    setLoading(true)
    try {
      let typeId = selectedType?.id
      if (createNew) {
        if (!newType.name.trim()) { toast.error('Compressor name is required'); setLoading(false); return }
        const r = await api.post('/compressors/types', {
          ...newType,
          rated_power_kw:     newType.rated_power_kw     ? +newType.rated_power_kw     : null,
          rated_pressure_bar: newType.rated_pressure_bar ? +newType.rated_pressure_bar : null,
        })
        typeId = r.data.id
      }
      if (!typeId)               { toast.error('Select or create a compressor model'); setLoading(false); return }
      if (!form.unit_id.trim())  { toast.error('Unit ID is required'); setLoading(false); return }

      const r = await api.post('/compressors/units', {
        compressor_type_id: typeId,
        unit_id:       form.unit_id.trim().toUpperCase(),
        serial_number: form.serial_number || null,
        location:      form.location      || null,
        notes:         form.notes         || null,
      })
      onAdd(r.data)
      toast.success(r.data.already_existed ? 'Unit linked to your account!' : 'New unit created & linked!')
      onClose()
    } catch(e) { toast.error(e.response?.data?.detail || 'Failed to add unit') }
    finally { setLoading(false) }
  }

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity:0, scale:0.9, y:20 }} animate={{ opacity:1, scale:1, y:0 }}
          exit={{ opacity:0, scale:0.9, y:20 }}
          className="w-full max-w-lg rounded-2xl overflow-hidden"
          style={{ background:'rgba(8,14,26,0.98)', border:'1px solid rgba(250,204,21,0.2)', boxShadow:'0 0 60px rgba(250,204,21,0.1)' }}>

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-yellow-400/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-yellow-400/10 border border-yellow-400/25 flex items-center justify-center">
                <Plus size={18} className="text-yellow-400" />
              </div>
              <div>
                <h2 className="font-display font-700 text-white text-lg">Add Compressor Unit</h2>
                {/* Step indicator */}
                <div className="flex items-center gap-2 mt-0.5">
                  {['Model', 'Unit Details'].map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                      <div className={`text-[10px] font-mono px-2 py-0.5 rounded-full transition-all ${
                        (step==='type'&&i===0)||(step==='unit'&&i===1)
                          ? 'bg-yellow-400/15 text-yellow-400'
                          : i===0&&step==='unit'
                          ? 'bg-green-400/10 text-green-400'
                          : 'text-slate-600'
                      }`}>
                        {(step==='unit'&&i===0) ? '✓ '+s : `${i+1}. ${s}`}
                      </div>
                      {i===0 && <ChevronRight size={10} className="text-slate-700" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              <X size={18}/>
            </button>
          </div>

          <div className="p-6">
            {/* ── STEP 1: Type ── */}
            {step === 'type' && (
              <div className="space-y-4">
                {/* Toggle */}
                <div className="flex gap-2 p-1 rounded-xl" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                  {[['existing','Select Existing'],['new','Create New']].map(([k,l]) => (
                    <button key={k} onClick={() => setNew(k==='new')}
                      className={`flex-1 py-2 rounded-lg text-sm font-display font-600 transition-all ${
                        (k==='new')===createNew ? 'bg-yellow-400/15 text-yellow-400' : 'text-slate-500 hover:text-white'
                      }`}>{l}</button>
                  ))}
                </div>

                {!createNew ? (
                  <>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input className="input-field pl-9" placeholder="Search compressor (e.g. Ingersoll Rand SH-250)..."
                        value={typeSearch} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {searchLoading ? (
                        <div className="text-center py-6"><div className="spinner w-6 h-6 mx-auto" /></div>
                      ) : typeResults.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-sm">
                          No models found.{' '}
                          <button onClick={() => setNew(true)} className="text-yellow-400 hover:underline">Create one?</button>
                        </div>
                      ) : typeResults.map(t => (
                        <button key={t.id} onClick={() => setSel(t)}
                          className={`w-full text-left rounded-xl p-3 transition-all ${
                            selectedType?.id===t.id ? 'bg-yellow-400/12 border border-yellow-400/30' : 'border border-white/6 hover:bg-white/3'
                          }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-display font-600 text-white text-sm">{t.name}</div>
                              <div className="text-slate-500 text-xs">{t.manufacturer} · {t.unit_count ?? 0} units</div>
                            </div>
                            {selectedType?.id===t.id && <CheckCircle size={16} className="text-yellow-400" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="label">Compressor Name *</label>
                      <input className="input-field" placeholder="e.g. Ingersoll Rand SH-250"
                        value={newType.name} onChange={e => setNewType({...newType, name:e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Manufacturer</label>
                        <input className="input-field" placeholder="e.g. Ingersoll Rand"
                          value={newType.manufacturer} onChange={e => setNewType({...newType, manufacturer:e.target.value})} />
                      </div>
                      <div>
                        <label className="label">Rated Power (kW)</label>
                        <div className="relative">
                          <input type="number" className="input-field pr-8" placeholder="e.g. 250"
                            value={newType.rated_power_kw} onChange={e => setNewType({...newType, rated_power_kw:e.target.value})}
                            style={{MozAppearance:'textfield'}} />
                          <div className="absolute right-0 top-0 bottom-0 flex flex-col border-l" style={{borderColor:'rgba(250,204,21,0.2)'}}>
                            <button type="button"
                              onClick={()=>setNewType({...newType,rated_power_kw:String(Math.min(9999,(parseFloat(newType.rated_power_kw)||0)+10))})}
                              className="flex-1 px-2 text-yellow-400/60 hover:text-yellow-400 hover:bg-yellow-400/10 transition-all rounded-tr-xl text-xs leading-none">▲</button>
                            <button type="button"
                              onClick={()=>setNewType({...newType,rated_power_kw:String(Math.max(0,(parseFloat(newType.rated_power_kw)||0)-10))})}
                              className="flex-1 px-2 text-yellow-400/60 hover:text-yellow-400 hover:bg-yellow-400/10 transition-all rounded-br-xl text-xs leading-none border-t" style={{borderColor:'rgba(250,204,21,0.2)'}}>▼</button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="label">Rated Pressure (bar)</label>
                      <div className="relative">
                        <input type="number" className="input-field pr-8" placeholder="e.g. 10"
                          value={newType.rated_pressure_bar} onChange={e => setNewType({...newType, rated_pressure_bar:e.target.value})}
                          style={{MozAppearance:'textfield'}} />
                        <div className="absolute right-0 top-0 bottom-0 flex flex-col border-l" style={{borderColor:'rgba(250,204,21,0.2)'}}>
                          <button type="button"
                            onClick={()=>setNewType({...newType,rated_pressure_bar:String(Math.min(50,(parseFloat(newType.rated_pressure_bar)||0)+1))})}
                            className="flex-1 px-2 text-yellow-400/60 hover:text-yellow-400 hover:bg-yellow-400/10 transition-all rounded-tr-xl text-xs leading-none">▲</button>
                          <button type="button"
                            onClick={()=>setNewType({...newType,rated_pressure_bar:String(Math.max(0,(parseFloat(newType.rated_pressure_bar)||0)-1))})}
                            className="flex-1 px-2 text-yellow-400/60 hover:text-yellow-400 hover:bg-yellow-400/10 transition-all rounded-br-xl text-xs leading-none border-t" style={{borderColor:'rgba(250,204,21,0.2)'}}>▼</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button disabled={!createNew && !selectedType} onClick={() => setStep('unit')}
                  className="w-full btn-primary py-3 text-sm disabled:opacity-40 flex items-center justify-center gap-2">
                  Next: Unit Details <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* ── STEP 2: Unit ── */}
            {step === 'unit' && (
              <div className="space-y-4">
                {/* Model badge */}
                <div className="rounded-xl p-3 flex items-center gap-3"
                  style={{ background:'rgba(250,204,21,0.06)', border:'1px solid rgba(250,204,21,0.15)' }}>
                  <Layers size={16} className="text-yellow-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-yellow-400 font-display font-600 text-sm truncate">
                      {createNew ? newType.name : selectedType?.name}
                    </div>
                    <div className="text-slate-500 text-xs">Compressor model</div>
                  </div>
                  <button onClick={() => setStep('type')} className="text-xs text-slate-500 hover:text-white font-mono">Change</button>
                </div>

                <div>
                  <label className="label">Unit ID *</label>
                  <input className="input-field font-mono uppercase" placeholder="e.g. CIK1001-A"
                    value={form.unit_id} onChange={e => setForm({...form, unit_id:e.target.value})} />
                  <p className="text-slate-600 text-xs mt-1">Unique ID for this physical machine</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Serial Number</label>
                    <input className="input-field" placeholder="Optional"
                      value={form.serial_number} onChange={e => setForm({...form, serial_number:e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Location</label>
                    <input className="input-field" placeholder="e.g. Plant A – Bay 3"
                      value={form.location} onChange={e => setForm({...form, location:e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="label">Notes (Optional)</label>
                  <textarea className="input-field resize-none" rows={2} placeholder="Optional notes..."
                    value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep('type')} className="flex-1 btn-ghost py-3 text-sm">← Back</button>
                  <button onClick={submit} disabled={loading || !form.unit_id.trim()}
                    className="flex-1 btn-primary py-3 text-sm disabled:opacity-50">
                    {loading ? 'Adding...' : 'Add Unit'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ── Dashboard ──────────────────────────────────────────── */
export default function Dashboard() {
  const [units, setUnits]     = useState([])
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const { user, hasRole }     = useAuthStore()
  const isEngineer            = user?.role === 'engineer'
  const isAdmin               = hasRole(['admin'])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [main, adminStats] = await Promise.all([
        // v5: engineers → units/my, admins → types list
        isEngineer ? api.get('/compressors/units/my') : api.get('/compressors/types'),
        isAdmin    ? api.get('/admin/stats').catch(() => ({ data:null })) : Promise.resolve({ data:null }),
      ])
      setUnits(main.data || [])
      setStats(adminStats.data)
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleUnlink = async (unitId) => {
    if (!confirm('Remove this unit from your list?')) return
    try {
      await api.delete(`/compressors/units/${unitId}/unlink`)
      setUnits(prev => prev.filter(u => u.id !== unitId))
      toast.success('Unit removed')
    } catch { toast.error('Failed to unlink') }
  }

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div className="flex items-start justify-between">
        <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}>
          <p className="text-slate-500 text-sm font-mono mb-1">{greeting} 👋</p>
          <h1 className="font-display text-3xl font-800 text-white">
            Welcome back, <span className="text-yellow-400 neon-yellow">{user?.full_name?.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </p>
        </motion.div>
        <div className="flex items-center gap-3">
          <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} onClick={fetchData}
            className="p-2.5 text-slate-400 hover:text-yellow-400 transition-colors rounded-xl hover:bg-yellow-400/10">
            <RefreshCw size={18} />
          </motion.button>
          <motion.button whileHover={{ scale:1.02, y:-1 }} whileTap={{ scale:0.97 }}
            onClick={() => setShowAdd(true)}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm">
            <Plus size={15}/> Add Unit
          </motion.button>
        </div>
      </div>

      {/* Admin KPIs — derived from locally fetched types array so values are always accurate */}
      {isAdmin && units.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Compressor Types"
            value={units.length}
            icon={Layers}
            color="yellow"
            delay={0}
          />
          <KPICard
            label="Total Units"
            value={units.reduce((s, t) => s + (t.unit_count ?? 0), 0)}
            icon={Cpu}
            color="cyan"
            delay={0.1}
          />
          <KPICard
            label="Models Trained"
            value={units.filter(t => t.ml_model).length}
            icon={Brain}
            color="green"
            delay={0.2}
          />
          <KPICard
            label="Active Engineers"
            value={stats?.total_engineers ?? stats?.active_users ?? '—'}
            icon={Users}
            color="white"
            delay={0.3}
          />
        </div>
      )}

      {/* Grid */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h2 className="font-display font-700 text-white text-xl">
              {isEngineer ? 'My Compressor Units' : 'Compressor Types'}
            </h2>
            <span className="tag-yellow">{units.length} {isEngineer ? 'units' : 'types'}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="spinner-yellow w-12 h-12 mx-auto mb-4"/>
              <p className="text-slate-400 font-mono text-sm">Loading...</p>
            </div>
          </div>
        ) : units.length === 0 ? (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            className="card text-center py-20 relative overflow-hidden"
            style={{ border:'1px solid rgba(250,204,21,0.1)' }}>
            <div className="absolute inset-0 bg-grid-yellow opacity-30" />
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mx-auto mb-6">
                <Cpu size={36} className="text-yellow-400/60" />
              </div>
              <h3 className="font-display text-white font-700 text-xl mb-2">
                {isEngineer ? 'No Units Linked Yet' : 'No Compressors Yet'}
              </h3>
              <p className="text-slate-500 text-sm mb-8">
                {isEngineer
                  ? 'Add a compressor unit to start uploading datasets and running analysis'
                  : 'Add the first compressor type to get started'}
              </p>
              <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                onClick={() => setShowAdd(true)}
                className="btn-primary inline-flex items-center gap-2 px-8 py-3">
                <Plus size={16}/> Add First Unit
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {isEngineer
              ? units.map((u, i) => (
                  <motion.div key={u.id} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}>
                    <UnitCard unit={u} onUnlink={handleUnlink} i={i} />
                  </motion.div>
                ))
              : units.map((t, i) => (
                  <motion.div key={t.id} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}>
                    <AdminTypeCard type={t} i={i} />
                  </motion.div>
                ))
            }
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <AddCompressorModal onClose={() => setShowAdd(false)}
            onAdd={u => setUnits(prev => [u, ...prev.filter(x => x.id !== u.id)])} />
        )}
      </AnimatePresence>
    </div>
  )
}
