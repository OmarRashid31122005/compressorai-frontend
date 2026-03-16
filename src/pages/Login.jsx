import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Eye, EyeOff, ArrowRight, Mail, Lock } from 'lucide-react'
import api from '../utils/api'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  const set = (k, v) => setForm(f => ({...f, [k]: v}))

  const handleSubmit = async () => {
    if (!form.email || !form.password) { toast.error('Fill in all fields'); return }
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      login(res.data.user, res.data.access_token)
      toast.success(`Welcome back, ${res.data.user.full_name.split(' ')[0]}! 👋`)
      navigate('/dashboard')
    } catch (err) {
      const detail = err.response?.data?.detail || ''
      const status = err.response?.status

      if (detail === 'EMAIL_NOT_VERIFIED') {
        toast.error('Please verify your email first!', { duration: 4000 })
        navigate(`/verify-email?email=${encodeURIComponent(form.email)}`)
      } else if (status === 401 && (detail.toLowerCase().includes('invalid') || detail === 'Invalid credentials.')) {
        // Could be wrong password OR user doesn't exist — check if user exists
        toast((t) => (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-slate-200">
              No account found with these credentials.
            </p>
            <p className="text-xs text-slate-400">
              Would you like to create a new account?
            </p>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => { toast.dismiss(t.id); navigate(`/register`) }}
                className="text-xs px-3 py-1.5 rounded-lg font-bold"
                style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.4)', color: '#facc15' }}>
                Create Account
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                Try Again
              </button>
            </div>
          </div>
        ), {
          duration: Infinity,
          id: `no-account-${Date.now()}`,
          style: {
            background: '#0d1a2e',
            border: '1px solid rgba(250,204,21,0.2)',
            borderRadius: '12px',
            padding: '14px 16px',
          }
        })
      } else {
        toast.error(detail || 'Login failed. Check your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080e1a] bg-grid flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-96 h-96 rounded-full"
          style={{background:'radial-gradient(circle,rgba(0,212,255,0.07),transparent 70%)'}}/>
        <div className="absolute bottom-1/3 left-1/3 w-80 h-80 rounded-full"
          style={{background:'radial-gradient(circle,rgba(250,204,21,0.05),transparent 70%)'}}/>
      </div>

      <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.5}}
        className="w-full max-w-md relative z-10">

        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30
              flex items-center justify-center animate-glow-yellow">
              <Zap size={22} className="text-yellow-400" />
            </div>
            <div className="text-left">
              <div className="font-display font-800 text-white text-xl">CompressorAI</div>
              <div className="text-yellow-400/50 text-[10px] font-mono tracking-widest">INDUSTRIAL OPTIMIZER</div>
            </div>
          </Link>
        </div>

        <div className="rounded-2xl p-8" style={{
          background:'rgba(8,20,40,0.85)',
          border:'1px solid rgba(0,212,255,0.12)',
          backdropFilter:'blur(20px)',
          boxShadow:'0 25px 60px rgba(0,0,0,0.5)'
        }}>
          <h2 className="font-display font-800 text-white text-2xl mb-1">Welcome Back</h2>
          <p className="text-slate-500 text-sm mb-7">Sign in to your CompressorAI account</p>

          <div className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="email" className="input-field pl-10" placeholder="you@example.com"
                  value={form.email} onChange={e => set('email', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type={showPass ? 'text' : 'password'} className="input-field pl-10 pr-10"
                  placeholder="Your password"
                  value={form.password} onChange={e => set('password', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.98}}
            onClick={handleSubmit} disabled={loading}
            className="w-full mt-6 py-3.5 rounded-xl font-display font-700 text-[#080e1a]
              flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={{background:'linear-gradient(135deg,#facc15,#f59e0b)',
              boxShadow:loading?'none':'0 0 24px rgba(250,204,21,0.3)'}}>
            {loading
              ? <><div className="w-5 h-5" style={{border:'2px solid rgba(8,14,26,0.3)',borderTopColor:'#080e1a',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} /><span>Signing In...</span></>
              : <><span>Sign In</span><ArrowRight size={18} /></>
            }
          </motion.button>

          <p className="text-center text-slate-500 text-sm mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-yellow-400 hover:text-yellow-300 font-600 transition-colors">
              Create Account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
