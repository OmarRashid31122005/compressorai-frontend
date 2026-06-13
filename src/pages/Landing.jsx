import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Suspense, lazy, useRef, useEffect, useState } from 'react'
import { Zap, Shield, BarChart3, ChevronRight, Activity, Cpu, TrendingDown, ArrowRight, Star, Users, Code2, GraduationCap, X } from 'lucide-react'
import useAuthStore from '../store/authStore'

// ── Photo Imports ─────────────────────────────────────────────
import TariqJameelPhoto         from '../assets/photos/Sir Tariq Jameel.jpeg'
import MirzaBaigPhoto           from '../assets/photos/Mirza Muhammad Ali Baig.jpeg'
import BasitIqbalPhoto          from '../assets/photos/Basit Iqbal Khan.jpeg'
import MaazAhmedPhoto           from '../assets/photos/Maaz Ahmed.jpeg'
import AliRashidPhoto           from "../assets/photos/Ali Rashid.jpeg"
import MalikMuhammadRafayPhoto  from "../assets/photos/Rafay.jpeg"
import MuhammadBilalAkberPhoto  from "../assets/photos/Bilal.jpeg"
import OmarRashidPhoto          from '../assets/photos/Omar Rashid.jpg'
// Rafay & Bilal photos not provided — initials avatar will show for them

const CompressorScene = lazy(() => import('../components/ui/CompressorScene'))

const features = [
  { icon: Zap,         title: 'AI-Powered Optimization', desc: 'Genetic algorithms + Gradient Boosting pinpoint the exact operating point for maximum efficiency.', color: 'yellow' },
  { icon: BarChart3,   title: 'Real-Time Analytics',     desc: 'Interactive charts show power curves, clustering results, and efficiency trends live.',             color: 'cyan' },
  { icon: Shield,      title: 'Secure & Role-Based',     desc: 'Enterprise-grade auth with Admin and Engineer roles. JWT-secured, token-validated on every request.', color: 'white' },
  { icon: TrendingDown,title: 'Energy Savings',          desc: 'Identify measurable reduction in electrical power — actual saving depends on your compressor and dataset.', color: 'yellow' },
  { icon: Cpu,         title: 'Rotary Screw Compressors', desc: 'Optimized specifically for Rotary Screw Compressors — the industry standard for continuous duty industrial applications.', color: 'cyan' },
  { icon: Activity,    title: 'Auto-Retraining',         desc: 'Model continuously improves over time as more operational data is collected.',                       color: 'white' },
]

const steps = [
  { step:'01', title:'Upload Dataset',  desc:'Upload your Rotary Screw Compressor Excel/CSV data. Our system validates columns and guides you through any issues.',                                                              color:'yellow' },
  { step:'02', title:'AI Analyzes',     desc:'DBSCAN clusters your data, Gradient Boosting trains on clean clusters, Genetic Algorithm finds global optimum.',                                                      color:'cyan'   },
  { step:'03', title:'Get Results',     desc:'View optimal parameter ranges, interactive charts, model scores, and download professional reports.',                                                                 color:'white'  },
]

