import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Download, Calendar, RefreshCw, BarChart3,
  TrendingDown, Zap, Loader2, AlertCircle, ChevronRight,
  FileSpreadsheet, FileBadge
} from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

// ── Helpers ───────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function SavingBadge({ pct }) {
  if (pct == null) return null
  const color = pct >= 10 ? 'text-green-400 bg-green-400/10 border-green-400/20'
    : pct >= 5  ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
    : 'text-orange-400 bg-orange-400/10 border-orange-400/20'
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-mono font-600 px-2 py-0.5 rounded-lg border ${color}`}>
      <TrendingDown size={10}/>{pct.toFixed(1)}% saving
    </span>
  )
}

// ── Report Row ────────────────────────────────────────────────
function ReportRow({ report, index, onDownload, downloading }) {
  const hasPdf   = !!report.report_pdf_path
  const hasExcel = !!report.report_excel_path
  const hasAny   = hasPdf || hasExcel

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="card p-5"
      style={{ border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

        {/* ── Left: meta ── */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <FileText size={18} className="text-cyan-400"/>
          </div>

          <div className="flex-1 min-w-0">
            {/* Date + saving badge */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-white font-display font-600 text-sm">
                {fmtDate(report.created_at)}
              </span>
              <SavingBadge pct={report.power_saving_percent}/>
            </div>

            {/* Secondary stats row */}
            <div className="flex items-center gap-3 mt-1.5 text-xs font-mono text-slate-500 flex-wrap">
              {report.best_electrical_power != null && (
                <span className="flex items-center gap-1">
                  <Zap size={9} className="text-yellow-400"/>
                  {report.best_electrical_power.toFixed(2)} kW optimal
                </span>
              )}
              {!hasAny && (
                <span className="text-amber-500/70 flex items-center gap-1">
                  <AlertCircle size={9}/> No saved report file — regenerate from Analysis
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: download buttons ── */}
        <div className="flex gap-2 flex-shrink-0">
          {hasPdf ? (
            <button
              onClick={() => onDownload(report.report_pdf_path, 'pdf', report.id)}
              disabled={downloading === `${report.id}-pdf`}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-display font-600 transition-all disabled:opacity-50 ${downloading === `${report.id}-pdf` ? 'cursor-wait' : 'cursor-pointer'}`}
              style={{ background:'rgba(0,212,255,0.08)', border:'1px solid rgba(0,212,255,0.2)', color:'#00d4ff' }}
              onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background='rgba(0,212,255,0.16)')}
              onMouseLeave={e => (e.currentTarget.style.background='rgba(0,212,255,0.08)')}
            >
              {downloading === `${report.id}-pdf`
                ? <Loader2 size={14} className="animate-spin"/>
                : <FileBadge size={14}/>}
              PDF
            </button>
          ) : (
            <span className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-mono text-slate-600"
              style={{ border:'1px solid rgba(255,255,255,0.06)' }}>
              <FileBadge size={14}/> No PDF
            </span>
          )}

          {hasExcel ? (
            <button
              onClick={() => onDownload(report.report_excel_path, 'xlsx', report.id)}
              disabled={downloading === `${report.id}-xlsx`}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-display font-600 transition-all disabled:opacity-50 ${downloading === `${report.id}-xlsx` ? 'cursor-wait' : 'cursor-pointer'}`}
              style={{ background:'rgba(0,200,83,0.08)', border:'1px solid rgba(0,200,83,0.2)', color:'#00c853' }}
              onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background='rgba(0,200,83,0.16)')}
              onMouseLeave={e => (e.currentTarget.style.background='rgba(0,200,83,0.08)')}
            >
              {downloading === `${report.id}-xlsx`
                ? <Loader2 size={14} className="animate-spin"/>
                : <FileSpreadsheet size={14}/>}
              Excel
            </button>
          ) : (
            <span className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-mono text-slate-600"
              style={{ border:'1px solid rgba(255,255,255,0.06)' }}>
              <FileSpreadsheet size={14}/> No Excel
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function ReportsHistory() {
  const navigate = useNavigate()
  const [reports,    setReports]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [downloading, setDownloading] = useState(null)  // "reportId-pdf" | "reportId-xlsx" | null

  // ── Fetch ────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports/my')
      setReports(res.data || [])
    } catch (err) {
      toast.error('Failed to load reports')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Download via signed URL ──────────────────────────────────
  const handleDownload = async (storagePath, ext, reportId) => {
    const key = `${reportId}-${ext}`
    setDownloading(key)
    try {
      // Backend returns { url, expires_in }
      const res = await api.get('/reports/download', {
        params: { path: storagePath }
      })
      const signedUrl = res.data?.url
      if (!signedUrl) {
        toast.error('Download link expired or unavailable — refresh the page and try again')
        return
      }

      // Trigger browser download via hidden anchor
      const a = document.createElement('a')
      a.href     = signedUrl
      a.download = `CompressorAI_Report_${new Date().toISOString().split('T')[0]}.${ext}`
      a.target   = '_blank'
      a.rel      = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      toast.success(`${ext.toUpperCase()} download started!`)
      load()  // refresh list — picks up newly saved report_pdf_path / report_excel_path
    } catch (err) {
      console.error('Download failed:', err)
      const status = err.response?.status
      if (status === 403) {
        toast.error('Access denied — this report does not belong to your account')
      } else if (status === 404) {
        toast.error('Report file not found — it may have been deleted from storage')
      } else {
        toast.error('Download failed — please try again')
      }
    } finally {
      setDownloading(null)
    }
  }

  // ── Summary stats ────────────────────────────────────────────
  const totalReports = reports.length
  const withPdf      = reports.filter(r => r.report_pdf_path).length
  const withExcel    = reports.filter(r => r.report_excel_path).length
  const avgSaving    = reports.length
    ? (reports.reduce((s, r) => s + (r.power_saving_percent || 0), 0) / reports.length)
    : 0

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"/>
        <p className="text-slate-400 font-mono text-sm">Loading reports...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-800 text-3xl text-white">My Reports</h1>
          <p className="text-slate-400 text-sm mt-1">
            Saved PDF & Excel reports from past analyses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-display font-600 text-slate-400 hover:text-white transition-all"
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
            <BarChart3 size={13}/> Dashboard
          </button>
          <button
            onClick={load}
            className="p-2.5 text-slate-400 hover:text-cyan-400 transition-colors rounded-xl hover:bg-cyan-400/10"
            title="Refresh">
            <RefreshCw size={16}/>
          </button>
        </div>
      </div>

      {/* ── Summary stats (only when there's data) ── */}
      {totalReports > 0 && (
        <motion.div
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Reports',  value: totalReports,          color: 'text-white'       },
            { label: 'With PDF',       value: withPdf,               color: 'text-cyan-400'    },
            { label: 'With Excel',     value: withExcel,             color: 'text-green-400'   },
            { label: 'Avg Saving',     value: `${avgSaving.toFixed(1)}%`, color: 'text-yellow-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center py-4"
              style={{ border:'1px solid rgba(255,255,255,0.06)' }}>
              <div className={`font-display font-800 text-2xl ${color}`}>{value}</div>
              <div className="text-slate-500 text-xs mt-1">{label}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Info banner: how reports are created ── */}
      <div className="flex items-start gap-3 p-4 rounded-xl"
        style={{ background:'rgba(250,204,21,0.04)', border:'1px solid rgba(250,204,21,0.12)' }}>
        <AlertCircle size={15} className="text-yellow-400 flex-shrink-0 mt-0.5"/>
        <p className="text-slate-400 text-sm leading-relaxed">
          Reports appear here after you run an analysis and click
          <span className="text-yellow-400 font-600"> PDF </span>or
          <span className="text-green-400 font-600"> Excel </span>
          on the results page. Each download is automatically saved to your account.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs text-yellow-400 hover:text-yellow-300 font-display font-600 transition-colors whitespace-nowrap flex items-center gap-1">
          Run Analysis <ChevronRight size={12}/>
        </button>
      </div>

      {/* ── Empty state ── */}
      <AnimatePresence>
        {totalReports === 0 && (
          <motion.div
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            className="card text-center py-20"
            style={{ border:'1px solid rgba(255,255,255,0.07)' }}>
            <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-white/8 flex items-center justify-center mx-auto mb-5">
              <FileText size={28} className="text-slate-600"/>
            </div>
            <h3 className="font-display font-700 text-white text-xl mb-2">No Reports Yet</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
              Run an analysis on any compressor unit, then download a PDF or Excel report — it will show up here.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-display font-700 text-sm text-primary-900 transition-all"
              style={{ background:'#facc15' }}
              onMouseEnter={e => e.currentTarget.style.background='#fde047'}
              onMouseLeave={e => e.currentTarget.style.background='#facc15'}>
              <BarChart3 size={14}/> Go to Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Report list ── */}
      {totalReports > 0 && (
        <div className="space-y-3">
          {reports.map((report, i) => (
            <ReportRow
              key={report.id}
              report={report}
              index={i}
              onDownload={handleDownload}
              downloading={downloading}
            />
          ))}
        </div>
      )}

    </div>
  )
}