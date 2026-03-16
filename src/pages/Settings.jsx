import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import api from '../utils/api'
import { Settings as SettingsIcon, User, Lock, Info } from 'lucide-react'

export default function Settings() {
  const { user, setUser } = useAuthStore()
  const [profile,   setProfile]   = useState({ full_name: user?.full_name || '', company: user?.company || '' })
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm: '' })
  const [saving,    setSaving]    = useState(false)
  const [savingPw,  setSavingPw]  = useState(false)

  // ── Save Profile ──────────────────────────────────────────
  const saveProfile = async (e) => {
    e.preventDefault()
    if (!profile.full_name.trim()) { toast.error('Full name is required'); return }
    setSaving(true)
    try {
      await api.put('/auth/me', {
        full_name: profile.full_name.trim(),
        company:   profile.company.trim() || null,
      })
      setUser({ ...user, full_name: profile.full_name.trim(), company: profile.company.trim() })
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile')
    } finally { setSaving(false) }
  }

  // ── Change Password ───────────────────────────────────────
  const changePassword = async (e) => {
    e.preventDefault()
    if (!passwords.current_password) { toast.error('Enter your current password'); return }
    // ✅ FIX: Backend requires min 8 chars (was 6)
    if (passwords.new_password.length < 8) { toast.error('New password must be at least 8 characters'); return }
    if (passwords.new_password !== passwords.confirm) { toast.error('Passwords do not match'); return }
    setSavingPw(true)
    try {
      await api.put('/auth/me/password', {
        current_password: passwords.current_password,
        new_password:     passwords.new_password,
      })
      setPasswords({ current_password: '', new_password: '', confirm: '' })
      toast.success('Password changed successfully!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to change password')
    } finally { setSavingPw(false) }
  }

  const role = user?.role || 'engineer'
  const roleColor = role === 'admin' ? '#00d4ff' : '#3b82f6'

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-800 text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* ── Profile Card ── */}
      <div className="card">
        <h2 className="font-display font-700 text-white text-lg mb-5 flex items-center gap-2">
          <User size={18} className="text-cyan-400"/> Profile
        </h2>
        <form onSubmit={saveProfile} className="space-y-4">

          <div>
            <label className="label">Full Name *</label>
            <input className="input-field" placeholder="Your full name"
              value={profile.full_name}
              onChange={e => setProfile({...profile, full_name: e.target.value})}/>
          </div>

          <div>
            <label className="label">Email Address</label>
            <input className="input-field" value={user?.email || ''} disabled
              style={{opacity:0.5, cursor:'not-allowed'}}/>
            <p className="text-xs text-slate-600 mt-1">Email address cannot be changed.</p>
          </div>

          <div>
            <label className="label">Company / Institution <span className="text-slate-600">(Optional)</span></label>
            <input className="input-field" placeholder="e.g. NEDUET, FPCL, OGDCL"
              value={profile.company}
              onChange={e => setProfile({...profile, company: e.target.value})}/>
          </div>

          <div>
            <label className="label">Role</label>
            <div className="input-field flex items-center gap-2"
              style={{opacity:0.6, cursor:'not-allowed'}}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background: roleColor}}/>
              <span className="capitalize">{role}</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">Role is assigned by the platform administrator.</p>
          </div>

          <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.98}}
            type="submit" disabled={saving}
            className="bg-cyan-400 text-primary-900 font-display font-700 px-6 py-2.5 rounded-xl hover:bg-cyan-300 transition-all disabled:opacity-60 text-sm flex items-center gap-2">
            {saving
              ? <><div className="w-4 h-4 border-2 border-primary-900/30 border-t-primary-900 rounded-full animate-spin"/><span>Saving...</span></>
              : 'Save Profile'}
          </motion.button>
        </form>
      </div>

      {/* ── Change Password Card ── */}
      <div className="card">
        <h2 className="font-display font-700 text-white text-lg mb-5 flex items-center gap-2">
          <Lock size={18} className="text-cyan-400"/> Change Password
        </h2>
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="label">Current Password *</label>
            <input type="password" className="input-field" placeholder="Enter current password"
              value={passwords.current_password}
              onChange={e => setPasswords({...passwords, current_password: e.target.value})}/>
          </div>
          <div>
            <label className="label">New Password *</label>
            <input type="password" className="input-field" placeholder="Min. 8 characters"
              value={passwords.new_password}
              onChange={e => setPasswords({...passwords, new_password: e.target.value})}/>
          </div>
          <div>
            <label className="label">Confirm New Password *</label>
            <input type="password" className="input-field" placeholder="Repeat new password"
              value={passwords.confirm}
              onChange={e => setPasswords({...passwords, confirm: e.target.value})}/>
          </div>
          <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.98}}
            type="submit" disabled={savingPw}
            className="font-display font-700 px-6 py-2.5 rounded-xl transition-all disabled:opacity-60 text-sm flex items-center gap-2"
            style={{background:'rgba(0,212,255,0.1)', border:'1px solid rgba(0,212,255,0.3)', color:'#00d4ff'}}>
            {savingPw
              ? <><div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"/><span>Updating...</span></>
              : 'Change Password'}
          </motion.button>
        </form>
      </div>

      {/* ── System Info ── */}
      <div className="card">
        <h2 className="font-display font-700 text-white text-lg mb-4 flex items-center gap-2">
          <SettingsIcon size={18} className="text-cyan-400"/> System Info
        </h2>
        <div className="space-y-0 font-mono text-sm">
          {[
            ['Platform',   'CompressorAI v5.0'],   // ✅ FIX: was v4.0
            ['ML Engine',  'DBSCAN + GBR + Genetic Algorithm'],
            ['Backend',    'FastAPI (Python 3.11)'],
            ['Database',   'Supabase PostgreSQL'],
            ['Frontend',   'React + Vite + TailwindCSS'],
            ['Reports',    'ReportLab PDF + OpenPyXL Excel'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2.5 border-b"
              style={{borderColor:'rgba(255,255,255,0.05)'}}>
              <span className="text-slate-500">{k}</span>
              <span className="text-slate-300">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Account Policy Note ── */}
      <div className="rounded-xl p-4" style={{
        background:'rgba(251,191,36,0.04)',
        border:'1px solid rgba(251,191,36,0.12)'
      }}>
        <div className="flex items-start gap-2.5">
          <Info size={14} className="text-yellow-400 flex-shrink-0 mt-0.5"/>
          <div className="space-y-1.5">
            <p className="text-xs font-600 text-yellow-400">Account Policy</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              If your account is deactivated, you will not be able to log in or register again
              using the same email address.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              If you forget your password, please contact your platform administrator using
              the official email address provided to you at the time of registration.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}