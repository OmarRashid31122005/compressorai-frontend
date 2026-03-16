import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Suspense, lazy, useRef, useEffect, useState } from 'react'
import { Zap, Shield, BarChart3, ChevronRight, Activity, Cpu, TrendingDown, ArrowRight, Star } from 'lucide-react'
import useAuthStore from '../store/authStore'

const CompressorScene = lazy(() => import('../components/ui/CompressorScene'))

const features = [
  { icon: Zap,         title: 'AI-Powered Optimization', desc: 'Genetic algorithms + Gradient Boosting pinpoint the exact operating point for maximum efficiency.', color: 'yellow' },
  { icon: BarChart3,   title: 'Real-Time Analytics',     desc: 'Interactive charts show power curves, clustering results, and efficiency trends live.',             color: 'cyan' },
  { icon: Shield,      title: 'Secure & Role-Based',     desc: 'Enterprise-grade auth with Admin and Engineer roles. JWT-secured, token-validated on every request.', color: 'white' },
  { icon: TrendingDown,title: 'Energy Savings',          desc: 'Identify 2–20% reduction in electrical power — actual saving depends on your compressor and dataset.', color: 'yellow' },
  { icon: Cpu,         title: 'Any Compressor',          desc: 'Generic model supports unlimited compressors — add as many as your facility needs.',                 color: 'cyan' },
  { icon: Activity,    title: 'Auto-Retraining',         desc: 'Model continuously improves over time as more operational data is collected.',                       color: 'white' },
]

const steps = [
  { step:'01', title:'Upload Dataset',  desc:'Upload your compressor Excel/CSV data. Our system validates columns and guides you through any issues.',                                                              color:'yellow' },
  { step:'02', title:'AI Analyzes',     desc:'DBSCAN clusters your data, Gradient Boosting trains on clean clusters, Genetic Algorithm finds global optimum.',                                                      color:'cyan'   },
  { step:'03', title:'Get Results',     desc:'View optimal parameter ranges, interactive charts, model scores, and download professional reports.',                                                                 color:'white'  },
]

function AnimatedCounter({ end, suffix = '', duration = 2 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const [started, setStarted] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) setStarted(true) })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [started])
  useEffect(() => {
    if (!started) return
    const isFloat = String(end).includes('.')
    let startTime = null
    const animate = (ts) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const val = eased * end
      setCount(isFloat ? parseFloat(val.toFixed(1)) : Math.floor(val))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [started, end, duration])
  return <span ref={ref}>{count}{suffix}</span>
}

