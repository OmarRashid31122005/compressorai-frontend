import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import api from '../utils/api'
import {
  Upload, CheckCircle, XCircle, AlertTriangle, ChevronRight,
  Zap, Activity, TrendingDown, BarChart3, Download, RefreshCw,
  Info, ChevronDown, ChevronUp, Database, Clock, Eye, Cpu, X, Copy
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell
} from 'recharts'

const CYAN = '#00d4ff', BLUE = '#3b82f6', GREEN = '#00c853', ORANGE = '#f59e0b'
const CLUSTER_COLORS = ['#00d4ff','#3b82f6','#00c853','#f59e0b','#a855f7','#ef4444','#ec4899']

/* ── Score Gauge ───────────────────────────────────────── */
function ScoreGauge({ score = 0, label, color = CYAN }) {
  const pct = Math.min(100, Math.max(0, score))
  return (
    <div className="text-center">
      <div className="relative w-20 h-20 mx-auto mb-2">
        <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
          <circle cx="40" cy="40" r="30" fill="none" stroke="#1e3a5f" strokeWidth="8" />
          <circle cx="40" cy="40" r="30" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${(pct/100)*188.5} 188.5`}
            strokeLinecap="round" className="transition-all duration-1500" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-800 text-sm" style={{color}}>{pct.toFixed(0)}%</span>
        </div>
      </div>
      <div className="text-xs text-slate-400 leading-tight">{label}</div>
    </div>
  )
}

/* ── Custom Tooltip ────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-dark p-3 rounded-xl border border-cyan-400/20 text-xs">
      {label && <div className="text-slate-400 mb-1">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{background: p.color}} />
          <span className="text-slate-300">{p.name}: </span>
          <span className="text-white font-mono">{typeof p.value === 'number' ? p.value.toFixed(3) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Dataset Picker Modal ──────────────────────────────── */
function DatasetPicker({ unitId, onSelect, onClose }) {
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get(`/datasets/my/${unitId}`)
      .then(r => setDatasets(r.data || []))
      .catch(() => toast.error('Failed to load datasets'))
      .finally(() => setLoading(false))
  }, [unitId])

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ opacity:0, scale:0.9, y:20 }} animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.9, y:20 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background:'rgba(8,14,26,0.98)', border:'1px solid rgba(0,212,255,0.2)', boxShadow:'0 0 60px rgba(0,212,255,0.1)' }}>
        <div className="flex items-center justify-between p-5 border-b border-cyan-400/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-400/10 border border-cyan-400/25 flex items-center justify-center">
              <Database size={16} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="font-display font-700 text-white">Select Existing Dataset</h3>
              <p className="text-slate-500 text-xs font-mono">Choose a previously uploaded file</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white rounded-lg transition-all"><X size={16}/></button>
        </div>
        <div className="p-5 max-h-96 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center py-8"><div className="spinner w-8 h-8 mx-auto" /></div>
          ) : datasets.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No datasets uploaded yet for this unit.</div>
          ) : datasets.map(ds => (
            <button key={ds.id} onClick={() => onSelect(ds)}
              className="w-full text-left rounded-xl p-3.5 border border-white/6 hover:bg-white/4 hover:border-cyan-400/20 transition-all group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-display font-600 text-white text-sm truncate">{ds.original_filename}</div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-mono">
                    <span>{ds.clean_rows} rows</span>
                    <span>·</span>
                    <span><Clock size={9} className="inline mr-0.5"/>{new Date(ds.created_at).toLocaleDateString()}</span>
                    {ds.contributed_to_model && <span className="text-green-400">· In ML model</span>}
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-600 group-hover:text-cyan-400 transition-colors flex-shrink-0 mt-0.5" />
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Analysis Page ──────────────────────────────────────── */
export default function Analysis() {
  const { unitId, datasetId: urlDatasetId } = useParams()
  const navigate = useNavigate()

  const [unit, setUnit]             = useState(null)
  const [step, setStep]             = useState('upload')
  const [file, setFile]             = useState(null)
  const [validation, setValidation] = useState(null)
  const [dataset, setDataset]       = useState(null)
  const [results, setResults]       = useState(null)
  const [loading, setLoading]       = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [showAdvanced, setShowAdv]  = useState(false)
  const [userParams, setUserParams] = useState({
    voltage:415, power_factor:0.9, compression_stages:2,
    p_low:7, p_high:10, q_low:45.23, q_high:35.47,
    cost_per_kwh:0, operating_days:365,
    total_lifetime_hours: '', total_lifetime_days: '',
  })
  // backward-compat aliases so existing JSX below continues to work
  const params    = userParams
  const setParams = setUserParams

  useEffect(() => {
    if (!unitId) { navigate('/dashboard'); return }
    localStorage.setItem('last_unit_id', unitId)
    api.get(`/compressors/units/${unitId}`)
      .then(r => setUnit(r.data))
      .catch(() => {})
    if (urlDatasetId) {
      api.get(`/datasets/${urlDatasetId}`)
        .then(r => { setDataset(r.data); setStep('params') })
        .catch(() => {})
    }
  }, [unitId, urlDatasetId])

  /* Upload + validate */
  const onDrop = useCallback(async (accepted) => {
    if (!accepted.length) return
    const f = accepted[0]; setFile(f); setLoading(true)
    try {
      const fd = new FormData(); fd.append('file', f)
      const res = await api.post('/analysis/validate-dataset', fd)
      setValidation(res.data); setStep('validate')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Validation failed')
    } finally { setLoading(false) }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    multiple: false,
  })

  /* Save to Supabase Storage */
  const uploadToStorage = async () => {
    if (!file) return; setLoading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await api.post(`/datasets/upload/${unitId}`, fd)
      setDataset(res.data.dataset); setStep('params')
      toast.success('Dataset saved!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally { setLoading(false) }
  }

  /* Run analysis */
  const runAnalysis = async () => {
    if (!dataset?.id) return
    setStep('running'); setLoading(true)
    try {
      // Derive hours_per_day from lifetime fields if both filled
      const hoursPerDay =
        userParams.total_lifetime_days > 0 && userParams.total_lifetime_hours > 0
          ? userParams.total_lifetime_hours / userParams.total_lifetime_days
          : userParams.hours_per_day ?? 24

      const payload = { ...userParams, hours_per_day: hoursPerDay }

      const fd = new FormData()
      fd.append('params', JSON.stringify(payload))
      const res = await api.post(`/analysis/run/${dataset.id}`, fd)
      setResults(res.data); setStep('results')
      toast.success('Analysis complete! 🎯')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Analysis failed')
      setStep('params')
    } finally { setLoading(false) }
  }

  /* Select existing dataset */
  const selectDataset = (ds) => {
    setDataset(ds); setShowPicker(false); setStep('params')
  }

  /* ✅ FIX: Download report — correct payload structure matching backend reports.py */
  const downloadReport = async (type) => {
    if (!results) return

    // Guard: warn if result_id is missing (path won't be saved to DB)
    if (!results.result_id) {
      toast.error('No analysis ID found — report will download but cannot be saved to history')
      // Still proceed — download works even without DB path saving
    }

    try {
      const payload = {
        compressor_id:    unitId,
        compressor_name:  unit?.unit_id || unitId,
        company_name:     unit?.location || 'Industrial Facility',
        analysis_id:      results.result_id || null,   // ← saves path to DB
        analysis_results: {
          power_saving_percent:      results.power_saving_percent      || 0,
          best_electrical_power:     results.best_electrical_power     || 0,
          best_mechanical_power:     results.best_mechanical_power     || 0,
          baseline_electrical_power: results.baseline_electrical_power || 0,
          best_spc:                  results.best_spc                  || 0,
          scores:                    results.scores                    || {},
          optimal_parameters:        results.optimal_parameters        || {},
          feature_importance:        results.feature_importance        || {},
          scatter_data:              results.scatter_data              || [],
          cluster_data:              results.cluster_data              || [],
          histogram_data:            results.histogram_data            || [],
          training_curve:            results.training_curve            || [],
          cluster_stats:             results.cluster_stats             || {},
          kw_saved:          results.kw_saved          || 0,
          energy_saved_kwh:  results.energy_saved_kwh  || 0,
          cost_saved_annual: results.cost_saved_annual || 0,
          cost_saved_monthly:results.cost_saved_monthly|| 0,
        },
        user_params:    userParams,
        include_graphs: true,
      }
      const res = await api.post(`/reports/${type}`, payload, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a   = document.createElement('a')
      a.href     = url
      a.download = `compressorai_report_${unit?.unit_id || unitId}.${type === 'pdf' ? 'pdf' : 'xlsx'}`
      a.click()
      URL.revokeObjectURL(url)

      // Confirm download + saved to history (only if result_id was present)
      if (results.result_id) {
        toast.success(`${type.toUpperCase()} downloaded & saved to Reports History ✓`)
      } else {
        toast.success(`${type.toUpperCase()} report downloaded!`)
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Unknown error'
      toast.error(`Download failed: ${msg}`)
    }
  }

  /* Download dataset */
  const downloadDataset = async (type) => {
    if (!dataset?.id) return
    try {
      const res = await api.get(`/datasets/${dataset.id}/download/${type}`)
      window.open(res.data.url, '_blank')
    } catch { toast.error('Download failed') }
  }

  /* ✅ NEW: Copy optimal parameters to clipboard */
  const copyParameters = () => {
    if (!results?.optimal_parameters) return
    const lines = Object.entries(results.optimal_parameters)
      .map(([param, vals]) => `${param}: ${vals.optimal?.toFixed(3)} ${vals.unit} (range: ${vals.min?.toFixed(3)}–${vals.max?.toFixed(3)})`)
    const text = `CompressorAI — Optimal Parameters\nUnit: ${unit?.unit_id || unitId}\nEnergy Saving: ${results.power_saving_percent?.toFixed(1)}%\n\n` + lines.join('\n')
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Parameters copied to clipboard!'))
      .catch(() => toast.error('Copy failed'))
  }

  const STEPS = ['upload','validate','params','running','results']
  const stepIdx = STEPS.indexOf(step)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-cyan-400 transition-colors">
            Dashboard
          </button>
          <ChevronRight size={14} className="text-slate-600"/>
          <span className="text-white font-display font-600 flex items-center gap-2">
            <Cpu size={14} className="text-yellow-400"/>
            {unit ? unit.unit_id : 'Optimizer'}
          </span>
        </div>
        {unit && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono"
            style={{ background:'rgba(250,204,21,0.06)', border:'1px solid rgba(250,204,21,0.15)' }}>
            <span className="text-slate-500">{unit.type?.name}</span>
            <span className="text-yellow-400/50">·</span>
            <span className="text-yellow-400">{unit.unit_id}</span>
          </div>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 flex-wrap">
        {[['upload','Upload'],['validate','Validate'],['params','Parameters'],['running','Running'],['results','Results']].map(([s, label], i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full transition-all ${
              i < stepIdx  ? 'bg-green-400/10 text-green-400 border border-green-400/20' :
              i === stepIdx ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/30' :
              'bg-white/5 text-slate-500 border border-white/10'
            }`}>
              {i < stepIdx && <CheckCircle size={10}/>}
              {label}
            </div>
            {i < 4 && <ChevronRight size={12} className="text-slate-600"/>}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── STEP 1: Upload ── */}
        {step === 'upload' && (
          <motion.div key="upload" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}>
            <div className="max-w-2xl mx-auto">
              <div className="card mb-6">
                <h2 className="font-display font-700 text-white text-xl mb-2">Upload Compressor Dataset</h2>
                <p className="text-slate-400 text-sm">Supported: .xlsx, .xls, .csv — Max 10MB</p>
              </div>

              <div {...getRootProps()} className={`card border-2 border-dashed cursor-pointer transition-all duration-200 text-center py-16 ${
                isDragActive ? 'border-cyan-400/60 bg-cyan-400/5' : 'border-cyan-400/20 hover:border-cyan-400/40 hover:bg-cyan-400/3'
              }`}>
                <input {...getInputProps()} />
                {loading ? (
                  <div><div className="spinner w-12 h-12 mx-auto mb-4"/><p className="text-slate-400 font-mono text-sm">Validating...</p></div>
                ) : (
                  <>
                    <Upload size={48} className={`mx-auto mb-4 ${isDragActive ? 'text-cyan-400' : 'text-slate-500'}`}/>
                    <p className="font-display font-600 text-white text-lg mb-2">
                      {isDragActive ? 'Drop it here!' : 'Drag & drop your dataset'}
                    </p>
                    <p className="text-slate-400 text-sm">or click to browse files</p>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/8"/>
                <span className="text-slate-600 text-xs font-mono">OR</span>
                <div className="flex-1 h-px bg-white/8"/>
              </div>
              <button onClick={() => setShowPicker(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-display font-600 text-sm transition-all text-slate-400 hover:text-white"
                style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor='rgba(0,212,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'}>
                <Database size={15}/> Use Existing Dataset
              </button>

              <div className="card mt-6">
                <h3 className="font-display font-600 text-white mb-4 flex items-center gap-2">
                  <Info size={16} className="text-cyan-400"/> Required Column Names
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {['Loading Pressure (bar)','Unloading Pressure (bar)','Inlet Pressure (bar)',
                    'Discharge Pressure (bar)','Current (Amp)'].map(col => (
                    <div key={col} className="flex items-center gap-2 bg-primary-800/50 rounded-lg px-3 py-2">
                      <CheckCircle size={12} className="text-green-400 flex-shrink-0"/>
                      <span className="text-xs font-mono text-slate-300">{col}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Optional: Discharge Temperature (°C), Theoretical Electrical Power (kW) — will be computed if missing.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: Validate ── */}
        {step === 'validate' && validation && (
          <motion.div key="validate" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}>
            <div className="max-w-3xl mx-auto space-y-4">
              <div className={`card border ${validation.is_valid ? 'border-green-400/30' : 'border-orange-400/30'}`}>
                <div className="flex items-center gap-3 mb-4">
                  {validation.is_valid
                    ? <CheckCircle className="text-green-400" size={24}/>
                    : <AlertTriangle className="text-orange-400" size={24}/>}
                  <div>
                    <h2 className="font-display font-700 text-white text-xl">
                      {validation.is_valid ? 'Dataset Valid ✓' : 'Missing Required Columns'}
                    </h2>
                    <p className="text-slate-400 text-sm">{validation.total_rows} rows × {validation.total_columns} columns</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 font-mono mb-2">REQUIRED COLUMNS FOUND:</p>
                    {(validation.present_required || []).map(c => (
                      <div key={c} className="flex items-center gap-2 mb-1">
                        <CheckCircle size={12} className="text-green-400"/>
                        <span className="text-xs font-mono text-slate-300">{c}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    {(validation.missing_required || []).length > 0 && (
                      <>
                        <p className="text-xs text-red-400 font-mono mb-2">MISSING (REQUIRED):</p>
                        {validation.missing_required.map(c => (
                          <div key={c} className="flex items-center gap-2 mb-1">
                            <XCircle size={12} className="text-red-400"/>
                            <span className="text-xs font-mono text-slate-300">{c}</span>
                          </div>
                        ))}
                      </>
                    )}
                    {(validation.can_be_derived || []).length > 0 && (
                      <>
                        <p className="text-xs text-cyan-400 font-mono mb-2">WILL BE COMPUTED:</p>
                        {validation.can_be_derived.map(c => (
                          <div key={c} className="flex items-center gap-2 mb-1">
                            <Zap size={12} className="text-cyan-400"/>
                            <span className="text-xs font-mono text-slate-300">{c}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {validation.sample_data?.length > 0 && (
                <div className="card">
                  <h3 className="font-display font-600 text-white mb-3 flex items-center gap-2">
                    <Eye size={14} className="text-slate-400"/> Data Preview (first 3 rows)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="border-b border-cyan-400/10">
                          {Object.keys(validation.sample_data[0] || {}).slice(0,6).map(k => (
                            <th key={k} className="text-left py-2 px-3 text-slate-400 whitespace-nowrap">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {validation.sample_data.slice(0,3).map((row, i) => (
                          <tr key={i} className="border-b border-white/5">
                            {Object.values(row).slice(0,6).map((v, j) => (
                              <td key={j} className="py-2 px-3 text-slate-300 whitespace-nowrap">
                                {typeof v === 'number' ? v.toFixed(3) : String(v).substring(0,15)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => { setStep('upload'); setFile(null); setValidation(null) }}
                  className="btn-ghost flex-1 py-2.5 text-sm">← Back</button>
                <button onClick={uploadToStorage} disabled={!validation.is_valid || loading}
                  className="flex-1 bg-cyan-400 text-primary-900 font-display font-700 py-2.5 rounded-xl hover:bg-cyan-300 transition-all disabled:opacity-40 text-sm flex items-center justify-center gap-2">
                  {loading ? 'Saving...' : <><Database size={15}/> Save & Continue →</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: Parameters ── */}
        {step === 'params' && (
          <motion.div key="params" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}>
            <div className="max-w-2xl mx-auto space-y-4">
              {dataset && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl"
                  style={{ background:'rgba(0,212,255,0.06)', border:'1px solid rgba(0,212,255,0.15)' }}>
                  <Database size={15} className="text-cyan-400 flex-shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <div className="text-cyan-400 font-display font-600 text-sm truncate">{dataset.original_filename}</div>
                    <div className="text-slate-500 text-xs font-mono">{dataset.clean_rows} clean rows ready</div>
                  </div>
                  <button onClick={() => downloadDataset('raw')}
                    className="p-1.5 text-slate-500 hover:text-cyan-400 transition-colors" title="Download raw">
                    <Download size={13}/>
                  </button>
                </div>
              )}

              <div className="card">
                <h2 className="font-display font-700 text-white text-xl mb-1">Set Operating Parameters</h2>
                <p className="text-slate-400 text-sm">These values define the optimization boundaries.</p>
              </div>

              <div className="card space-y-4">
                <h3 className="font-display font-600 text-cyan-400">Electrical Parameters</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Voltage (V)</label>
                    <input type="number" className="input-field"
                      value={params.voltage} onChange={e=>setParams({...params,voltage:+e.target.value})}/>
                    <p className="text-xs text-slate-500 mt-1">3-Phase inline voltage (default: 415V)</p>
                  </div>
                  <div>
                    <label className="label">Power Factor (cos φ)</label>
                    <input type="number" step="0.01" min="0.1" max="1" className="input-field"
                      value={params.power_factor} onChange={e=>setParams({...params,power_factor:+e.target.value})}/>
                    <p className="text-xs text-slate-500 mt-1">Typical range: 0.85 – 1.0</p>
                  </div>
                </div>
                <div>
                  <label className="label">Compression Stages (z)</label>
                  <div className="flex gap-3">
                    {[1,2,3].map(n => (
                      <button key={n} type="button"
                        onClick={() => setParams({...params, compression_stages:n})}
                        className={`flex-1 py-2.5 rounded-xl border font-display font-600 text-sm transition-all ${
                          params.compression_stages===n ? 'bg-cyan-400/15 border-cyan-400/40 text-cyan-400' : 'border-white/10 text-slate-400 hover:border-white/20'
                        }`}>{n} Stage{n>1?'s':''}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card space-y-4">
                <button className="flex items-center justify-between w-full"
                  onClick={() => setShowAdv(!showAdvanced)}>
                  <h3 className="font-display font-600 text-cyan-400">Flow Rate Interpolation (Advanced)</h3>
                  {showAdvanced ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
                </button>
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
                      className="space-y-4 overflow-hidden">
                      <div className="grid grid-cols-2 gap-4">
                        {[['p_low','P Low (bar)'],['p_high','P High (bar)'],['q_low','Q Low (m³/min)'],['q_high','Q High (m³/min)']].map(([k,l]) => (
                          <div key={k}>
                            <label className="label">{l}</label>
                            <input type="number" step="0.01" className="input-field"
                              value={params[k]} onChange={e=>setParams({...params,[k]:+e.target.value})}/>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500">Linear interpolation: Q(desired) = [(P−P_low)/(P_high−P_low)] × (Q_high−Q_low) + Q_low</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Lifetime-based Cost Savings Parameters ── */}
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center text-2xl">
                    💰
                  </div>
                  <div>
                    <h3 className="font-display font-700 text-xl text-white">Cost Savings Parameters</h3>
                    <p className="text-sm text-slate-400 mt-0.5">Enter real lifetime usage of this compressor</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Tariff */}
                  <div>
                    <label className="label">Electricity Tariff</label>
                    <div className="relative">
                      <input type="number" step="0.01" min="0" className="input-field pr-20"
                        placeholder="e.g. 35"
                        value={userParams.cost_per_kwh || ''}
                        onChange={e => setUserParams(prev => ({ ...prev, cost_per_kwh: +e.target.value }))}/>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">per kWh</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">PKR, USD, or any currency</p>
                  </div>

                  {/* Operating days */}
                  <div>
                    <label className="label">Operating Days / Year</label>
                    <div className="flex gap-2">
                      {[365, 300, 250].map(d => (
                        <button key={d} type="button"
                          onClick={() => setUserParams(prev => ({ ...prev, operating_days: d }))}
                          className={`flex-1 py-2.5 rounded-xl border font-display font-600 text-sm transition-all ${
                            userParams.operating_days === d
                              ? 'bg-green-400/15 border-green-400/40 text-green-400'
                              : 'border-white/10 text-slate-400 hover:border-white/20'
                          }`}>{d} days</button>
                      ))}
                    </div>
                  </div>

                  {/* Lifetime hours */}
                  <div>
                    <label className="label">Total lifetime operating hours</label>
                    <div className="relative">
                      <input type="number" min="0" step="any"
                        placeholder="e.g. 12480"
                        className="input-field pr-16"
                        value={userParams.total_lifetime_hours ?? ''}
                        onChange={e => {
                          const raw = e.target.value
                          if (raw === '') { setUserParams(prev => ({ ...prev, total_lifetime_hours: '' })); return }
                          const num = Number(raw)
                          if (!isNaN(num) && num >= 0) setUserParams(prev => ({ ...prev, total_lifetime_hours: num }))
                        }}/>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">hours</span>
                    </div>
                  </div>

                  {/* Lifetime days */}
                  <div>
                    <label className="label">Total lifetime operating days</label>
                    <div className="relative">
                      <input type="number" min="1" step="1"
                        placeholder="e.g. 520"
                        className="input-field pr-12"
                        value={userParams.total_lifetime_days ?? ''}
                        onChange={e => {
                          const raw = e.target.value
                          if (raw === '') { setUserParams(prev => ({ ...prev, total_lifetime_days: '' })); return }
                          const num = Number(raw)
                          if (!isNaN(num) && num >= 1) setUserParams(prev => ({ ...prev, total_lifetime_days: num }))
                        }}/>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">days</span>
                    </div>
                  </div>

                  {/* Helper note spanning both columns */}
                  <p className="text-xs text-slate-500 mt-1 md:col-span-2">
                    These values calculate a realistic <strong className="text-slate-400">average hours / day</strong> instead of assuming a fixed 24 h.
                  </p>
                </div>

                {/* Calculated avg usage — both fields valid and > 0 */}
                {userParams.total_lifetime_hours > 0 && userParams.total_lifetime_days >= 1 && (
                  <div className="mt-5 p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-xl">
                    <div className="text-sm text-emerald-400 font-medium mb-1">Calculated average usage</div>
                    <div className="text-3xl font-display font-bold text-emerald-300">
                      {(userParams.total_lifetime_hours / userParams.total_lifetime_days).toFixed(1)}
                      <span className="text-xl ml-2 text-emerald-400/70">hours / day</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-2">
                      This value will be used for realistic annual savings estimation
                    </div>
                  </div>
                )}

                {/* Warning — fields filled but values are invalid (zero / negative) */}
                {userParams.total_lifetime_hours !== '' && userParams.total_lifetime_days !== '' &&
                  (Number(userParams.total_lifetime_hours) <= 0 || Number(userParams.total_lifetime_days) <= 0) && (
                  <div className="mt-5 p-4 bg-amber-950/30 border border-amber-800/40 rounded-xl text-amber-300 text-sm">
                    Please enter positive values for both lifetime hours and days
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('upload')} className="btn-ghost flex-1 py-2.5 text-sm">← Back</button>
                <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.98}} onClick={runAnalysis}
                  className="flex-1 bg-cyan-400 text-primary-900 font-display font-700 py-3 rounded-xl hover:bg-cyan-300 transition-all flex items-center justify-center gap-2">
                  <Zap size={16}/> Run AI Analysis
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STEP 4: Running ── */}
        {step === 'running' && (
          <motion.div key="running" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/10 animate-ping" />
                <div className="absolute inset-4 rounded-full border-2 border-cyan-400/20 animate-spin" style={{animationDuration:'3s'}}/>
                <div className="absolute inset-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap size={24} className="text-cyan-400" />
                </div>
              </div>
              <h2 className="font-display font-800 text-2xl text-white mb-3">AI Pipeline Running</h2>
              <div className="space-y-2 text-sm text-slate-400 font-mono max-w-xs mx-auto text-left">
                {['Loading and validating dataset...','Computing derived parameters...','Running DBSCAN clustering...',
                  'Training Gradient Boosting model...','Running Genetic Algorithm...','Computing optimal parameters...'].map((msg, i) => (
                  <motion.div key={i} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*1.5}}>
                    <span className="text-cyan-400">→ </span>{msg}
                  </motion.div>
                ))}
              </div>
              <p className="text-slate-500 text-xs mt-6">This may take 1–3 minutes for large datasets</p>
            </div>
          </motion.div>
        )}

        {/* ── STEP 5: Results ── */}
        {step === 'results' && results && (
          <motion.div key="results" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-display font-800 text-2xl text-white">Analysis Results</h2>
                <p className="text-slate-400 text-sm">{unit?.unit_id} — {results.cluster_stats?.total_points} data points analyzed</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => { setStep('upload'); setFile(null); setValidation(null); setDataset(null); setResults(null) }}
                  className="btn-ghost text-sm py-2 px-4 flex items-center gap-2">
                  <RefreshCw size={14}/> New Analysis
                </button>
                <button onClick={() => downloadReport('excel')}
                  className="flex items-center gap-2 bg-green-400/10 border border-green-400/30 text-green-400 px-4 py-2 rounded-xl text-sm hover:bg-green-400/20 transition-all">
                  <Download size={14}/> Excel
                </button>
                <button onClick={() => downloadReport('pdf')}
                  className="flex items-center gap-2 bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 px-4 py-2 rounded-xl text-sm hover:bg-cyan-400/20 transition-all">
                  <Download size={14}/> PDF Report
                </button>
              </div>
            </div>

            {/* Model Scores */}
            <div className="card">
              <h3 className="font-display font-700 text-white text-lg mb-6">Model Performance Scores</h3>
              <div className="flex justify-around flex-wrap gap-6">
                <ScoreGauge score={results.scores?.silhouette || 0} label="DBSCAN Silhouette" color={CYAN} />
                <ScoreGauge score={results.scores?.r2          || 0} label="R² Score (GBR)"   color={BLUE} />
                <ScoreGauge score={results.scores?.f1          || 0} label="F1 Score"         color={GREEN} />
                <ScoreGauge score={results.scores?.convergence || 0} label="GA Convergence"   color={ORANGE} />
              </div>
            </div>

            {/* Key Results */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label:'Best Electrical Power', value:results.best_electrical_power?.toFixed(2), unit:'kW',        color:'text-cyan-400',   bg:'bg-cyan-400/10'   },
                { label:'Best Mechanical Power', value:results.best_mechanical_power?.toFixed(2),  unit:'kW',        color:'text-blue-400',   bg:'bg-blue-400/10'   },
                { label:'Energy Saving',         value:results.power_saving_percent?.toFixed(2),   unit:'%',         color:'text-green-400',  bg:'bg-green-400/10'  },
                { label:'Best SPC',              value:results.best_spc?.toFixed(4),               unit:'kW/m³/min', color:'text-orange-400', bg:'bg-orange-400/10' },
              ].map(({ label, value, unit, color, bg }) => (
                <div key={label} className="card">
                  <div className="text-slate-400 text-xs font-mono mb-2">{label}</div>
                  <div className={`font-display font-800 text-2xl ${color}`}>{value}</div>
                  <div className="text-slate-500 text-xs mt-1">{unit}</div>
                </div>
              ))}
            </div>

            {/* Energy & Cost Savings Card — always visible when saving > 0 */}
            {(results.kw_saved > 0 || results.power_saving_percent > 0) && (
              <div className="card" style={{background:'linear-gradient(135deg,rgba(21,128,61,0.1),rgba(0,212,255,0.05))',border:'1px solid rgba(21,128,61,0.25)'}}>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="font-display font-700 text-white text-lg">⚡ Energy & Cost Savings</h3>
                  {!(results.cost_per_kwh > 0 || params.cost_per_kwh > 0) && (
                    <span className="text-xs text-yellow-400/80 font-mono px-2 py-1 rounded-lg"
                      style={{background:'rgba(250,204,21,0.08)',border:'1px solid rgba(250,204,21,0.2)'}}>
                      Enter tariff in Parameters to see cost savings
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-black/20 rounded-xl p-4 text-center">
                    <div className="text-slate-400 text-xs font-mono mb-1">kW Saved</div>
                    <div className="font-display font-800 text-2xl text-cyan-400">{results.kw_saved?.toFixed(4)}</div>
                    <div className="text-slate-500 text-xs mt-0.5">kW / hour</div>
                  </div>
                  <div className="bg-black/20 rounded-xl p-4 text-center">
                    <div className="text-slate-400 text-xs font-mono mb-1">Energy Saved / Year</div>
                    <div className="font-display font-800 text-2xl text-blue-400">{results.energy_saved_kwh?.toLocaleString(undefined,{maximumFractionDigits:1})}</div>
                    <div className="text-slate-500 text-xs mt-0.5">kWh</div>
                  </div>
                  <div className="bg-black/20 rounded-xl p-4 text-center">
                    <div className="text-slate-400 text-xs font-mono mb-1">Cost Saved / Month</div>
                    {(results.cost_per_kwh > 0 || params.cost_per_kwh > 0) && results.cost_saved_monthly > 0
                      ? <div className="font-display font-800 text-2xl text-green-400">{results.cost_saved_monthly?.toLocaleString(undefined,{maximumFractionDigits:0})}</div>
                      : <div className="font-mono text-slate-600 text-xl mt-1">—</div>}
                    <div className="text-slate-500 text-xs mt-0.5">{results.cost_saved_monthly > 0 ? '/ month' : 'set tariff'}</div>
                  </div>
                  <div className="bg-black/20 rounded-xl p-4 text-center">
                    <div className="text-slate-400 text-xs font-mono mb-1">Cost Saved / Year</div>
                    {(results.cost_per_kwh > 0 || params.cost_per_kwh > 0) && results.cost_saved_annual > 0
                      ? <div className="font-display font-800 text-2xl text-green-400">{results.cost_saved_annual?.toLocaleString(undefined,{maximumFractionDigits:0})}</div>
                      : <div className="font-mono text-slate-600 text-xl mt-1">—</div>}
                    <div className="text-slate-500 text-xs mt-0.5">{results.cost_saved_annual > 0 ? '/ year' : 'set tariff'}</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/8 text-xs text-slate-500 font-mono flex flex-wrap gap-3">
                  <span>Baseline: {results.baseline_electrical_power} kW → Optimal: {results.best_electrical_power} kW</span>
                  <span>· {results.hours_per_day || params.hours_per_day || 24}h/day · {results.operating_days || params.operating_days || 365} days/yr</span>
                  {(results.cost_per_kwh > 0 || params.cost_per_kwh > 0) && <span>· Tariff: {results.cost_per_kwh || params.cost_per_kwh}/kWh</span>}
                </div>
              </div>
            )}

            {/* Power Saving Bar */}
            <div className="card">
              <h3 className="font-display font-700 text-white mb-4">Power Saving Comparison</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name:'Baseline (Average)', power:results.baseline_electrical_power },
                  { name:'Optimal Target',     power:results.best_electrical_power     },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{fontSize:12}} />
                  <YAxis stroke="#64748b" tick={{fontSize:11}} label={{value:'kW',angle:-90,position:'insideLeft',fill:'#64748b',fontSize:11}} />
                  <Tooltip content={<CustomTooltip/>} />
                  <Bar dataKey="power" radius={[6,6,0,0]}>
                    {[{fill:'#475569'},{fill:CYAN}].map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Training Convergence */}
            {results.training_curve && (
              <div className="card">
                <h3 className="font-display font-700 text-white mb-4">Model Training Convergence</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={results.training_curve.train?.map((v, i) => ({
                    iter:i+1, train:v, test:results.training_curve.test?.[i]
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="iter" stroke="#64748b" tick={{fontSize:10}} />
                    <YAxis stroke="#64748b" tick={{fontSize:10}} />
                    <Tooltip content={<CustomTooltip/>} />
                    <Legend wrapperStyle={{fontSize:12,color:'#94a3b8'}} />
                    <Line type="monotone" dataKey="train" stroke={BLUE} strokeWidth={2} dot={false} name="Train MAE" />
                    <Line type="monotone" dataKey="test"  stroke={CYAN} strokeWidth={2} dot={false} name="Test MAE"  />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Scatter plots */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="font-display font-700 text-white mb-4">Electrical vs Mechanical Power</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="x" stroke="#64748b" tick={{fontSize:10}} name="Elec Power" unit="kW" />
                    <YAxis dataKey="y" stroke="#64748b" tick={{fontSize:10}} name="Mech Power" unit="kW" />
                    <Tooltip content={<CustomTooltip/>} cursor={{strokeDasharray:'3 3'}} />
                    <Scatter data={results.scatter_data || []}>
                      {(results.scatter_data||[]).map((entry, i) => (
                        <Cell key={i} fill={CLUSTER_COLORS[(entry.cluster+1)%CLUSTER_COLORS.length] || CYAN} fillOpacity={0.7} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h3 className="font-display font-700 text-white mb-4">Clustering (DBSCAN)</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="x" stroke="#64748b" tick={{fontSize:10}} name="Elec Power" unit="kW" />
                    <YAxis dataKey="y" stroke="#64748b" tick={{fontSize:10}} name="SPC" />
                    <Tooltip content={<CustomTooltip/>} />
                    <Scatter data={results.cluster_data || []}>
                      {(results.cluster_data||[]).map((entry, i) => (
                        <Cell key={i} fill={entry.cluster === -1 ? '#ef444466' : CLUSTER_COLORS[entry.cluster%CLUSTER_COLORS.length]} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
                <p className="text-xs text-slate-500 mt-2 font-mono">Red = noise points, Colors = clusters</p>
              </div>
            </div>

            {/* Histograms */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="font-display font-700 text-white mb-4">Electrical Power Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={results.histogram_data?.electrical || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="bin" stroke="#64748b" tick={{fontSize:9}} />
                    <YAxis stroke="#64748b" tick={{fontSize:10}} />
                    <Tooltip content={<CustomTooltip/>} />
                    <Bar dataKey="count" fill={CYAN} fillOpacity={0.8} radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h3 className="font-display font-700 text-white mb-4">Mechanical Power Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={results.histogram_data?.mechanical || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="bin" stroke="#64748b" tick={{fontSize:9}} />
                    <YAxis stroke="#64748b" tick={{fontSize:10}} />
                    <Tooltip content={<CustomTooltip/>} />
                    <Bar dataKey="count" fill={BLUE} fillOpacity={0.8} radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Feature Importance */}
            <div className="card">
              <h3 className="font-display font-700 text-white mb-4">Feature Importance</h3>
              <div className="space-y-3">
                {Object.entries(results.feature_importance || {}).sort(([,a],[,b]) => b-a).map(([feat, score]) => (
                  <div key={feat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-mono">{feat}</span>
                      <span className="text-cyan-400 font-mono">{(score*100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-primary-800 rounded-full">
                      <motion.div initial={{width:0}} animate={{width:`${score*100}%`}} transition={{duration:1,ease:'easeOut'}}
                        className="h-full progress-bar rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ✅ IMPROVED: Optimal Parameters with Copy button */}
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display font-700 text-white text-xl">🎯 Optimal Operating Parameters</h3>
                <button onClick={copyParameters}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-600 transition-all"
                  style={{ background:'rgba(0,212,255,0.08)', border:'1px solid rgba(0,212,255,0.2)', color:'#00d4ff' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(0,212,255,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(0,212,255,0.08)'}>
                  <Copy size={12}/> Copy Parameters
                </button>
              </div>
              <p className="text-slate-400 text-sm mb-6">
                Operate within these ranges to achieve{' '}
                <span className="text-green-400 font-700">{results.power_saving_percent?.toFixed(1)}% energy saving</span> with maximum mechanical output.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(results.optimal_parameters || {}).map(([param, vals]) => (
                  <div key={param} className="bg-primary-800/50 rounded-xl p-4 border border-cyan-400/10 hover:border-cyan-400/25 transition-colors">
                    <div className="text-xs text-slate-400 font-mono mb-2 leading-tight">{param}</div>
                    <div className="font-display font-800 text-2xl text-cyan-400 mb-1">
                      {vals.optimal?.toFixed(3)}<span className="text-sm text-slate-400 ml-1">{vals.unit}</span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">Range: {vals.min?.toFixed(3)} – {vals.max?.toFixed(3)}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dataset Picker Modal */}
      <AnimatePresence>
        {showPicker && (
          <DatasetPicker unitId={unitId} onSelect={selectDataset} onClose={() => setShowPicker(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}