// ── Team Data ─────────────────────────────────────────────────
const teamData = {
  supervisor: {
    name: 'Dr. Tariq Jamil',
    role: 'Project Supervisor',
    title: 'Associate Professor',
    dept: 'Department of Mechanical Engineering, NEDUET',
    color: '#facc15',
    photo: TariqJameelPhoto,
  },
  coSupervisor: {
    name: 'Dr. Mirza Muhammad Ali Baig',
    role: 'Project Co-Supervisor',
    title: 'Assistant Professor',
    dept: 'Department of Mechanical Engineering, NEDUET',
    color: '#00d4ff',
    photo: MirzaBaigPhoto,
  },
  industrialAdvisor: {
    name: 'Mr. Basit Iqbal Khan',
    role: 'Industrial Advisor',
    title: 'Unit Manager',
    dept: 'FPCL (Fauji Polymer Company Limited)',
    color: '#00c853',
    photo: BasitIqbalPhoto,
  },
  developers: [
    {
      name: 'Maaz Ahmed Siddiqui',
      seatNo: 'ME-22301',
      role: 'Group Lead · Research & Outreach',
      sub: 'Industrial outreach lead · Report drafting & editing · Stakeholder communication · Literature review on compressor overview, import market & research gap · Contributed to both optimization frameworks & dashboard',
      color: '#facc15',
      photo: MaazAhmedPhoto,
    },
    {
      name: 'Ali Rashid',
      seatNo: 'ME-22032',
      role: 'ML Framework Developer',
      sub: 'Industrial outreach · Literature review on compressor operations · Developed ML framework for operational optimization · Operational optimization module of dashboard',
      color: '#00d4ff',
      photo: AliRashidPhoto,
    },
    {
      name: 'Malik Muhammad Rafay',
      seatNo: 'ME-22022',
      role: 'Data Engineering & Maintenance',
      sub: 'Industrial outreach · Literature review on maintenance strategies · Data cleaning & preprocessing · Maintenance compliance analysis framework · Maintenance module of dashboard',
      color: '#a78bfa',
      photo: MalikMuhammadRafayPhoto,
    },
    {
      name: 'Muhammad Bilal Akber',
      seatNo: 'ME-22031',
      role: 'Lifecycle & Deployment',
      sub: 'Industrial outreach · Studied preventive maintenance & OEM manuals · Literature review on lifecycle cost analysis & operational optimization · Dashboard development & deployment',
      color: '#00c853',
      photo: MuhammadBilalAkberPhoto,
    },
  ],
  technicalContributor: {
    name: 'Omar Rashid',
    seatNo: 'CS-23136',
    role: 'Technical Contributor',
    title: 'Third-Year Student · CS & Information System Engineering',
    dept: 'NED University of Engineering & Technology',
    contribution: 'Assisted in full-stack development (frontend, backend), database design, ML model selection, and hyperparameter tuning throughout the development and deployment of this project.',
    color: '#f97316',
    photo: OmarRashidPhoto,
  },
}

// ── Avatar ────────────────────────────────────────────────────
function Avatar({ name, photo, size = 72, color = '#00d4ff' }) {
  const initials = name
    .split(' ')
    .filter(w => w && w[0] !== '[')
    .slice(0, 2)
    .map(w => w[0])
    .join('') || '?'

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size, border: `2px solid ${color}50` }}
      />
    )
  }
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 font-mono font-bold"
      style={{
        width: size,
        height: size,
        background: `${color}15`,
        border: `2px solid ${color}35`,
        color,
        fontSize: size * 0.3,
        letterSpacing: '0.05em',
      }}
    >
      {initials}
    </div>
  )
}

// ── Section Label ─────────────────────────────────────────────
function SectionLabel({ icon: Icon, label, color }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={13} style={{ color }} />
      <span className="text-xs font-mono font-semibold uppercase tracking-widest" style={{ color }}>
        {label}
      </span>
    </div>
  )
}

