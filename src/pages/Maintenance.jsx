/**
 * Maintenance.jsx — CompressorAI v6
 * PM Plan Compliance & Work Order Analysis
 *
 * Changes from v5:
 *  - "Sound" option removed from step indicators
 *  - "Stages" input added to Operating Parameters
 *  - "Operating days per year" removed
 *  - Table heading "Status" → "Recency Status"
 *  - Table heading "Cost"   → "Total Cost"
 *  - Maintenance Tutorial tab added (Step 0)
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, Calendar, Zap, BarChart3, CheckCircle, AlertTriangle,
  XCircle, Clock, TrendingDown, RefreshCw, ChevronDown, ChevronUp,
  Settings, FileSpreadsheet, Activity, Plus, Minus, Info, Eye,
  ArrowRight, Gauge, Wrench, BookOpen, ChevronLeft, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, Legend
} from 'recharts'
import api from '../utils/api'

// ── Constants ─────────────────────────────────────────────────
const RECENCY_COLORS = {
  'OK':         { bg: 'rgba(0,200,83,0.1)',  border: 'rgba(0,200,83,0.3)',  text: '#00c853', icon: CheckCircle },
  'Due Soon':   { bg: 'rgba(250,204,21,0.1)',border: 'rgba(250,204,21,0.3)',text: '#facc15', icon: Clock },
  'Overdue':    { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#ef4444', icon: XCircle },
}
const INTERVAL_COLORS = {
  'On Track':        '#00c853',
  'Over-maintained': '#00d4ff',
  'Under-maintained':'#ef4444',
  'Never Performed': '#64748b',
  'Unknown':         '#64748b',
}
const COMPLIANCE_COLOR = (v) => v >= 90 ? '#00c853' : v >= 70 ? '#facc15' : '#ef4444'

// ── Tutorial Steps ────────────────────────────────────────────
const tutorialSteps = [
  {
    icon: Wrench,
    color: '#facc15',
    title: 'What is PM Compliance Analysis?',
    content: 'PM (Preventive Maintenance) Compliance Analysis compares your actual maintenance work orders against a planned PM schedule. It tells you which tasks are overdue, which are being done too frequently, and gives you an overall compliance score.',
    highlight: '→ Goal: Ensure every PM task is done on time, not too early, not too late.',
    visual: (
      <div className="space-y-3 font-mono text-sm">
        {[
          { label: 'PM Plan',        desc: 'What SHOULD be done & when',   color: '#facc15' },
          { label: 'Work Orders',    desc: 'What WAS actually done',       color: '#00d4ff' },
          { label: 'CompressorAI',   desc: 'Compares both & gives scores', color: '#00c853' },
        ].map(({ label, desc, color }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}25` }}>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
            <span style={{ color }} className="w-28 flex-shrink-0 font-600">{label}</span>
            <span className="text-slate-400 text-xs">{desc}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: FileSpreadsheet,
    color: '#facc15',
    title: 'Step 1: Prepare Your PM Plan Excel',
    content: 'Your PM Plan Excel file tells the system what maintenance tasks exist and how often they should be performed. The file must contain at least these columns:',
    highlight: '→ Tip: Column names must match exactly (case-insensitive is fine)',
    visual: (
      <div className="space-y-2">
        {[
          ['Machine',          'Compressor unit name / tag',        true],
          ['Task/Description', 'What maintenance is done',          true],
          ['Frequency',        'e.g. "700 Hours" or "2000 Hours"',  true],
          ['Cost (PKR)',       'Estimated cost per task',           false],
        ].map(([col, desc, required]) => (
          <div key={col} className="flex items-center gap-3 rounded-lg px-3 py-2.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${required ? 'rgba(250,204,21,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
            <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px]"
              style={{ background: required ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.05)', color: required ? '#facc15' : '#475569' }}>
              {required ? '✓' : '?'}
            </span>
            <span className="font-mono text-sm text-slate-200 w-36 flex-shrink-0">{col}</span>
            <span className="text-slate-500 text-xs">{desc}</span>
            {required && <span className="ml-auto text-yellow-400/60 text-[10px] font-mono">required</span>}
          </div>
        ))}
        <p className="text-xs text-slate-500 mt-2 px-1">Frequency examples: "700 Hours", "2000 Hrs", "1000h"</p>
      </div>
    ),
  },
  {
    icon: FileText,
    color: '#00d4ff',
    title: 'Step 2: Prepare Your Work Order (WO) File',
    content: 'Your Work Order file is a SAP export or similar Excel containing all maintenance events that were actually performed. Required columns:',
    highlight: '→ Tip: Export directly from SAP PM module as Excel',
    visual: (
      <div className="space-y-2">
        {[
          ['Description',   'Matches PM task (NLP auto-matches)', true ],
          ['Actual Start',  'Date the work was done',             true ],
          ['Cost',          'Actual cost in PKR',                 false],
          ['Order No.',     'SAP work order number',              false],
        ].map(([col, desc, required]) => (
          <div key={col} className="flex items-center gap-3 rounded-lg px-3 py-2.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${required ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
            <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px]"
              style={{ background: required ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)', color: required ? '#00d4ff' : '#475569' }}>
              {required ? '✓' : '?'}
            </span>
            <span className="font-mono text-sm text-slate-200 w-36 flex-shrink-0">{col}</span>
            <span className="text-slate-500 text-xs">{desc}</span>
            {required && <span className="ml-auto text-cyan-400/60 text-[10px] font-mono">required</span>}
          </div>
        ))}
        <div className="mt-3 rounded-lg px-3 py-2.5"
          style={{ background: 'rgba(0,200,83,0.05)', border: '1px solid rgba(0,200,83,0.15)' }}>
          <p className="text-xs text-green-400 font-600 mb-1">🤖 Auto NLP Matching</p>
          <p className="text-xs text-slate-400">The system uses TF-IDF + keyword overlap to automatically match WO descriptions to PM tasks — no manual mapping needed.</p>
        </div>
      </div>
    ),
  },
  {
    icon: Settings,
    color: '#00c853',
    title: 'Step 3: Configure Operating Parameters',
    content: 'Set the compressor operating parameters so the system can convert maintenance dates into running hours accurately.',
    highlight: '→ Annual Running Hours: typical industrial compressor = 1500–2000 hrs/year',
    visual: (
      <div className="space-y-3 font-mono text-sm">
        <div className="rounded-xl p-3" style={{ background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.2)' }}>
          <p className="text-yellow-400 text-xs font-600 mb-2">📌 Parameters Explained</p>
          {[
            ['Commissioning Date', 'When the compressor first started operating (optional — auto-detected from WO file if blank)'],
            ['Operating Years',    'How many years of data you have (1–20)'],
            ['Annual Hours / Year','Running hours per year for each year (e.g. 1866 hrs = 24/7 with downtime)'],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2 py-1.5 border-b last:border-0" style={{ borderColor: 'rgba(250,204,21,0.1)' }}>
              <span className="text-yellow-400 flex-shrink-0 w-36 text-xs">{k}</span>
              <span className="text-slate-400 text-xs leading-relaxed">{v}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: BarChart3,
    color: '#a855f7',
    title: 'Step 4: Read Your Results',
    content: 'After analysis, you get a detailed compliance table and charts for every PM task. Here is what each column means:',
    highlight: '→ Click any row in the table to expand work order event details!',
    visual: (
      <div className="space-y-2.5">
        {[
          ['Compliance %',    'How well the task was done vs planned. 100% = perfect.', '#00c853'],
          ['Expected',        'How many times the PM plan says the task should occur.',  '#94a3b8'],
          ['Actual',          'How many times the task was actually performed.',         '#00d4ff'],
          ['Raw WOs',         'Total SAP work orders before deduplication.',             '#64748b'],
          ['Interval Ratio',  '1x = on schedule. >1x = over-maintained. <1x = under.',  '#facc15'],
          ['Recency Status',  'OK / Due Soon / Overdue — based on last event date.',     '#ef4444'],
          ['Delay',           'Hours past the due date for the last event.',             '#f59e0b'],
          ['Total Cost',      'Sum of costs for all WOs matching this task.',            '#00c853'],
        ].map(([col, desc, color]) => (
          <div key={col} className="flex gap-3 text-xs rounded-lg px-3 py-2"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="font-mono font-600 w-28 flex-shrink-0" style={{ color }}>{col}</span>
            <span className="text-slate-400 leading-relaxed">{desc}</span>
          </div>
        ))}
      </div>
    ),
  },
]

// ── Tutorial Modal ────────────────────────────────────────────
function MaintenanceTutorial({ onClose }) {
  const [current, setCurrent] = useState(0)
  const step = tutorialSteps[current]
  const Icon = step.icon

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(4,10,22,0.92)', backdropFilter: 'blur(10px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl"
        style={{ background: 'rgba(8,20,40,0.98)', border: '1px solid rgba(0,212,255,0.15)', boxShadow: '0 40px 100px rgba(0,0,0,0.7)' }}>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
          style={{ background: 'rgba(8,20,40,0.98)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `${step.color}15`, border: `1px solid ${step.color}30` }}>
              <Icon size={16} style={{ color: step.color }} />
            </div>
            <span className="font-display font-700 text-white">PM Compliance Tutorial</span>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            ✕
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2 px-6 pt-4">
          {tutorialSteps.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === current ? '24px' : '6px',
                background: i === current ? step.color : i < current ? '#00c853' : 'rgba(255,255,255,0.1)',
              }} />
          ))}
          <span className="text-xs text-slate-600 font-mono ml-auto">{current + 1} / {tutorialSteps.length}</span>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={current}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="px-6 py-5 space-y-4">

            <div>
              <div className="text-xs font-mono mb-1" style={{ color: step.color }}>Step {current + 1} of {tutorialSteps.length}</div>
              <h3 className="font-display font-800 text-white text-xl">{step.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mt-2">{step.content}</p>
            </div>

            {/* Highlight */}
            <div className="rounded-xl px-4 py-3 text-sm font-mono border-l-2"
              style={{ background: `${step.color}08`, borderColor: step.color, color: step.color }}>
              {step.highlight}
            </div>

            {/* Visual */}
            <div className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {step.visual}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer nav */}
        <div className="flex items-center justify-between px-6 py-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button onClick={() => current > 0 && setCurrent(c => c - 1)}
            disabled={current === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-display font-600 disabled:opacity-30 transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
            <ChevronLeft size={14} /> Previous
          </button>

          {current < tutorialSteps.length - 1 ? (
            <button onClick={() => setCurrent(c => c + 1)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-display font-700 text-[#080e1a] transition-all"
              style={{ background: step.color }}>
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button onClick={onClose}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-display font-700 text-[#080e1a] transition-all"
              style={{ background: '#00c853' }}>
              <CheckCircle size={14} /> Got it, let's start!
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ── File Drop Zone ────────────────────────────────────────────
function DropZone({ label, accept, file, onFile, icon: Icon, hint, color = '#00d4ff' }) {
  const ref = useRef()
  const [drag, setDrag] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }
  return (
    <div
      ref={ref}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => ref.current.querySelector('input').click()}
      className="cursor-pointer rounded-xl p-5 flex flex-col items-center gap-3 transition-all"
      style={{
        border: `1.5px dashed ${drag ? color : file ? `${color}88` : 'rgba(255,255,255,0.12)'}`,
        background: drag ? `${color}08` : file ? `${color}06` : 'rgba(255,255,255,0.02)',
      }}>
      <input type="file" accept={accept} className="hidden"
        onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
      <Icon size={26} style={{ color: file ? color : '#475569' }} />
      {file
        ? <div className="text-center">
            <p className="text-sm font-display font-600" style={{ color }}>{file.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
        : <div className="text-center">
            <p className="text-sm font-display font-600 text-slate-300">{label}</p>
            {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
          </div>
      }
    </div>
  )
}

// ── Status Badge ──────────────────────────────────────────────
function StatusBadge({ status, type = 'recency' }) {
  const map = type === 'recency' ? RECENCY_COLORS : {}
  const cfg = map[status] || { bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.3)', text: '#64748b', icon: Info }
  const Icon = cfg.icon || Info
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-600"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text }}>
      <Icon size={10} /> {status}
    </span>
  )
}

// ── Compliance Row ────────────────────────────────────────────
function ComplianceRow({ row, i }) {
  const [open, setOpen] = useState(false)
  const bar = Math.min(100, row.compliance_pct)
  const intColor = INTERVAL_COLORS[row.interval_status] || '#64748b'

  return (
    <>
      <tr className="border-b transition-colors hover:bg-white/[0.02] cursor-pointer"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        onClick={() => setOpen(o => !o)}>
        <td className="px-4 py-3">
          <div className="font-display font-600 text-white text-sm">{row.task}</div>
          <div className="text-slate-500 text-xs font-mono mt-0.5">Every {row.interval_hours.toLocaleString()} hrs</div>
        </td>
        <td className="px-4 py-3 text-center">
          <div className="font-mono text-sm" style={{ color: COMPLIANCE_COLOR(row.compliance_pct) }}>
            {row.compliance_pct}%
          </div>
          <div className="w-full h-1.5 rounded-full mt-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${bar}%`, background: COMPLIANCE_COLOR(row.compliance_pct) }} />
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          <div className="text-slate-300 text-sm font-mono">{row.expected_pm}</div>
        </td>
        <td className="px-4 py-3 text-center">
          <div className="text-sm font-mono" style={{ color: row.actual_pm < row.expected_pm ? '#ef4444' : row.actual_pm > row.expected_pm ? '#00d4ff' : '#00c853' }}>
            {row.actual_pm}
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          <div className="text-xs font-mono text-slate-500" title="Total SAP work orders before deduplication">
            {row.raw_wo_count ?? row.actual_pm}
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          <div className="text-xs font-mono" style={{ color: intColor }}>
            {row.interval_ratio != null ? `${row.interval_ratio}x` : '—'}
          </div>
          <div className="text-xs mt-0.5" style={{ color: intColor }}>{row.interval_status}</div>
        </td>
        {/* ✅ CHANGED: "Status" → "Recency Status" (shown in header, badge unchanged) */}
        <td className="px-4 py-3 text-center"><StatusBadge status={row.recency_status} type="recency" /></td>
        <td className="px-4 py-3 text-center">
          {row.delay_hours > 0
            ? <span className="text-xs font-mono text-red-400">+{row.delay_hours.toLocaleString()} hrs</span>
            : <span className="text-xs text-slate-600">—</span>}
        </td>
        {/* ✅ CHANGED: "Cost" → "Total Cost" (shown in header) */}
        <td className="px-4 py-3 text-center">
          <div className="text-xs font-mono text-slate-400">{row.total_cost > 0 ? `PKR ${row.total_cost.toLocaleString()}` : '—'}</div>
        </td>
        <td className="px-4 py-3 text-center">
          {open ? <ChevronUp size={14} className="text-slate-500 mx-auto" /> : <ChevronDown size={14} className="text-slate-500 mx-auto" />}
        </td>
      </tr>

      {open && row.events?.length > 0 && (
        <tr style={{ background: 'rgba(0,0,0,0.15)' }}>
          <td colSpan={10} className="px-8 py-4">
            <p className="text-xs font-mono text-slate-500 mb-3">WORK ORDER EVENTS ({row.events.length})</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {row.events.map((ev, j) => (
                <div key={j} className="flex items-center gap-4 text-xs font-mono py-1.5 px-3 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-cyan-400 w-20 flex-shrink-0">{ev.running_hours.toLocaleString()} hrs</span>
                  <span className="text-slate-500 w-24 flex-shrink-0">{ev.date}</span>
                  <span className="text-slate-300 flex-1 truncate">{ev.description}</span>
                  {ev.wo_count > 1 && (
                    <span className="text-yellow-400/60 text-[10px] flex-shrink-0"
                      title="Multiple SAP WOs on same day — counted as 1 event">
                      {ev.wo_count} WOs
                    </span>
                  )}
                  {ev.cost > 0 && <span className="text-yellow-400 flex-shrink-0">PKR {ev.cost.toLocaleString()}</span>}
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Summary KPI Card ──────────────────────────────────────────
function KpiCard({ label, value, sub, color = '#00d4ff', icon: Icon }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon size={13} style={{ color }} />}
        <span className="text-xs text-slate-500 font-mono">{label}</span>
      </div>
      <div className="font-display font-800 text-2xl" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────
export default function Maintenance() {
  const navigate = useNavigate()

  // Tutorial
  const [showTutorial, setShowTutorial] = useState(false)

  // Step management
  const [step, setStep] = useState(1)  // 1=Setup, 2=Config, 3=Results

  // Unit selection
  const [units, setUnits]       = useState([])
  const [selectedUnit, setUnit] = useState(null)

  // Files
  const [pmFile, setPmFile]     = useState(null)
  const [woFile, setWoFile]     = useState(null)

  // PM plan from DB
  const [activePlan, setActivePlan]   = useState(null)
  const [planLoading, setPlanLoading] = useState(false)

  // Configuration
  const [startDate, setStartDate]   = useState('')
  const [numYears, setNumYears]     = useState(1)
  const [yearlyHours, setYearlyHours] = useState([1866])
  // ✅ NEW: Stages input
  const [stages, setStages] = useState(2)

  // Analysis
  const [loading, setLoading]   = useState(false)
  const [results, setResults]   = useState(null)
  const [history, setHistory]   = useState([])

  // ── Load user units ────────────────────────────────────────
  useEffect(() => {
    api.get('/compressors/units/my').then(r => setUnits(r.data || [])).catch(() => {})
  }, [])

  // ── Load active PM plan when unit selected ─────────────────
  useEffect(() => {
    if (!selectedUnit) { setActivePlan(null); return }
    setPlanLoading(true)
    api.get(`/maintenance/pm-plan/${selectedUnit.id}`)
      .then(r => setActivePlan(r.data))
      .catch(() => setActivePlan(null))
      .finally(() => setPlanLoading(false))

    api.get(`/maintenance/history/${selectedUnit.id}`)
      .then(r => setHistory(r.data || []))
      .catch(() => setHistory([]))
  }, [selectedUnit])

  // ── Sync year inputs ───────────────────────────────────────
  const handleNumYears = (n) => {
    const clamped = Math.max(1, Math.min(20, n))
    setNumYears(clamped)
    setYearlyHours(prev => {
      const arr = [...prev]
      while (arr.length < clamped) arr.push(arr[arr.length - 1] || 1866)
      return arr.slice(0, clamped)
    })
  }

  // ── Upload PM Plan ─────────────────────────────────────────
  const handleUploadPM = async () => {
    if (!pmFile || !selectedUnit) return
    const fd = new FormData()
    fd.append('file', pmFile)
    try {
      const r = await api.post(`/maintenance/upload-pm/${selectedUnit.id}`, fd)
      toast.success(`PM plan uploaded: ${r.data.tasks?.length} tasks`)
      setActivePlan(r.data)
      setPmFile(null)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'PM plan upload failed')
    }
  }

  // ── Run Analysis ───────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!woFile)                 { toast.error('Upload a Work Order file first'); return }
    if (!selectedUnit)           { toast.error('Select a compressor unit'); return }
    if (!activePlan)             { toast.error('Upload a PM Plan first'); return }
    if (yearlyHours.some(h => !h || h <= 0)) { toast.error('All yearly hours must be > 0'); return }
    if (!stages || stages < 1)   { toast.error('Stages must be at least 1'); return }

    setLoading(true)
    setResults(null)
    try {
      const fd = new FormData()
      fd.append('wo_file',      woFile)
      if (startDate) fd.append('start_date', startDate)
      fd.append('yearly_hours', JSON.stringify(yearlyHours))
      fd.append('stages',       String(stages))   // ✅ NEW: pass stages to backend
      const r = await api.post(`/maintenance/analyze/${selectedUnit.id}`, fd)
      setResults(r.data)
      setStep(3)
      toast.success('Analysis complete!')
      api.get(`/maintenance/history/${selectedUnit.id}`).then(h => setHistory(h.data || []))
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  // ── Load past analysis ─────────────────────────────────────
  const loadHistoryItem = async (id) => {
    try {
      const r = await api.get(`/maintenance/analysis/${id}`)
      setResults(r.data)
      setStep(3)
    } catch { toast.error('Failed to load analysis') }
  }

  // ── Derived chart data ─────────────────────────────────────
  const chartData = results?.results?.map(r => ({
    name:        r.task.length > 28 ? r.task.slice(0, 26) + '…' : r.task,
    fullName:    r.task,
    expected:    r.interval_hours,
    actual:      r.avg_interval || 0,
    compliance:  r.compliance_pct,
    overCost:    r.over_maint_cost,
  })) || []

  const s = results?.summary || {}

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 page-enter">

      {/* Tutorial Modal */}
      {showTutorial && <MaintenanceTutorial onClose={() => setShowTutorial(false)} />}

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-800 text-3xl text-white flex items-center gap-3">
            <Wrench size={26} className="text-yellow-400" /> PM Compliance
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Compare actual maintenance against PM plan — compliance, intervals, overdue status
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* ✅ NEW: Tutorial button */}
          <button onClick={() => setShowTutorial(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-display font-600 transition-all"
            style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)', color: '#facc15' }}>
            <BookOpen size={14} /> Tutorial
          </button>
          {results && (
            <button onClick={() => setStep(step === 3 ? 1 : 3)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-display font-600 transition-all"
              style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff' }}>
              {step === 3 ? <Settings size={14} /> : <BarChart3 size={14} />}
              {step === 3 ? 'New Analysis' : 'View Results'}
            </button>
          )}
        </div>
      </div>

      {/* ── Step Indicator ── */}
      {/* ✅ "Sound" option REMOVED — only Setup, Configure, Results */}
      <div className="flex items-center gap-3">
        {[
          { n: 1, label: 'Setup' },
          { n: 2, label: 'Configure' },
          { n: 3, label: 'Results' },
        ].map(({ n, label }, i) => (
          <div key={n} className="flex items-center gap-3">
            <button onClick={() => (n < 3 || results) && setStep(n)}
              className="flex items-center gap-2 text-sm font-display font-600 transition-all"
              style={{ color: step === n ? '#facc15' : step > n ? '#00c853' : '#475569' }}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs border"
                style={{
                  background: step === n ? 'rgba(250,204,21,0.15)' : step > n ? 'rgba(0,200,83,0.15)' : 'rgba(255,255,255,0.04)',
                  borderColor: step === n ? '#facc15' : step > n ? '#00c853' : 'rgba(255,255,255,0.1)',
                  color: step === n ? '#facc15' : step > n ? '#00c853' : '#475569',
                }}>
                {step > n ? '✓' : n}
              </span>
              {label}
            </button>
            {i < 2 && <ArrowRight size={12} className="text-slate-700" />}
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════
          STEP 1 — SETUP
      ═══════════════════════════════════════════════════════ */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

          {/* Unit Selection */}
          <div className="card">
            <h2 className="font-display font-700 text-white text-lg mb-4 flex items-center gap-2">
              <Zap size={16} className="text-cyan-400" /> Select Compressor Unit
            </h2>
            {units.length === 0
              ? <p className="text-slate-500 text-sm">No units linked. <button onClick={() => navigate('/dashboard')} className="text-cyan-400 underline">Go to Dashboard</button> to link a unit.</p>
              : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {units.map(u => (
                    <button key={u.id} onClick={() => setUnit(u)}
                      className="rounded-xl p-4 text-left transition-all"
                      style={{
                        background: selectedUnit?.id === u.id ? 'rgba(250,204,21,0.08)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${selectedUnit?.id === u.id ? 'rgba(250,204,21,0.4)' : 'rgba(255,255,255,0.07)'}`,
                      }}>
                      <div className="font-display font-700 text-white text-sm">{u.unit_id}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{u.type?.name || 'Compressor'}</div>
                      {u.location && <div className="text-slate-600 text-xs">{u.location}</div>}
                    </button>
                  ))}
                </div>
            }
          </div>

          {selectedUnit && (
            <>
              {/* PM Plan Upload */}
              <div className="card">
                <h2 className="font-display font-700 text-white text-lg mb-1 flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-yellow-400" /> PM Plan
                </h2>
                <p className="text-slate-500 text-xs mb-4">Upload Excel with columns: Machine, Task/Description, Frequency (e.g. "700 Hours")</p>

                {activePlan && (
                  <div className="rounded-xl p-3 mb-4 flex items-center gap-3"
                    style={{ background: 'rgba(0,200,83,0.06)', border: '1px solid rgba(0,200,83,0.2)' }}>
                    <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                    <div>
                      <div className="text-green-400 font-display font-600 text-sm">Active PM Plan</div>
                      <div className="text-slate-400 text-xs font-mono">{activePlan.tasks?.length || activePlan.original_filename} tasks · uploaded {activePlan.created_at?.split('T')[0]}</div>
                    </div>
                    <span className="ml-auto text-slate-600 text-xs cursor-pointer hover:text-red-400 transition-colors"
                      onClick={() => setPmFile(null)}>replace</span>
                  </div>
                )}

                <DropZone
                  label={activePlan ? "Upload new PM Plan" : "Drop PM Plan Excel here"}
                  accept=".xlsx,.xls,.csv"
                  file={pmFile}
                  onFile={setPmFile}
                  icon={FileSpreadsheet}
                  hint="Excel with Task & Frequency columns"
                  color="#facc15"
                />

                {pmFile && (
                  <button onClick={handleUploadPM}
                    className="mt-3 w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2">
                    <Upload size={14} /> Upload PM Plan
                  </button>
                )}
              </div>

              {activePlan && (
                <button onClick={() => setStep(2)} className="w-full btn-cyan py-3 font-display font-700 flex items-center justify-center gap-2">
                  Continue to Configure <ArrowRight size={16} />
                </button>
              )}
            </>
          )}

          {/* History */}
          {selectedUnit && history.length > 0 && (
            <div className="card">
              <h3 className="font-display font-600 text-white text-sm mb-3 flex items-center gap-2">
                <Clock size={14} className="text-slate-500" /> Past Analyses
              </h3>
              <div className="space-y-2">
                {history.map(h => (
                  <button key={h.id} onClick={() => loadHistoryItem(h.id)}
                    className="w-full rounded-xl p-3 flex items-center gap-4 text-left transition-all"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>
                    <BarChart3 size={14} className="text-cyan-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-display font-600 text-white">{h.wo_filename || 'Workorder'}</div>
                      <div className="text-xs text-slate-500 font-mono">{h.created_at?.split('T')[0]} · {h.total_hours?.toLocaleString()} hrs total</div>
                    </div>
                    {h.summary && (
                      <span className="text-xs font-mono flex-shrink-0" style={{ color: COMPLIANCE_COLOR(h.summary.avg_compliance_pct) }}>
                        {h.summary.avg_compliance_pct}% avg
                      </span>
                    )}
                    <Eye size={12} className="text-slate-600" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════
          STEP 2 — CONFIGURE
      ═══════════════════════════════════════════════════════ */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Work Order Upload */}
            <div className="card">
              <h2 className="font-display font-700 text-white text-lg mb-1 flex items-center gap-2">
                <FileText size={16} className="text-cyan-400" /> Work Order File
              </h2>
              <p className="text-slate-500 text-xs mb-4">SAP export or Excel with Description, Actual start, Cost columns</p>
              <DropZone
                label="Drop Work Order Excel here"
                accept=".xlsx,.xls,.csv"
                file={woFile}
                onFile={setWoFile}
                icon={FileText}
                hint="SAP export — Description, Actual start, Cost"
                color="#00d4ff"
              />
            </div>

            {/* Date + Hours + Stages Config */}
            <div className="card space-y-4">
              <h2 className="font-display font-700 text-white text-lg flex items-center gap-2">
                <Settings size={16} className="text-yellow-400" /> Operating Parameters
              </h2>

              {/* Start Date — optional */}
              <div>
                <label className="label">
                  Compressor Start / Commissioning Date
                  <span className="text-slate-600 font-body font-400 ml-1">(optional)</span>
                </label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="date" className="input-field pl-10 text-sm"
                    value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Leave blank → auto-detected as earliest date in your WO file
                </p>
              </div>

              {/* ✅ NEW: Stages input */}
              <div>
                <label className="label">Number of Compression Stages</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setStages(s => Math.max(1, s - 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Minus size={14} className="text-slate-400" />
                  </button>
                  <span className="font-display font-700 text-white text-lg w-8 text-center">{stages}</span>
                  <button onClick={() => setStages(s => Math.min(4, s + 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Plus size={14} className="text-slate-400" />
                  </button>
                  <span className="text-slate-500 text-sm">compression stages</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Most industrial Rotary Screw Compressors = 2 stages
                </p>
              </div>

              {/* Number of Years */}
              <div>
                <label className="label">Number of Operating Years</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleNumYears(numYears - 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Minus size={14} className="text-slate-400" />
                  </button>
                  <span className="font-display font-700 text-white text-lg w-8 text-center">{numYears}</span>
                  <button onClick={() => handleNumYears(numYears + 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Plus size={14} className="text-slate-400" />
                  </button>
                  <span className="text-slate-500 text-sm">years of operation</span>
                </div>
              </div>

              {/* Per-year hours */}
              {/* ✅ "Operating days per year" REMOVED — only Annual Running Hours */}
              <div>
                <label className="label">Annual Running Hours per Year</label>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {yearlyHours.map((hrs, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 font-mono w-14 flex-shrink-0">Year {i + 1}</span>
                      <input type="number" min="1" max="8760" className="input-field flex-1 text-sm py-2"
                        value={hrs}
                        onChange={e => {
                          const v = parseInt(e.target.value) || 0
                          setYearlyHours(prev => prev.map((h, j) => j === i ? v : h))
                        }} />
                      <span className="text-xs text-slate-600 w-6">hrs</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono">Total:</span>
                  <span className="text-xs font-mono text-cyan-400">{yearlyHours.reduce((a, b) => a + (b || 0), 0).toLocaleString()} hrs</span>
                </div>
                <button className="mt-2 text-xs text-slate-500 hover:text-yellow-400 transition-colors font-mono underline"
                  onClick={() => {
                    const first = yearlyHours[0] || 1866
                    setYearlyHours(yearlyHours.map(() => first))
                  }}>
                  Same for all years
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-ghost py-3 px-6 text-sm">← Back</button>
            <button onClick={handleAnalyze} disabled={loading || !woFile}
              className="flex-1 btn-primary py-3 font-display font-700 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading
                ? <><div className="w-5 h-5 spinner" style={{ borderTopColor: '#080e1a', borderColor: 'rgba(8,14,26,0.3)' }} /><span>Running Analysis…</span></>
                : <><Activity size={16} /> Run PM Compliance Analysis</>
              }
            </button>
          </div>

          {/* Info box */}
          <div className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)' }}>
            <Info size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 leading-relaxed space-y-1">
              <p><span className="text-cyan-400 font-600">Running hours:</span> Each WO date is converted to operating hours using your yearly hours list, distributed uniformly across each year from the start date.</p>
              <p><span className="text-yellow-400 font-600">NLP matching:</span> TF-IDF cosine similarity (threshold 0.45) + keyword overlap (0.5) + action-type agreement automatically matches work orders to PM tasks.</p>
              <p><span className="text-green-400 font-600">Deduplication:</span> Multiple SAP work orders on the same day for the same task are counted as one physical maintenance event.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════
          STEP 3 — RESULTS
      ═══════════════════════════════════════════════════════ */}
      {step === 3 && results && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* ── Summary KPIs ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <KpiCard label="Avg Compliance"   value={`${s.avg_compliance_pct}%`}     color={COMPLIANCE_COLOR(s.avg_compliance_pct)} icon={Gauge} />
            <KpiCard label="Total Hours"      value={s.total_hours_analyzed?.toLocaleString()} sub="hrs analyzed" color="#00d4ff" icon={Clock} />
            <KpiCard label="Tasks Analyzed"   value={s.total_tasks}                   color="#facc15"  icon={CheckCircle} />
            <KpiCard label="Overdue Tasks"    value={s.overdue_count}                 color={s.overdue_count > 0 ? '#ef4444' : '#00c853'} icon={XCircle} />
            <KpiCard label="Due Soon"         value={s.due_soon_count}                color="#facc15"  icon={AlertTriangle} />
            <KpiCard label="Over-maintained"  value={s.over_maint_count}              color="#00d4ff"  icon={TrendingDown} />
          </div>

          {/* ── Over-maintenance Cost Alert ── */}
          {s.over_maint_cost > 0 && (
            <div className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
              <div>
                <span className="text-red-400 font-display font-700">Over-maintenance Cost: </span>
                <span className="text-white font-mono">PKR {s.over_maint_cost?.toLocaleString()}</span>
                <span className="text-slate-500 text-sm ml-2">— cost incurred from performing maintenance more frequently than required</span>
              </div>
            </div>
          )}

          {/* ── Charts Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Chart 1: Planned vs Actual Interval */}
            <div className="card">
              <h3 className="font-display font-700 text-white mb-4 flex items-center gap-2">
                <BarChart3 size={15} className="text-cyan-400" /> Planned vs Actual Interval (hrs)
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 9 }} width={130} />
                  <Tooltip
                    contentStyle={{ background: '#0d1a2e', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v, n) => [v.toLocaleString() + ' hrs', n]}
                  />
                  <Legend iconType="square" />
                  <Bar dataKey="expected" name="Target Interval" fill="#334155" radius={[0, 2, 2, 0]} />
                  <Bar dataKey="actual"   name="Avg Actual Interval" fill="#00d4ff" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 2: Compliance % */}
            <div className="card">
              <h3 className="font-display font-700 text-white mb-4 flex items-center gap-2">
                <CheckCircle size={15} className="text-green-400" /> Compliance %
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" horizontal={false} />
                  <XAxis type="number" domain={[0, 150]} stroke="#64748b" tick={{ fontSize: 10 }} unit="%" />
                  <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 9 }} width={130} />
                  <Tooltip contentStyle={{ background: '#0d1a2e', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '8px', fontSize: '12px' }}
                    formatter={v => [v + '%', 'Compliance']} />
                  <ReferenceLine x={100} stroke="#00c853" strokeDasharray="4 2" label={{ value: '100%', fill: '#00c853', fontSize: 10 }} />
                  <Bar dataKey="compliance" name="Compliance" radius={[0, 2, 2, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={COMPLIANCE_COLOR(entry.compliance)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Compliance Table ── */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <h3 className="font-display font-700 text-white flex items-center gap-2">
                <Wrench size={15} className="text-yellow-400" /> Detailed PM Task Analysis
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <span>{results.matched_rows} WO rows matched</span>
                <span>·</span>
                <span>{results.wo_rows} total WO rows</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: '900px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {[
                      'PM Task',
                      'Compliance',
                      'Expected',
                      'Actual',
                      'Raw WOs',
                      'Interval Ratio',
                      'Recency Status',   // ✅ CHANGED from "Status"
                      'Delay',
                      'Total Cost',       // ✅ CHANGED from "Cost"
                      '',
                    ].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-mono text-slate-500 font-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.results?.map((row, i) => (
                    <ComplianceRow key={i} row={row} i={i} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Meta info ── */}
          <div className="rounded-xl p-4 flex flex-wrap gap-6 text-xs font-mono"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-slate-500">Unit: <span className="text-slate-300">{results.unit_label}</span></span>
            <span className="text-slate-500">Start date: <span className="text-slate-300">{results.start_date}</span></span>
            <span className="text-slate-500">Total hrs: <span className="text-cyan-400">{results.total_hours?.toLocaleString()}</span></span>
            <span className="text-slate-500">Stages: <span className="text-yellow-400">{stages}</span></span>
            <span className="text-slate-500">WO file: <span className="text-slate-300">{results.wo_filename}</span></span>
            {results.analysis_id && (
              <span className="text-slate-500">Analysis ID: <span className="text-slate-600">{results.analysis_id?.slice(0,8)}…</span></span>
            )}
          </div>

          {/* ── New Analysis ── */}
          <button onClick={() => { setStep(1); setResults(null); setWoFile(null) }}
            className="flex items-center gap-2 btn-ghost py-2.5 text-sm">
            <RefreshCw size={14} /> Run New Analysis
          </button>
        </motion.div>
      )}
    </div>
  )
}