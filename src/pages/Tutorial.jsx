import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight, ChevronLeft, CheckCircle, Zap, Upload, Settings,
  BarChart3, FileText, Cpu, Wrench, FileSpreadsheet, Activity,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────
//  SECTION A — Operational Optimization (engine.py based)
// ─────────────────────────────────────────────────────────────────
const optimizationSteps = [
  {
    icon: Cpu,
    title: 'What is CompressorAI?',
    color: '#00d4ff',
    content: `CompressorAI is an AI-powered optimization platform for Industrial Rotary Screw Air Compressors.
It uses a 3-step ML pipeline to find the perfect operating parameters that give you maximum
mechanical power output at minimum electrical power consumption.`,
    highlight: '→ Goal: Max Mechanical Power at Min Electrical Cost',
    visual: (
      <div className="bg-primary-800/50 rounded-xl p-6 font-mono text-sm space-y-3">
        <div className="flex items-center gap-3 text-yellow-400">⚡ Electrical Power (INPUT)</div>
        <div className="text-center text-slate-500">↓</div>
        <div className="flex items-center gap-3 text-cyan-400">⚙️ Rotary Screw Compressor</div>
        <div className="text-center text-slate-500">↓</div>
        <div className="flex items-center gap-3 text-green-400">🔧 Mechanical Power (OUTPUT)</div>
        <div className="mt-4 rounded-lg px-3 py-3 space-y-1.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-xs text-slate-400 font-600 mb-1 text-yellow-400/80">Formulas used:</div>
          <div className="text-xs text-slate-400">P_elec = (√3 × V × I × cosφ) / 1000 <span className="text-slate-600">[kW]</span></div>
          <div className="text-xs text-slate-400">P_mech = (n/n-1) × (Q/60) × P₁ × [(P₂/P₁)^((n-1)/nz) − 1] × z <span className="text-slate-600">[kW]</span></div>
          <div className="text-xs text-slate-400">SPC = P_elec / Q <span className="text-slate-600">[kW/m³/min]</span></div>
        </div>
      </div>
    ),
  },
  {
    icon: Upload,
    title: 'Step 1: Prepare Your Dataset',
    color: '#3b82f6',
    content: 'Upload your compressor data in Excel (.xlsx) or CSV format. Your file MUST contain these columns — names must match exactly:',
    highlight: '→ Optional columns are auto-computed if missing using your operating parameters',
    visual: (
      <div className="space-y-2">
        {[
          ['Loading Pressure (bar)',    'Required', true ],
          ['Unloading Pressure (bar)',  'Required', true ],
          ['Inlet Pressure (bar)',      'Required', true ],
          ['Discharge Pressure (bar)',  'Required', true ],
          ['Current (Amp)',             'Required', true ],
          ['Discharge Temperature (C)', 'Optional — defaults to 35 °C if missing', false],
          ['Theoretical Electrical Power (kW)', 'Optional — computed from Current', false],
          ['Theoretical Mechanical Power (kW)', 'Optional — computed from pressures', false],
        ].map(([col, desc, req]) => (
          <div key={col} className="flex items-center gap-3 rounded-lg px-3 py-2"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${req ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
            <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px]"
              style={{ background: req ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', color: req ? '#3b82f6' : '#475569' }}>
              {req ? '✓' : '?'}
            </span>
            <span className="font-mono text-xs text-slate-200 flex-1">{col}</span>
            <span className="text-slate-500 text-[10px] text-right">{desc}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Settings,
    title: 'Step 2: Set Operating Parameters',
    color: '#00c853',
    content: 'Before running analysis, set your compressor\'s physical constants. These are used to compute electrical and mechanical power accurately.',
    highlight: '→ Default values are for Ingersoll Rand Siera SH-250 — change them to match your nameplate',
    visual: (
      <div className="space-y-2 font-mono text-sm">
        <div className="rounded-lg px-3 py-2.5 mb-2"
          style={{ background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.2)' }}>
          <p className="text-yellow-400 text-xs font-600">📌 Example: Ingersoll Rand Siera SH-250</p>
          <p className="text-slate-400 text-xs mt-0.5">Change values to match your compressor's datasheet / nameplate</p>
        </div>
        {[
          ['Voltage (V)',        '415',    '3-Phase supply voltage'],
          ['Power Factor',       '0.9',    'cosφ — typically 0.85–1.0'],
          ['Stages (z)',         '2',      'Compression stages'],
          ['P Low (bar)',        '7',      'Lowest operating pressure'],
          ['P High (bar)',       '10',     'Highest operating pressure'],
          ['Q Low (m³/min)',     '45.23',  'Flow rate at P_low'],
          ['Q High (m³/min)',    '35.47',  'Flow rate at P_high'],
        ].map(([param, def, desc]) => (
          <div key={param} className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-cyan-400 w-32 flex-shrink-0 text-xs">{param}</span>
            <span className="text-yellow-400 w-14 flex-shrink-0 text-xs">{def}</span>
            <span className="text-slate-400 text-xs">{desc}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Zap,
    title: 'Step 3: The AI Pipeline',
    color: '#f59e0b',
    content: 'CompressorAI runs a 3-stage ML pipeline automatically. Here\'s exactly what happens inside each stage:',
    highlight: '→ Current (Amp) is intentionally excluded from model features — see why below',
    visual: (
      <div className="space-y-3">
        {[
          {
            step: '1',
            name: 'DBSCAN Clustering',
            desc: 'Groups similar operating points into clusters. Auto-tunes eps parameter via NearestNeighbors elbow method. Removes noise/outlier points. Score: Silhouette (0–100%).',
            color: '#00d4ff',
          },
          {
            step: '2',
            name: 'Gradient Boosting (GBR)',
            desc: 'Trains on clean clusters using PRESSURE + TEMPERATURE features only. Current (Amp) excluded — it\'s a deterministic function of P_elec, not a controllable parameter. Split: 70% train / 15% val / 15% test. Score: R² and Cross-Validated R².',
            color: '#3b82f6',
          },
          {
            step: '3',
            name: 'Genetic Algorithm (Differential Evolution)',
            desc: 'Searches the full parameter space to find the global minimum electrical power. Convergence tracked via successive-generation improvement (not nfev ratio). Power saving capped at 40% (physically realistic for IACs). Score: Convergence %.',
            color: '#00c853',
          },
        ].map(({ step, name, desc, color }) => (
          <div key={step} className="flex gap-3 rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}25` }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-display font-800 text-sm"
              style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
              {step}
            </div>
            <div>
              <div className="font-display font-600 text-white text-sm">{name}</div>
              <div className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</div>
            </div>
          </div>
        ))}
        <div className="rounded-lg px-3 py-2.5"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-red-400 text-xs font-600">⚠️ Why is Current excluded from GBR features?</p>
          <p className="text-slate-400 text-xs mt-1">P_elec = √3·V·I·cosφ is a deterministic formula. If Current is included, the model learns this formula perfectly (R²≈100%) but the Genetic Algorithm then minimises Current — which is a result of loading, NOT an adjustable set-point. Pressure + Temperature are the actual controllable parameters.</p>
        </div>
      </div>
    ),
  },
  {
    icon: BarChart3,
    title: 'Step 4: Read Your Results',
    color: '#a855f7',
    content: 'After analysis, you get comprehensive results with 6+ interactive charts and optimal parameters.',
    highlight: '→ Focus on the "Optimal Parameters" section for actionable set-points!',
    visual: (
      <div className="space-y-2.5">
        {[
          ['🎯', 'Optimal Parameters', 'Exact pressure & temperature values to set on your compressor for best efficiency'],
          ['📊', 'Power Saving Bar', 'Baseline vs Optimized electrical consumption — capped at 40% (physically realistic)'],
          ['📈', 'Training Convergence', '3-curve learning plot (train/val/test) — validates model accuracy'],
          ['🔵', 'Scatter Plots', 'Electrical vs Mechanical power with DBSCAN cluster colouring'],
          ['📉', 'Histograms', 'Distribution of electrical and mechanical power across your dataset'],
          ['⭕', 'Score Gauges', 'DBSCAN Silhouette, R², CV-R², F1, Convergence — 5 model quality indicators'],
        ].map(([emoji, title, desc]) => (
          <div key={title} className="flex gap-3 rounded-lg px-3 py-2.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-base flex-shrink-0">{emoji}</span>
            <div>
              <div className="text-xs text-white font-display font-600">{title}</div>
              <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: FileText,
    title: 'Step 5: Export Reports',
    color: '#ec4899',
    content: 'Download professional reports for your engineering team or management in two formats:',
    highlight: '→ PDF reports include your company branding and full model scores!',
    visual: (
      <div className="grid grid-cols-2 gap-4">
        <div className="card border border-cyan-400/20 text-center py-6">
          <div className="text-4xl mb-3">📄</div>
          <div className="font-display font-700 text-white">PDF Report</div>
          <div className="text-xs text-slate-400 mt-2">Full analysis with scores, charts, optimal params &amp; recommendations</div>
          <div className="mt-3 text-xs text-cyan-400 font-mono">Professional A4 format</div>
        </div>
        <div className="card border border-green-400/20 text-center py-6">
          <div className="text-4xl mb-3">📊</div>
          <div className="font-display font-700 text-white">Excel Report</div>
          <div className="text-xs text-slate-400 mt-2">Summary, optimal parameters, feature importance in multiple sheets</div>
          <div className="mt-3 text-xs text-green-400 font-mono">3 worksheets</div>
        </div>
      </div>
    ),
  },
]

// ─────────────────────────────────────────────────────────────────
//  SECTION B — Maintenance / PM Compliance (maintenance.py based)
// ─────────────────────────────────────────────────────────────────
const maintenanceSteps = [
  {
    icon: Wrench,
    title: 'What is PM Compliance Analysis?',
    color: '#facc15',
    content: 'PM (Preventive Maintenance) Compliance Analysis compares your actual maintenance work orders against a planned PM schedule. It tells you which tasks are overdue, which are being done too frequently, and gives you an overall compliance score.',
    highlight: '→ Goal: Ensure every PM task is done on time — not too early, not too late.',
    visual: (
      <div className="space-y-3 font-mono text-sm">
        {[
          { label: 'PM Plan',      desc: 'What SHOULD be done & when',   color: '#facc15' },
          { label: 'Work Orders',  desc: 'What WAS actually done',       color: '#00d4ff' },
          { label: 'CompressorAI', desc: 'Compares both & gives scores', color: '#00c853' },
        ].map(({ label, desc, color }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}25` }}>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
            <span style={{ color }} className="w-28 flex-shrink-0 font-600">{label}</span>
            <span className="text-slate-400 text-xs">{desc}</span>
          </div>
        ))}
        <div className="rounded-lg px-3 py-2.5 mt-1"
          style={{ background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(250,204,21,0.15)' }}>
          <p className="text-yellow-400 text-xs font-600 mb-1">📊 What you get</p>
          <div className="space-y-1">
            {['Overall Compliance % per task','Recency Status: OK / Due Soon / Overdue','Interval Status: On Track / Over-maintained / Under-maintained','Over-maintenance cost in PKR','Planned vs Actual interval bar charts'].map(item => (
              <div key={item} className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5 flex-shrink-0">·</span>
                <span className="text-slate-400 text-xs">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: FileSpreadsheet,
    title: 'Step 1: Prepare Your PM Plan Excel',
    color: '#facc15',
    content: 'Your PM Plan Excel file tells the system what maintenance tasks exist and how often they should be performed. The file must contain these columns in order:',
    highlight: '→ Column names must match exactly. Frequency format: "700 Hours", "2000 Hrs", "1000h"',
    visual: (
      <div className="space-y-2">
        {[
          ['Machine',          'Compressor unit name / tag',          true ],
          ['Task/Description', 'What maintenance work is done',       true ],
          ['Frequency',        '"700 Hours" / "2000 Hrs" / "1000h"',  true ],
          ['Cost (PKR)',        'Estimated cost per task execution',   false],
        ].map(([col, desc, req]) => (
          <div key={col} className="flex items-center gap-3 rounded-lg px-3 py-2.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${req ? 'rgba(250,204,21,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
            <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px]"
              style={{ background: req ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.05)', color: req ? '#facc15' : '#475569' }}>
              {req ? '✓' : '?'}
            </span>
            <span className="font-mono text-sm text-slate-200 w-36 flex-shrink-0">{col}</span>
            <span className="text-slate-500 text-xs flex-1">{desc}</span>
            {req && <span className="text-yellow-400/60 text-[10px] font-mono flex-shrink-0">required</span>}
          </div>
        ))}
        <div className="rounded-lg px-3 py-2.5 mt-1"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-slate-400 text-xs">Only tasks with hour-based frequency are processed. The system automatically ignores calendar-based entries.</p>
        </div>
      </div>
    ),
  },
  {
    icon: FileText,
    title: 'Step 2: Prepare Your Work Order (WO) File',
    color: '#00d4ff',
    content: 'Your Work Order file is a SAP export or similar Excel containing all maintenance events that were actually performed. Required columns:',
    highlight: '→ Export directly from SAP PM module as Excel (.xlsx)',
    visual: (
      <div className="space-y-2">
        {[
          ['Description',  'Matched to PM tasks via NLP auto-match',   true ],
          ['Actual Start', 'Date the maintenance work was performed',   true ],
          ['Cost',         'Actual cost in PKR (for cost analysis)',    false],
          ['Order No.',    'SAP work order number (for traceability)',  false],
        ].map(([col, desc, req]) => (
          <div key={col} className="flex items-center gap-3 rounded-lg px-3 py-2.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${req ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
            <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px]"
              style={{ background: req ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)', color: req ? '#00d4ff' : '#475569' }}>
              {req ? '✓' : '?'}
            </span>
            <span className="font-mono text-sm text-slate-200 w-36 flex-shrink-0">{col}</span>
            <span className="text-slate-500 text-xs flex-1">{desc}</span>
            {req && <span className="text-cyan-400/60 text-[10px] font-mono flex-shrink-0">required</span>}
          </div>
        ))}
        <div className="rounded-lg px-3 py-2.5 mt-1"
          style={{ background: 'rgba(0,200,83,0.05)', border: '1px solid rgba(0,200,83,0.15)' }}>
          <p className="text-green-400 text-xs font-600 mb-1">🤖 Auto NLP Matching</p>
          <p className="text-slate-400 text-xs">Uses TF-IDF cosine similarity + keyword overlap + action detection (replace / clean / inspect). Threshold: score &gt; 0.45, keyword ratio &gt; 0.5, matching action type. No manual mapping needed.</p>
        </div>
        <div className="rounded-lg px-3 py-2.5"
          style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}>
          <p className="text-cyan-400 text-xs font-600 mb-1">🔄 Deduplication</p>
          <p className="text-slate-400 text-xs">Same task + same date = 1 physical event (not multiple SAP WO rows). Costs are summed across all WOs for the same event.</p>
        </div>
      </div>
    ),
  },
  {
    icon: Settings,
    title: 'Step 3: Configure Operating Parameters',
    color: '#00c853',
    content: 'Set the compressor operating parameters so the system can convert maintenance dates into running hours accurately using your annual utilization data.',
    highlight: '→ Annual Running Hours: typical industrial compressor = 1500–2200 hrs/year',
    visual: (
      <div className="space-y-3 font-mono text-sm">
        <div className="rounded-xl p-3" style={{ background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.2)' }}>
          <p className="text-yellow-400 text-xs font-600 mb-2">📌 Parameters Explained</p>
          {[
            ['Commissioning Date', 'When compressor first started (leave blank → auto-detected from earliest WO date)'],
            ['Operating Years',    'How many years of WO data you have (1–20)'],
            ['Annual Hours (each year)', 'Running hours per year, entered as a list e.g. [1866, 1866, 1866]'],
            ['Compressor Stages', 'Number of compression stages (1 or 2)'],
          ].map(([p, d]) => (
            <div key={p} className="flex items-start gap-2 py-1.5 border-b last:border-0"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <span className="text-cyan-400 text-xs w-40 flex-shrink-0">{p}</span>
              <span className="text-slate-400 text-xs leading-relaxed">{d}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg px-3 py-2.5"
          style={{ background: 'rgba(0,200,83,0.05)', border: '1px solid rgba(0,200,83,0.15)' }}>
          <p className="text-green-400 text-xs font-600 mb-1">⏱️ How hours are calculated</p>
          <p className="text-slate-400 text-xs">Running_Hours = Σ (days_in_year × annual_rate_per_day) — calculated from commissioning date to each WO date. Validates that all hours &gt; 0; if not, a helpful error suggests leaving start_date blank for auto-detection.</p>
        </div>
      </div>
    ),
  },
  {
    icon: BarChart3,
    title: 'Step 4: Read Compliance Results',
    color: '#a855f7',
    content: 'After analysis you get a full compliance breakdown with KPIs, charts, and a detailed task table. Here\'s what each result means:',
    highlight: '→ Target: Compliance % = 100%. Below 70% = critical, 70–90% = needs attention.',
    visual: (
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Avg Compliance %',    'Overall score across all PM tasks', '#00c853'],
            ['Overdue Tasks',       'Tasks past their due running hours', '#ef4444'],
            ['Due Soon',            'Tasks within 10% of due interval',  '#facc15'],
            ['Over-maintained',     'Done more often than required',     '#00d4ff'],
          ].map(([title, desc, color]) => (
            <div key={title} className="rounded-lg p-3"
              style={{ background: `${color}08`, border: `1px solid ${color}25` }}>
              <div className="text-xs font-600" style={{ color }}>{title}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{desc}</div>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          {[
            ['📊', 'Planned vs Actual Interval Chart', 'Target vs average actual interval per task (bar chart)'],
            ['✅', 'Compliance % Chart', 'Per-task compliance with 100% reference line'],
            ['🔴', 'Recency Status', 'OK / Due Soon / Overdue — based on last performed hours'],
            ['🔵', 'Interval Ratio', 'On Track / Over-maintained / Under-maintained / Never Performed'],
            ['💰', 'Over-maintenance Cost', 'PKR wasted on tasks done more frequently than needed'],
          ].map(([emoji, title, desc]) => (
            <div key={title} className="flex gap-2 rounded-lg px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-sm flex-shrink-0">{emoji}</span>
              <div>
                <div className="text-xs text-white font-600">{title}</div>
                <div className="text-[10px] text-slate-500">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

// ─────────────────────────────────────────────────────────────────
//  TAB CONFIG
// ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'optimization', label: 'Operational Optimization', icon: Zap,   color: '#00d4ff', steps: optimizationSteps },
  { id: 'maintenance',  label: 'PM Compliance Analysis',   icon: Wrench, color: '#facc15', steps: maintenanceSteps  },
]

// ─────────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function Tutorial() {
  const [activeTab, setActiveTab] = useState('optimization')
  const [current,   setCurrent  ] = useState(0)
  const navigate = useNavigate()

  const tab   = TABS.find(t => t.id === activeTab)
  const steps = tab.steps
  const step  = steps[current]
  const Icon  = step.icon

  const switchTab = (id) => {
    setActiveTab(id)
    setCurrent(0)
  }

  return (
    <div className="min-h-screen bg-[#0a1628] bg-grid">

      {/* ── Nav ── */}
      <div className="glass-dark border-b border-cyan-400/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="text-cyan-400 w-5 h-5" />
          <span className="font-display font-700 text-white">CompressorAI Tutorial</span>
        </div>
        <button onClick={() => navigate('/dashboard')}
          className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
          Skip → Dashboard
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* ── Module Tabs ── */}
        <div className="flex gap-3 mb-8 p-1 rounded-2xl w-fit"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {TABS.map(t => {
            const TIcon = t.icon
            const active = activeTab === t.id
            return (
              <button key={t.id} onClick={() => switchTab(t.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-display font-700 transition-all"
                style={{
                  background: active ? `${t.color}15` : 'transparent',
                  border: active ? `1px solid ${t.color}40` : '1px solid transparent',
                  color: active ? t.color : '#64748b',
                }}>
                <TIcon size={14} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* ── Step Progress ── */}
        <div className="flex items-center gap-2 mb-10 flex-wrap">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <button onClick={() => setCurrent(i)}
                className="w-8 h-8 rounded-full border font-display font-700 text-xs transition-all"
                style={{
                  borderColor: i === current ? tab.color : i < current ? '#00c853' : 'rgba(255,255,255,0.1)',
                  background:  i === current ? `${tab.color}20` : i < current ? 'rgba(0,200,83,0.15)' : 'transparent',
                  color:       i === current ? tab.color : i < current ? '#00c853' : '#475569',
                }}>
                {i < current ? '✓' : i + 1}
              </button>
              {i < steps.length - 1 && (
                <div className="h-px w-6" style={{ background: i < current ? 'rgba(0,200,83,0.4)' : 'rgba(255,255,255,0.08)' }} />
              )}
            </div>
          ))}
        </div>

        {/* ── Step Content ── */}
        <AnimatePresence mode="wait">
          <motion.div key={`${activeTab}-${current}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Left: text */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${step.color}15`, border: `1px solid ${step.color}30` }}>
                  <Icon size={22} style={{ color: step.color }} />
                </div>
                <div className="text-xs font-mono text-slate-500">
                  Step {current + 1} of {steps.length}
                </div>
              </div>
              <h1 className="font-display text-3xl font-800 text-white mb-4">{step.title}</h1>
              <p className="text-slate-400 leading-relaxed font-body mb-6 whitespace-pre-line">{step.content}</p>
              <div className="rounded-r-xl px-4 py-3 text-sm font-mono border-l-2"
                style={{ borderColor: step.color, color: step.color, background: `${step.color}08` }}>
                {step.highlight}
              </div>
            </div>

            {/* Right: visual */}
            <div className="card overflow-y-auto max-h-[520px]">
              {step.visual}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Navigation ── */}
        <div className="flex items-center justify-between mt-12">
          <button onClick={() => current > 0 && setCurrent(c => c - 1)}
            disabled={current === 0}
            className="flex items-center gap-2 btn-ghost text-sm py-2.5 px-5 disabled:opacity-30">
            <ChevronLeft size={16} /> Previous
          </button>

          <div className="text-xs text-slate-500 font-mono">{current + 1} / {steps.length}</div>

          {current < steps.length - 1 ? (
            <button onClick={() => setCurrent(c => c + 1)}
              className="flex items-center gap-2 font-display font-700 px-5 py-2.5 rounded-xl transition-all text-sm text-primary-900"
              style={{ background: tab.color }}>
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 bg-green-400 text-primary-900 font-display font-700 px-5 py-2.5 rounded-xl hover:bg-green-300 transition-all text-sm">
              <CheckCircle size={16} /> Go to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  )
}