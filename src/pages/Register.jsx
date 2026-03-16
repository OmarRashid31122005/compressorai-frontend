import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Eye, EyeOff, ArrowRight, User, Mail, Lock, Building2, Shield } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function Register() {
  const navigate = useNavigate()
  const [loading,     setLoading]     = useState(false)
  const [showPass,    setShowPass]    = useState(false)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', role: 'engineer', company: ''
  })

  const set = (k, v) => setForm(f => ({...f, [k]: v}))

  const handleSubmit = async () => {
    if (!form.full_name.trim() || !form.email || !form.password) {
      toast.error('Please fill all required fields')
      return
    }
    // ✅ FIX: Backend requires min 8 chars (was 6)
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (!agreedTerms) {
      toast.error('You must agree to the data sharing terms to create an account.')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/register', { ...form, agreed_to_terms: true })
      toast.success('Check your email for the verification code!', { duration: 4000 })
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed'
      if (msg.includes('already registered')) {
        toast.error('This email is already registered. Please login.')
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080e1a] bg-grid flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-6"
          style={{background:'radial-gradient(circle,rgba(0,212,255,0.08),transparent 70%)'}}/>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-6"
          style={{background:'radial-gradient(circle,rgba(250,204,21,0.06),transparent 70%)'}}/>
      </div>

      <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.5}}
        className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group">
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

        {/* Card */}
        <div className="rounded-2xl p-8" style={{
          background:'rgba(8,20,40,0.8)',
          border:'1px solid rgba(0,212,255,0.12)',
          backdropFilter:'blur(20px)',
          boxShadow:'0 25px 60px rgba(0,0,0,0.5)'
        }}>
          <h2 className="font-display font-800 text-white text-2xl mb-1">Create Account</h2>
          <p className="text-slate-500 text-sm mb-7">Join as an Engineer on the industrial optimization platform</p>

          <div className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="label">Full Name *</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input className="input-field pl-10" placeholder="John Doe"
                  value={form.full_name} onChange={e => set('full_name', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label">Email Address *</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="email" className="input-field pl-10" placeholder="you@example.com"
                  value={form.email} onChange={e => set('email', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password *</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type={showPass ? 'text' : 'password'} className="input-field pl-10 pr-10"
                  placeholder="Min. 8 characters recommended"
                  value={form.password} onChange={e => set('password', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.password.length > 0 && (() => {
                const pw = form.password
                const checks = {
                  len:     pw.length >= 8,
                  upper:   /[A-Z]/.test(pw),
                  lower:   /[a-z]/.test(pw),
                  number:  /[0-9]/.test(pw),
                  special: /[^A-Za-z0-9]/.test(pw),
                }
                const passed = Object.values(checks).filter(Boolean).length
                const strength = passed <= 1 ? 'Weak' : passed <= 3 ? 'Fair' : passed === 4 ? 'Good' : 'Strong'
                const strengthColor = passed <= 1 ? '#ef4444' : passed <= 3 ? '#f59e0b' : passed === 4 ? '#00d4ff' : '#00c853'
                return (
                  <div className="mt-2.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full" style={{background:'rgba(255,255,255,0.06)'}}>
                        <div className="h-1.5 rounded-full transition-all duration-300"
                          style={{width:`${(passed/5)*100}%`, background:strengthColor, boxShadow:`0 0 8px ${strengthColor}66`}} />
                      </div>
                      <span className="text-xs font-mono font-600" style={{color:strengthColor, minWidth:'44px'}}>{strength}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      {[
                        [checks.len,     '8+ characters'],
                        [checks.upper,   'Uppercase (A-Z)'],
                        [checks.lower,   'Lowercase (a-z)'],
                        [checks.number,  'Number (0-9)'],
                        [checks.special, 'Special (!@#...)'],
                      ].map(([ok, label]) => (
                        <div key={label} className="flex items-center gap-1.5">
                          <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                            style={{background: ok ? 'rgba(0,200,83,0.15)' : 'rgba(255,255,255,0.04)',
                              border:`1px solid ${ok ? '#00c853' : 'rgba(255,255,255,0.1)'}`}}>
                            {ok && <span style={{color:'#00c853', fontSize:'8px', lineHeight:1}}>✓</span>}
                          </div>
                          <span className="text-xs transition-colors" style={{color: ok ? '#94a3b8' : '#334155'}}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Company */}
            <div>
              <label className="label">Uni / College / Company <span className="text-slate-600">(Optional)</span></label>
              <div className="relative">
                <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input className="input-field pl-10" placeholder="NEDUET / FAST / NUST / Your Company"
                  value={form.company} onChange={e => set('company', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              </div>
            </div>

            {/* Data Sharing Terms */}
            <div
              onClick={() => setAgreedTerms(!agreedTerms)}
              className="flex items-start gap-3 rounded-xl p-4 cursor-pointer select-none transition-all"
              style={{
                background: agreedTerms ? 'rgba(0,200,83,0.06)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${agreedTerms ? 'rgba(0,200,83,0.35)' : 'rgba(255,255,255,0.08)'}`,
              }}>
              <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all"
                style={{
                  background: agreedTerms ? '#00c853' : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${agreedTerms ? '#00c853' : 'rgba(255,255,255,0.2)'}`,
                }}>
                {agreedTerms && <span style={{color:'#080e1a', fontSize:'11px', fontWeight:700, lineHeight:1}}>✓</span>}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Shield size={12} className="text-cyan-400 flex-shrink-0"/>
                  <span className="text-xs font-600 text-slate-300">Data Sharing Agreement</span>
                  <span className="text-xs text-red-400 font-600">*</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  I agree that compressor operational data uploaded to this platform may be used
                  for research, model improvement, and industrial optimization purposes. Data will
                  be handled securely and not shared with unauthorized third parties.
                </p>
              </div>
            </div>

            {/* Account Policy Note */}
            <div className="rounded-xl p-3.5" style={{
              background: 'rgba(251,191,36,0.04)',
              border: '1px solid rgba(251,191,36,0.12)',
            }}>
              <div className="flex items-start gap-2.5">
                <span className="text-yellow-400 text-sm flex-shrink-0 mt-0.5">ⓘ</span>
                <div className="space-y-1.5">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <span className="text-yellow-400 font-600">Account Policy: </span>
                    If your account is deactivated for any reason, you will not be able to register
                    or log in again using the same email address.
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <span className="text-yellow-400 font-600">Forgot Password? </span>
                    Password reset is not self-service. Please contact your platform administrator
                    using the official email address provided to you at the time of registration.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Submit */}
          <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.98}}
            onClick={handleSubmit} disabled={loading}
            className="w-full mt-6 py-3.5 rounded-xl font-display font-700 text-[#080e1a]
              flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={{background:'linear-gradient(135deg,#facc15,#f59e0b)',
              boxShadow:loading?'none':'0 0 24px rgba(250,204,21,0.3)'}}>
            {loading ? (
              <><div className="w-5 h-5 spinner-yellow" /><span>Sending Code...</span></>
            ) : (
              <><span>Create Account</span><ArrowRight size={18} /></>
            )}
          </motion.button>

          <p className="text-center text-slate-500 text-sm mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-yellow-400 hover:text-yellow-300 font-600 transition-colors">
              Sign In
            </Link>
          </p>
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          📧 A 6-digit verification code will be sent to your email
        </p>
      </motion.div>
    </div>
  )
}