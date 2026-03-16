import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, CheckCircle, Zap, Upload, Settings, BarChart3, FileText, Cpu } from 'lucide-react'

const steps = [
  {
    icon: Cpu,
    title: 'What is CompressorAI?',
    color: '#00d4ff',
    content: `CompressorAI is an AI-powered optimization platform for Industrial Air Compressors. 
    It uses a 3-step ML pipeline to find the perfect operating parameters that give you maximum 
    mechanical power output at minimum electrical power consumption.`,
    highlight: '→ Goal: Max Mechanical Power at Min Electrical Cost',
    visual: (
      <div className="bg-primary-800/50 rounded-xl p-6 font-mono text-sm space-y-3">
        <div className="flex items-center gap-3 text-yellow-400">⚡ Electrical Power (INPUT)</div>
        <div className="text-center text-slate-500">↓</div>
        <div className="flex items-center gap-3 text-cyan-400">⚙️ Compressor (Machine)</div>
        <div className="text-center text-slate-500">↓</div>
        <div className="flex items-center gap-3 text-green-400">🔧 Mechanical Power (OUTPUT)</div>
        <div className="mt-4 text-xs text-slate-400">
          P_elec = (√3 × V × I × cosφ) / 1000 [kW]<br/>
          P_mech = (n/n-1) × (Q/60) × P1 × ... [kW]
        </div>
      </div>
    )
  },
  {
    icon: Upload,
    title: 'Step 1: Prepare Your Dataset',
    color: '#3b82f6',
    content: 'Upload your compressor data in Excel (.xlsx) or CSV format. Your file MUST contain these columns:',
    highlight: '→ Tip: Column names must match exactly!',
    visual: (
      <div className="space-y-2">
        {['Loading Pressure (bar)','Unloading Pressure (bar)','Inlet Pressure (bar)',
          'Discharge Pressure (bar)','Current (Amp)'].map((col, i) => (
          <div key={col} className="flex items-center gap-3 bg-primary-800/50 rounded-lg px-4 py-2.5">
            <span className="w-5 h-5 rounded-full bg-cyan-400/20 text-cyan-400 text-xs flex items-center justify-center font-mono">{i+1}</span>
            <span className="font-mono text-sm text-slate-300">{col}</span>
            <CheckCircle size={14} className="ml-auto text-green-400"/>
          </div>
        ))}
        <div className="text-xs text-slate-500 mt-2 px-2">
          Optional (will be computed if missing): Discharge Temperature, Electrical Power, Mechanical Power
        </div>
      </div>
    )
  },
  {
    icon: Settings,
    title: 'Step 2: Set Parameters',
    color: '#00c853',
    content: 'Before running analysis, set your operating parameters. These define the physical constants of your installation.',
    highlight: '→ Default values work for most Ingersoll Rand setups',
    visual: (
      <div className="space-y-3 font-mono text-sm">
        {/* Reference label */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-1"
          style={{ background:'rgba(250,204,21,0.08)', border:'1px solid rgba(250,204,21,0.2)' }}>
          <span className="text-yellow-400 text-xs">📌</span>
          <span className="text-yellow-400 text-xs font-600">
            Example values shown below are for Ingersoll Rand Siera SH-250.
            Change them according to your compressor's nameplate / datasheet.
          </span>
        </div>
        {[
          ['Voltage (V)', '415V', '3-Phase inline voltage'],
          ['Power Factor', '0.9', 'cosφ — usually 0.85–1.0'],
          ['Stages (z)', '2', 'Number of compression stages'],
          ['P Low (bar)', '7', 'Lowest operating pressure'],
          ['P High (bar)', '10', 'Highest operating pressure'],
          ['Q Low (m³/min)', '45.23', 'Flow at P_low'],
          ['Q High (m³/min)', '35.47', 'Flow at P_high'],
        ].map(([param, def, desc]) => (
          <div key={param} className="flex items-center gap-3 bg-primary-800/50 rounded-lg px-3 py-2">
            <span className="text-cyan-400 w-28 flex-shrink-0">{param}</span>
            <span className="text-yellow-400 w-16 flex-shrink-0">{def}</span>
            <span className="text-slate-400 text-xs">{desc}</span>
          </div>
        ))}
      </div>
    )
  },
  {
    icon: Zap,
    title: 'Step 3: The AI Pipeline',
    color: '#f59e0b',
    content: 'CompressorAI runs a 3-stage machine learning pipeline automatically. Here\'s what happens inside:',
    highlight: '→ Total time: ~1-3 minutes depending on dataset size',
    visual: (
      <div className="space-y-4">
        {[
          { step:'1', name:'DBSCAN Clustering', desc:'Groups similar operating points. Removes noise/outliers. Scored by Silhouette Score.', color:'#00d4ff' },
          { step:'2', name:'Gradient Boosting (GBR)', desc:'Trains on clean clusters. Learns electrical power vs all parameters. Scored by R² and F1.', color:'#3b82f6' },
          { step:'3', name:'Genetic Algorithm', desc:'Searches parameter space. Finds global minimum electrical power. Scored by Convergence.', color:'#00c853' },
        ].map(({step,name,desc,color}) => (
          <div key={step} className="flex gap-4 bg-primary-800/50 rounded-xl p-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-display font-800 text-sm"
              style={{background:`${color}20`, color, border:`1px solid ${color}40`}}>{step}</div>
            <div>
              <div className="font-display font-600 text-white text-sm">{name}</div>
              <div className="text-xs text-slate-400 mt-1">{desc}</div>
            </div>
          </div>
        ))}
      </div>
    )
  },
  {
    icon: BarChart3,
    title: 'Step 4: Read Your Results',
    color: '#a855f7',
    content: 'After analysis, you get comprehensive results with 6+ interactive charts and optimal parameters.',
    highlight: '→ Focus on the "Optimal Parameters" section for actionable insights!',
    visual: (
      <div className="space-y-3">
        {[
          ['🎯 Optimal Parameters', 'Exact values to set on your compressor for best efficiency'],
          ['📊 Power Saving Bar', 'Baseline vs Optimized electrical consumption'],
          ['📈 Training Convergence', 'Model learning curve — validates accuracy'],
          ['🔵 Scatter Plots', 'Power relationship and DBSCAN cluster visualization'],
          ['📉 Histograms', 'Distribution of electrical and mechanical power'],
          ['⭕ Score Gauges', 'DBSCAN, R², F1, Convergence — model quality indicators'],
        ].map(([title, desc]) => (
          <div key={title} className="flex gap-3 bg-primary-800/50 rounded-lg px-3 py-2.5">
            <span className="text-sm">{title.split(' ')[0]}</span>
            <div>
              <div className="text-xs text-white font-display">{title.split(' ').slice(1).join(' ')}</div>
              <div className="text-xs text-slate-500">{desc}</div>
            </div>
          </div>
        ))}
      </div>
    )
  },
  {
    icon: FileText,
    title: 'Step 5: Export Reports',
    color: '#ec4899',
    content: 'Download professional reports for your engineering team or management in two formats:',
    highlight: '→ PDF reports include your company branding!',
    visual: (
      <div className="grid grid-cols-2 gap-4">
        <div className="card border border-cyan-400/20 text-center py-6">
          <div className="text-4xl mb-3">📄</div>
          <div className="font-display font-700 text-white">PDF Report</div>
          <div className="text-xs text-slate-400 mt-2">Full analysis report with scores, charts, optimal params, recommendations</div>
          <div className="mt-3 text-xs text-cyan-400 font-mono">Professional A4 format</div>
        </div>
        <div className="card border border-green-400/20 text-center py-6">
          <div className="text-4xl mb-3">📊</div>
          <div className="font-display font-700 text-white">Excel Report</div>
          <div className="text-xs text-slate-400 mt-2">Summary, optimal parameters, feature importance in multiple sheets</div>
          <div className="mt-3 text-xs text-green-400 font-mono">3 worksheets</div>
        </div>
      </div>
    )
  }
]

export default function Tutorial() {
  const [current, setCurrent] = useState(0)
  const navigate = useNavigate()
  const step = steps[current]
  const Icon = step.icon

  return (
    <div className="min-h-screen bg-[#0a1628] bg-grid">
      {/* Nav */}
      <div className="glass-dark border-b border-cyan-400/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="text-cyan-400 w-5 h-5"/>
          <span className="font-display font-700 text-white">CompressorAI Tutorial</span>
        </div>
        <button onClick={() => navigate('/dashboard')}
          className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
          Skip → Dashboard
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {steps.map((_,i) => (
            <div key={i} className="flex items-center gap-2">
              <button onClick={() => setCurrent(i)}
                className={`w-8 h-8 rounded-full border font-display font-700 text-xs transition-all ${
                  i === current ? 'border-cyan-400 bg-cyan-400/15 text-cyan-400' :
                  i < current ? 'border-green-400 bg-green-400/15 text-green-400' :
                  'border-white/10 text-slate-600'}`}>
                {i < current ? '✓' : i+1}
              </button>
              {i < steps.length-1 && <div className={`h-px w-8 ${i < current ? 'bg-green-400/40' : 'bg-white/10'}`}/>}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: content */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{background:`${step.color}15`, border:`1px solid ${step.color}30`}}>
                  <Icon size={22} style={{color:step.color}}/>
                </div>
                <div className="text-xs font-mono text-slate-500">Step {current+1} of {steps.length}</div>
              </div>
              <h1 className="font-display text-3xl font-800 text-white mb-4">{step.title}</h1>
              <p className="text-slate-400 leading-relaxed font-body mb-6">{step.content}</p>
              <div className="bg-primary-800/50 border-l-2 rounded-r-xl px-4 py-3 text-sm font-mono"
                style={{borderColor:step.color, color:step.color}}>
                {step.highlight}
              </div>
            </div>

            {/* Right: visual */}
            <div className="card">
              {step.visual}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12">
          <button onClick={() => current > 0 && setCurrent(c => c-1)}
            disabled={current === 0}
            className="flex items-center gap-2 btn-ghost text-sm py-2.5 px-5 disabled:opacity-30">
            <ChevronLeft size={16}/> Previous
          </button>

          <div className="text-xs text-slate-500 font-mono">{current+1} / {steps.length}</div>

          {current < steps.length-1 ? (
            <button onClick={() => setCurrent(c => c+1)}
              className="flex items-center gap-2 bg-cyan-400 text-primary-900 font-display font-700 px-5 py-2.5 rounded-xl hover:bg-cyan-300 transition-all text-sm">
              Next <ChevronRight size={16}/>
            </button>
          ) : (
            <button onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 bg-green-400 text-primary-900 font-display font-700 px-5 py-2.5 rounded-xl hover:bg-green-300 transition-all text-sm">
              <CheckCircle size={16}/> Start Optimizing!
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