// ── Team Modal ────────────────────────────────────────────────
function TeamModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(4,10,22,0.93)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 24 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl"
        style={{
          background: 'rgba(7,16,36,0.99)',
          border: '1px solid rgba(0,212,255,0.13)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.75)',
        }}
      >
        {/* Sticky Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b"
          style={{ background: 'rgba(7,16,36,0.99)', borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <div>
            <h2 className="font-display font-800 text-white text-xl">Project Team</h2>
            <p className="text-slate-500 text-xs mt-0.5 font-mono">
              NED University of Engineering &amp; Technology · Karachi
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-8">

          {/* NED Logo + Project Info */}
          <div
            className="flex items-center gap-4 rounded-2xl p-5"
            style={{ background: 'rgba(250,204,21,0.04)', border: '1px solid rgba(250,204,21,0.14)' }}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/en/thumb/5/5a/NED_University_logo.svg/200px-NED_University_logo.svg.png"
              alt="NEDUET Logo"
              className="w-16 h-16 object-contain flex-shrink-0"
              onError={e => { e.target.style.display = 'none' }}
            />
            <div>
              <div className="font-display font-800 text-white text-base">CompressorAI</div>
              <div className="text-yellow-400 text-xs font-mono mt-0.5">
                Final Year Project · B.E Mechanical Engineering
              </div>
              <div className="text-slate-400 text-xs mt-1">
                NED University of Engineering &amp; Technology, Karachi
              </div>
              <div className="text-slate-600 text-xs font-mono mt-0.5">
                © 2024–2026 NEDUET · All Rights Reserved
              </div>
            </div>
          </div>

          {/* Project Supervisor */}
          <div>
            <SectionLabel icon={GraduationCap} label="Project Supervisor" color="#facc15" />
            <div
              className="rounded-2xl p-5 flex items-center gap-4"
              style={{ background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(250,204,21,0.22)' }}
            >
              <Avatar name={teamData.supervisor.name} photo={teamData.supervisor.photo} size={64} color="#facc15" />
              <div>
                <div className="font-display font-700 text-white">{teamData.supervisor.name}</div>
                <div className="text-yellow-400 text-sm font-semibold mt-0.5">{teamData.supervisor.title}</div>
                <div className="text-yellow-300/70 text-xs font-mono mt-0.5">{teamData.supervisor.role}</div>
                <div className="text-slate-500 text-xs font-mono mt-1">{teamData.supervisor.dept}</div>
              </div>
            </div>
          </div>

          {/* Co-Supervisor */}
          <div>
            <SectionLabel icon={GraduationCap} label="Project Co-Supervisor" color="#00d4ff" />
            <div
              className="rounded-2xl p-5 flex items-center gap-4"
              style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.22)' }}
            >
              <Avatar name={teamData.coSupervisor.name} photo={teamData.coSupervisor.photo} size={64} color="#00d4ff" />
              <div>
                <div className="font-display font-700 text-white">{teamData.coSupervisor.name}</div>
                <div className="text-cyan-400 text-sm font-semibold mt-0.5">{teamData.coSupervisor.title}</div>
                <div className="text-cyan-300/70 text-xs font-mono mt-0.5">{teamData.coSupervisor.role}</div>
                <div className="text-slate-500 text-xs font-mono mt-1">{teamData.coSupervisor.dept}</div>
              </div>
            </div>
          </div>

          {/* Industrial Advisor */}
          <div>
            <SectionLabel icon={Cpu} label="Industrial Advisor" color="#00c853" />
            <div
              className="rounded-2xl p-5 flex items-center gap-4"
              style={{ background: 'rgba(0,200,83,0.05)', border: '1px solid rgba(0,200,83,0.22)' }}
            >
              <Avatar name={teamData.industrialAdvisor.name} photo={teamData.industrialAdvisor.photo} size={64} color="#00c853" />
              <div>
                <div className="font-display font-700 text-white">{teamData.industrialAdvisor.name}</div>
                <div className="text-green-400 text-sm font-semibold mt-0.5">{teamData.industrialAdvisor.title}</div>
                <div className="text-green-300/70 text-xs font-mono mt-0.5">{teamData.industrialAdvisor.role}</div>
                <div className="text-slate-500 text-xs font-mono mt-1">{teamData.industrialAdvisor.dept}</div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.07), transparent)' }} />

          {/* Development Team */}
          <div>
            <SectionLabel icon={Code2} label="Development Team · Group Members" color="#a78bfa" />
            <div className="space-y-3">
              {teamData.developers.map((dev, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-4 flex items-start gap-4"
                  style={{ background: `${dev.color}08`, border: `1px solid ${dev.color}28` }}
                >
                  <Avatar name={dev.name} photo={dev.photo} size={52} color={dev.color} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-display font-700 text-white">{dev.name}</div>
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                        style={{
                          background: `${dev.color}18`,
                          border: `1px solid ${dev.color}35`,
                          color: dev.color,
                        }}
                      >
                        {dev.seatNo}
                      </span>
                    </div>
                    <div className="text-sm font-semibold mt-0.5" style={{ color: dev.color }}>
                      {dev.role}
                    </div>
                    <div className="text-slate-500 text-xs font-mono mt-1 leading-relaxed">
                      {dev.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Contributor: Omar Rashid */}
          <div>
            <SectionLabel icon={Activity} label="Technical Contributor" color="#f97316" />
            <div
              className="rounded-2xl p-5 flex items-start gap-4"
              style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.25)' }}
            >
              <Avatar
                name={teamData.technicalContributor.name}
                photo={teamData.technicalContributor.photo}
                size={60}
                color="#f97316"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-display font-700 text-white">
                    {teamData.technicalContributor.name}
                  </div>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(249,115,22,0.15)',
                      border: '1px solid rgba(249,115,22,0.3)',
                      color: '#f97316',
                    }}
                  >
                    {teamData.technicalContributor.seatNo}
                  </span>
                </div>
                <div className="text-orange-400 text-sm font-semibold mt-0.5">
                  {teamData.technicalContributor.role}
                </div>
                <div className="text-slate-500 text-xs font-mono mt-0.5">
                  {teamData.technicalContributor.title}
                </div>
                <div className="text-slate-500 text-xs font-mono">
                  {teamData.technicalContributor.dept}
                </div>
                <p className="text-slate-400 text-xs leading-relaxed mt-2 border-t border-white/5 pt-2">
                  {teamData.technicalContributor.contribution}
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.07), transparent)' }} />

          {/* Acknowledgments */}
          <div>
            <SectionLabel icon={Star} label="Acknowledgments" color="#facc15" />
            <div
              className="rounded-2xl p-5 space-y-3"
              style={{ background: 'rgba(250,204,21,0.03)', border: '1px solid rgba(250,204,21,0.1)' }}
            >
              <p className="text-slate-400 text-xs leading-relaxed">
                We express our deepest gratitude to{' '}
                <span className="text-yellow-400 font-semibold">NED University of Engineering and Technology</span>{' '}
                for providing the platform and resources to carry out this Final Year Project. Our
                sincere thanks extend to the{' '}
                <span className="text-white font-medium">Department of Mechanical Engineering</span>{' '}
                for fostering a learning environment that encourages innovation, research, and
                hands-on experience.
              </p>
              <p className="text-slate-400 text-xs leading-relaxed">
                We are especially thankful to our academic supervisors,{' '}
                <span className="text-yellow-400 font-semibold">Dr. Tariq Jamil</span> and{' '}
                <span className="text-cyan-400 font-semibold">Dr. Mirza Muhammad Ali Baig</span>,
                for their invaluable guidance, constructive feedback, and unwavering support
                throughout this project. We are also grateful to our industrial advisor,{' '}
                <span className="text-green-400 font-semibold">Mr. Basit Iqbal Khan</span> (Unit
                Manager, FPCL), whose practical experience and mentorship helped bridge the gap
                between academic knowledge and real-world applications.
              </p>
              <p className="text-slate-400 text-xs leading-relaxed">
                We would also like to thank{' '}
                <span className="text-orange-400 font-semibold">Mr. Omar Rashid (CS-23136)</span>,
                a third-year student in the Computer &amp; Information System Engineering department
                at NED University, for his extensive help in the full-stack development (frontend,
                backend), database design, ML model selection, and hyperparameter tuning throughout
                the development and deployment of this project's dashboard.
              </p>
            </div>
          </div>

          {/* Copyright */}
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-slate-500 text-xs font-mono">
              All intellectual property rights of this project belong to
              <br />
              <span className="text-yellow-400 font-semibold">
                NED University of Engineering &amp; Technology, Karachi
              </span>
            </p>
            <p className="text-slate-600 text-xs font-mono mt-1">
              © 2024–2026 NEDUET · Unauthorized use or reproduction is strictly prohibited.
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  )
}

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
  const [showTeam, setShowTeam] = useState(false)

  const handleStart = () => navigate(isAuthenticated ? '/dashboard' : '/register')

  return (
    <div className="min-h-screen bg-[#080e1a] text-white overflow-x-hidden">
      <div className="scanline" />

      {/* Team Modal */}
      {showTeam && <TeamModal onClose={() => setShowTeam(false)} />}

      {/* ── NAV ── */}
      <nav className="fixed top-0 w-full z-50 glass-dark border-b border-cyan-400/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://upload.wikimedia.org/wikipedia/en/thumb/5/5a/NED_University_logo.svg/200px-NED_University_logo.svg.png"
              alt="NEDUET"
              className="w-7 h-7 object-contain opacity-80"
              onError={e => { e.target.style.display = 'none' }}
            />
            <div className="w-px h-5 bg-white/10" />
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
            <button onClick={() => setShowTeam(true)}
              className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 transition-colors text-sm font-display px-4 py-2 hover:bg-cyan-400/5 rounded-lg border border-transparent hover:border-cyan-400/20">
              <Users size={13} />
              <span>Our Team</span>
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

            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.55 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{ border:'1px solid rgba(0,212,255,0.3)', background:'rgba(0,212,255,0.06)' }}>
              <Cpu size={11} className="text-cyan-400" />
              <span className="text-cyan-400 text-xs font-mono tracking-wide">
                Designed exclusively for <strong>Rotary Screw Compressors</strong>
              </span>
            </motion.div>

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
              className="grid grid-cols-3 gap-4 pt-5 border-t border-white/5">
              {[
                { val:'95%+',   label:'Model Accuracy'  },
                { val:'3-Step', label:'ML Pipeline'     },
                { val:'∞',      label:'Compressors'     },
              ].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <div className="font-display font-900 text-xl text-yellow-400 neon-yellow">{val}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: 3D Model */}
          <motion.div
            initial={{ opacity:0, scale:0.85, x:40 }}
            animate={{ opacity:1, scale:1, x:0 }}
            transition={{ duration:1.2, ease:[0.22,1,0.36,1], delay:0.2 }}
            className="relative flex items-center justify-center"
          >
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              <div className="absolute inset-0 rounded-2xl"
                style={{background:'radial-gradient(ellipse at center, rgba(0,212,255,0.07) 0%, transparent 70%)'}} />
              <div className="absolute inset-0 rounded-2xl animate-pulse"
                style={{background:'radial-gradient(ellipse at 40% 60%, rgba(250,204,21,0.05) 0%, transparent 60%)', animationDuration:'3s'}} />
            </div>

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

      {/* ── ROTARY SCREW NOTICE ── */}
      <section className="py-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            className="rounded-2xl px-6 py-5 flex items-start gap-4"
            style={{ background:'rgba(0,212,255,0.04)', border:'1px solid rgba(0,212,255,0.15)' }}>
            <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-display font-700 text-white text-base mb-1">
                Designed Exclusively for <span className="text-cyan-400">Rotary Screw Compressors</span>
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                CompressorAI is purpose-built for <strong className="text-white">two-stage Rotary Screw Air Compressors</strong> — 
                the most widely deployed type in industrial facilities. The ML pipeline, formulas, 
                and optimization parameters are specifically calibrated for this compressor type. 
                Results may not apply to reciprocating, centrifugal, or scroll compressors.
              </p>
            </div>
          </motion.div>
        </div>
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
              Everything your engineering team needs to optimize Rotary Screw Compressor performance and cut energy costs.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div key={title}
                initial={{ opacity:0, y:40 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }} transition={{ delay: i*0.08 }}
                whileHover={{ y:-6, scale:1.01 }}
                className="card card-hover cursor-default"
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
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-7xl mx-auto px-6">
          {/* NED Copyright row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <img
                src="https://upload.wikimedia.org/wikipedia/en/thumb/5/5a/NED_University_logo.svg/200px-NED_University_logo.svg.png"
                alt="NEDUET"
                className="w-8 h-8 object-contain opacity-70"
                onError={e => { e.target.style.display = 'none' }}
              />
              <div>
                <div className="text-slate-300 text-xs font-display font-600">NED University of Engineering &amp; Technology</div>
                <div className="text-slate-600 text-xs font-mono">All intellectual property rights reserved · Karachi, Pakistan</div>
              </div>
            </div>
            <button onClick={() => setShowTeam(true)}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-400 transition-colors font-mono">
              <Users size={12} /> Our Team &amp; Credits
            </button>
          </div>

          {/* Bottom row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-slate-600 text-sm font-mono">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400/50" />
              <span>CompressorAI © 2024–2026 — NEDUET Final Year Project</span>
            </div>
            <span>DBSCAN + GBR + Differential Evolution · Rotary Screw Compressors Only</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