export default function Landing() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY       = useTransform(scrollYProgress, [0, 1], [0, -80])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  const handleStart = () => navigate(isAuthenticated ? '/dashboard' : '/register')

  return (
    <div className="min-h-screen bg-[#080e1a] text-white overflow-x-hidden">
      <div className="scanline" />

      {/* ── NAV ── */}
      <nav className="fixed top-0 w-full z-50 glass-dark border-b border-cyan-400/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl border border-yellow-400/40 bg-yellow-400/10 flex items-center justify-center animate-glow-yellow">
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <span className="font-display font-800 text-white text-lg">CompressorAI</span>
              <div className="text-yellow-400/60 text-[9px] font-mono -mt-0.5 tracking-widest">INDUSTRIAL OPTIMIZER</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/tutorial')}
              className="text-slate-400 hover:text-white transition-colors text-sm font-display px-4 py-2 hover:bg-white/5 rounded-lg">
              Tutorial
            </button>
            <button onClick={() => navigate('/login')} className="btn-ghost text-sm py-2 px-4">Login</button>
            <button onClick={() => navigate('/register')} className="btn-primary text-sm py-2 px-5">Get Started</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-20">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute top-1/4 left-1/6 w-[500px] h-[500px] bg-yellow-400/4 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/6 w-[400px] h-[400px] bg-cyan-400/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/3 rounded-full blur-[120px] pointer-events-none" />

        <motion.div style={{ y: heroY, opacity: heroOpacity, pointerEvents: 'auto' }}
          className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">

          {/* Left text */}
          <motion.div initial={{ opacity:0, x:-50 }} animate={{ opacity:1, x:0 }}
            transition={{ duration:0.9, ease:[0.22,1,0.36,1] }}>

            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 mt-4"
              style={{ border:'1px solid rgba(250,204,21,0.3)', background:'rgba(250,204,21,0.06)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-yellow-400 text-xs font-mono tracking-wide">AI-Powered Industrial Solution</span>
            </motion.div>

            <h1 className="font-display font-900 leading-[1.05] mb-5">
              <motion.span initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
                className="block text-white text-5xl lg:text-6xl">Industrial</motion.span>
              <motion.span initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
                className="block gradient-text-yellow text-5xl lg:text-7xl neon-yellow">Air Compressor</motion.span>
              <motion.span initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
                className="block text-white text-5xl lg:text-6xl">Optimizer</motion.span>
            </h1>

            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.6 }}
              className="text-slate-400 text-base leading-relaxed mb-7 max-w-xl">
              Upload your compressor dataset and let our AI pipeline —
              <span className="text-cyan-400"> DBSCAN clustering</span>,
              <span className="text-yellow-400"> Gradient Boosting</span>, and
              <span className="text-white"> Genetic Algorithms</span> — find the
              <strong className="text-yellow-400"> optimal operating parameters</strong> for maximum mechanical power at minimum electrical cost.
            </motion.p>

            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.7 }}
              className="flex flex-wrap gap-4 mb-10 relative" style={{ zIndex: 10 }}>
              <motion.button whileHover={{ scale:1.03, y:-2 }} whileTap={{ scale:0.97 }}
                onClick={handleStart}
                className="btn-primary flex items-center gap-2 text-base px-8 py-4">
                Start Optimizing <ChevronRight size={18} />
              </motion.button>
              <motion.button whileHover={{ scale:1.03, y:-2 }} whileTap={{ scale:0.97 }}
                onClick={() => navigate('/tutorial')}
                className="btn-ghost-yellow flex items-center gap-2 text-base px-8 py-4">
                Watch Tutorial <ArrowRight size={16} />
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.9 }}
              className="grid grid-cols-4 gap-4 pt-5 border-t border-white/5">
              {[
                { val:'95%+',   label:'Model Accuracy'  },
                { val:'2–20%+',  label:'Energy Saving'   },
                { val:'3-Step', label:'ML Pipeline'     },
                { val:'∞',      label:'Compressors'     },
              ].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <div className="font-display font-900 text-xl text-yellow-400 neon-yellow">
                    {val}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: 3D Model — BIG SQUARE */}
          <motion.div
            initial={{ opacity:0, scale:0.85, x:40 }}
            animate={{ opacity:1, scale:1, x:0 }}
            transition={{ duration:1.2, ease:[0.22,1,0.36,1], delay:0.2 }}
            className="relative flex items-center justify-center"
          >
            {/* Outer glow rings */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              <div className="absolute inset-0 rounded-2xl"
                style={{background:'radial-gradient(ellipse at center, rgba(0,212,255,0.07) 0%, transparent 70%)'}} />
              <div className="absolute inset-0 rounded-2xl animate-pulse"
                style={{background:'radial-gradient(ellipse at 40% 60%, rgba(250,204,21,0.05) 0%, transparent 60%)', animationDuration:'3s'}} />
            </div>

            {/* 3D Canvas Container — contained square */}
            <div className="relative w-full rounded-2xl overflow-hidden"
              style={{
                aspectRatio: '1 / 1',
                height: '520px',
                maxHeight: '520px',
                background: 'radial-gradient(ellipse at center, rgba(8,20,40,0.6) 0%, rgba(4,10,20,0.95) 100%)',
                border: '1px solid rgba(0,212,255,0.1)',
                boxShadow: '0 0 60px rgba(0,212,255,0.06), 0 0 120px rgba(250,204,21,0.04), inset 0 0 40px rgba(0,0,0,0.4)'
              }}>
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="spinner w-14 h-14 mx-auto mb-4" />
                    <p className="text-slate-400 text-sm font-mono tracking-widest">LOADING 3D MODEL...</p>
                  </div>
                </div>
              }>
                <div style={{ width:'100%', height:'100%', position:'absolute', inset:0, zIndex:0 }}>
                  <CompressorScene height="520px" />
                </div>
              </Suspense>

              {/* Corner decorations */}
              <div className="absolute top-3 left-3 w-5 h-5 pointer-events-none"
                style={{borderTop:'1px solid rgba(250,204,21,0.4)', borderLeft:'1px solid rgba(250,204,21,0.4)'}} />
              <div className="absolute top-3 right-3 w-5 h-5 pointer-events-none"
                style={{borderTop:'1px solid rgba(250,204,21,0.4)', borderRight:'1px solid rgba(250,204,21,0.4)'}} />
              <div className="absolute bottom-3 left-3 w-5 h-5 pointer-events-none"
                style={{borderBottom:'1px solid rgba(250,204,21,0.4)', borderLeft:'1px solid rgba(250,204,21,0.4)'}} />
              <div className="absolute bottom-3 right-3 w-5 h-5 pointer-events-none"
                style={{borderBottom:'1px solid rgba(250,204,21,0.4)', borderRight:'1px solid rgba(250,204,21,0.4)'}} />


            </div>
          </motion.div>

        </motion.div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-xs text-slate-600 font-mono">Scroll to explore</span>
          <motion.div animate={{ y:[0,6,0] }} transition={{ repeat:Infinity, duration:1.5 }}
            className="w-4 h-4 border-b-2 border-r-2 border-slate-600 rotate-45" />
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-28 relative">
        <div className="absolute inset-0 bg-grid-yellow opacity-30" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <motion.div className="text-center mb-16"
            initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
              style={{ border:'1px solid rgba(250,204,21,0.25)', background:'rgba(250,204,21,0.05)' }}>
              <Star className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-yellow-400 text-xs font-mono">CAPABILITIES</span>
            </div>
            <h2 className="font-display text-4xl lg:text-5xl font-800 text-white mb-4">
              World-Class <span className="gradient-text-yellow">Features</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Everything your engineering team needs to optimize compressor performance and cut energy costs.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div key={title}
                initial={{ opacity:0, y:40 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }} transition={{ delay: i*0.08 }}
                whileHover={{ y:-6, scale:1.01 }}
                className={`card card-hover cursor-default`}
                style={{ border: color==='yellow' ? '1px solid rgba(250,204,21,0.15)' :
                  color==='cyan' ? '1px solid rgba(0,212,255,0.15)' : '1px solid rgba(255,255,255,0.08)' }}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  color==='yellow' ? 'bg-yellow-400/10 border border-yellow-400/20' :
                  color==='cyan'   ? 'bg-cyan-400/10 border border-cyan-400/20'     :
                  'bg-white/5 border border-white/10'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    color==='yellow' ? 'text-yellow-400' : color==='cyan' ? 'text-cyan-400' : 'text-white'
                  }`} />
                </div>
                <h3 className={`font-display font-700 text-lg mb-2 ${
                  color==='yellow' ? 'text-yellow-400' : color==='cyan' ? 'text-cyan-400' : 'text-white'
                }`}>{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-28 border-t border-white/5 relative overflow-hidden">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-yellow-400/20 to-transparent" />
        <div className="max-w-5xl mx-auto px-6">
          <motion.div className="text-center mb-16"
            initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
            <h2 className="font-display text-4xl lg:text-5xl font-800 text-white mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map(({ step, title, desc, color }, i) => (
              <motion.div key={step}
                initial={{ opacity:0, y:40 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }} transition={{ delay:i*0.15 }}
                className="relative text-center">
                <div className={`text-8xl font-display font-900 mb-3 ${
                  color==='yellow' ? 'text-yellow-400/15' : color==='cyan' ? 'text-cyan-400/15' : 'text-white/10'
                }`}>{step}</div>
                <div className={`w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center text-lg font-display font-800 ${
                  color==='yellow' ? 'bg-yellow-400/15 border border-yellow-400/30 text-yellow-400' :
                  color==='cyan'   ? 'bg-cyan-400/15 border border-cyan-400/30 text-cyan-400'       :
                  'bg-white/5 border border-white/15 text-white'
                }`}>{i+1}</div>
                <h3 className="font-display font-700 text-white text-xl mb-3">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-16 right-0 translate-x-1/2 text-slate-700">
                    <ArrowRight size={20} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity:0, scale:0.9 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }}>
            <div className="relative rounded-3xl p-[1px] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 via-cyan-400/30 to-yellow-400/30 blur-sm" />
              <div className="relative rounded-3xl p-12" style={{ background:'rgba(8,14,26,0.95)' }}>
                <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center mx-auto mb-6 animate-glow-yellow">
                  <Zap className="w-8 h-8 text-yellow-400" />
                </div>
                <h2 className="font-display text-4xl font-800 text-white mb-4">
                  Ready to <span className="gradient-text-yellow">Optimize?</span>
                </h2>
                <p className="text-slate-400 mb-8 text-lg">
                  Join your team and start reducing energy costs with industrial-grade AI optimization.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                    onClick={handleStart}
                    className="btn-primary flex items-center gap-2 text-base px-10 py-4">
                    {isAuthenticated ? 'Go to Dashboard' : 'Create Free Account'} <ChevronRight size={18} />
                  </motion.button>
                  <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                    onClick={() => navigate('/tutorial')}
                    className="btn-ghost flex items-center gap-2 text-base px-8 py-4">
                    View Tutorial
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-600 text-sm font-mono">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400/50" />
            <span>CompressorAI © 2026 — Industrial Optimization Platform</span>
          </div>
          <span>DBSCAN + GBR + Differential Evolution</span>
        </div>
      </footer>
    </div>
  )
}
