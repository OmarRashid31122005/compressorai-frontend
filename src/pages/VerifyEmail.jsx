import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Mail, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react'
import api from '../utils/api'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const { login } = useAuthStore()

  const [code, setCode] = useState(['','','','','',''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)
  const [verified, setVerified] = useState(false)
  const inputRefs = useRef([])

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setInterval(() => setResendTimer(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [resendTimer])

  const handleCodeChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return
    const newCode = [...code]
    newCode[idx] = val
    setCode(newCode)
    // Auto-advance
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus()
    // Auto-submit when all filled
    if (val && idx === 5 && newCode.every(c => c)) {
      handleVerify(newCode.join(''))
    }
  }

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
    if (e.key === 'Enter' && code.every(c => c)) {
      handleVerify(code.join(''))
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6)
    if (pasted.length === 6) {
      setCode(pasted.split(''))
      setTimeout(() => handleVerify(pasted), 100)
    }
  }

  const handleVerify = async (codeStr) => {
    if (codeStr.length !== 6) { toast.error('Enter all 6 digits'); return }
    setLoading(true)
    try {
      const res = await api.post('/auth/verify-email', { email, code: codeStr })
      setVerified(true)
      login(res.data.user, res.data.access_token)
      toast.success('Email verified! Welcome to CompressorAI 🎉', { duration: 3000 })
      setTimeout(() => navigate('/dashboard'), 1800)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Verification failed'
      toast.error(msg)
      // Clear code on wrong input
      setCode(['','','','','',''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0) return
    setResending(true)
    try {
      await api.post('/auth/resend-code', { email })
      toast.success('New code sent to your email!')
      setResendTimer(60)
      setCode(['','','','','',''])
      inputRefs.current[0]?.focus()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to resend code')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080e1a] bg-grid flex items-center justify-center p-4 relative overflow-hidden">
      {/* BG glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full"
          style={{background:'radial-gradient(circle,rgba(0,212,255,0.06),transparent 70%)'}}/>
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 rounded-full"
          style={{background:'radial-gradient(circle,rgba(250,204,21,0.05),transparent 70%)'}}/>
      </div>

      <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.5}}
        className="w-full max-w-md relative z-10">

        {/* Logo */}
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

        {/* Card */}
        <div className="rounded-2xl p-8 text-center" style={{
          background:'rgba(8,20,40,0.85)',
          border:'1px solid rgba(0,212,255,0.12)',
          backdropFilter:'blur(20px)',
          boxShadow:'0 25px 60px rgba(0,0,0,0.5)'
        }}>
          <AnimatePresence mode="wait">
            {verified ? (
              <motion.div key="success"
                initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} transition={{type:'spring',stiffness:200}}>
                <div className="w-20 h-20 rounded-full bg-green-400/10 border border-green-400/30
                  flex items-center justify-center mx-auto mb-5">
                  <CheckCircle size={36} className="text-green-400" />
                </div>
                <h2 className="font-display font-800 text-white text-2xl mb-2">Email Verified!</h2>
                <p className="text-slate-400 text-sm mb-2">Welcome to CompressorAI</p>
                <p className="text-slate-600 text-xs">Redirecting to dashboard...</p>
                <div className="mt-5 flex justify-center">
                  <div className="w-8 h-8 spinner-yellow" />
                </div>
              </motion.div>
            ) : (
              <motion.div key="verify" initial={{opacity:0}} animate={{opacity:1}}>
                {/* Email icon */}
                <div className="w-20 h-20 rounded-2xl bg-cyan-400/8 border border-cyan-400/20
                  flex items-center justify-center mx-auto mb-5">
                  <Mail size={34} className="text-cyan-400" />
                </div>

                <h2 className="font-display font-800 text-white text-2xl mb-2">Check Your Email</h2>
                <p className="text-slate-400 text-sm mb-1">We sent a 6-digit code to</p>
                <p className="text-cyan-400 font-mono text-sm font-600 mb-7">{email}</p>

                {/* OTP inputs */}
                <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
                  {code.map((digit, idx) => (
                    <motion.input
                      key={idx}
                      ref={el => inputRefs.current[idx] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleCodeChange(idx, e.target.value)}
                      onKeyDown={e => handleKeyDown(idx, e)}
                      whileFocus={{scale:1.08}}
                      className="w-12 h-14 text-center text-2xl font-display font-700 rounded-xl
                        text-white focus:outline-none transition-all duration-200"
                      style={{
                        background: digit ? 'rgba(250,204,21,0.08)' : 'rgba(255,255,255,0.04)',
                        border: digit
                          ? '2px solid rgba(250,204,21,0.6)'
                          : '2px solid rgba(0,212,255,0.2)',
                        boxShadow: digit ? '0 0 12px rgba(250,204,21,0.2)' : 'none'
                      }}
                    />
                  ))}
                </div>

                {/* Verify button */}
                <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.98}}
                  onClick={() => handleVerify(code.join(''))}
                  disabled={loading || code.some(c => !c)}
                  className="w-full py-3.5 rounded-xl font-display font-700 text-[#080e1a]
                    flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{background:'linear-gradient(135deg,#facc15,#f59e0b)',
                    boxShadow:'0 0 20px rgba(250,204,21,0.25)'}}>
                  {loading
                    ? <><div className="w-5 h-5 spinner" style={{borderTopColor:'#080e1a',borderColor:'rgba(8,14,26,0.3)'}} /><span>Verifying...</span></>
                    : <span>Verify Email →</span>
                  }
                </motion.button>

                {/* Resend */}
                <div className="mt-5">
                  <p className="text-slate-500 text-sm mb-2">Didn't receive the code?</p>
                  <button onClick={handleResend} disabled={resendTimer > 0 || resending}
                    className="text-cyan-400 hover:text-cyan-300 text-sm font-600 transition-colors
                      disabled:text-slate-600 disabled:cursor-not-allowed flex items-center gap-2 mx-auto">
                    {resending
                      ? <><RefreshCw size={14} className="animate-spin" />Sending...</>
                      : resendTimer > 0
                        ? `Resend code in ${resendTimer}s`
                        : <><RefreshCw size={14} />Resend Code</>
                    }
                  </button>
                </div>

                {/* Back */}
                <div className="mt-6 pt-5 border-t" style={{borderColor:'rgba(255,255,255,0.05)'}}>
                  <Link to="/register"
                    className="text-slate-500 hover:text-slate-300 text-sm transition-colors flex items-center gap-1.5 justify-center">
                    <ArrowLeft size={14} />Back to Register
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          ⏱ Code expires in 10 minutes · Check spam folder if not received
        </p>
      </motion.div>
    </div>
  )
}