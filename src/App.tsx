import { useState, useMemo } from 'react'

/* ==================== TYPES ==================== */
type QuestionType = 'multiple_choice'

interface Question {
  id: string
  text: string
  type: QuestionType
  options: string[]
  scores: number[]
  required: boolean
}

type LeadStatus = 'qualified' | 'unqualified' | 'pending'

interface Lead {
  id: string
  name: string
  phone: string
  email: string
  answers: Record<string, string>
  totalScore: number
  maxPossible: number
  status: LeadStatus
  createdAt: number // timestamp
  propertyInterest: string
}

interface CRMSettings {
  enabled: boolean
  type: 'hubspot' | 'zoho' | 'salesforce' | 'custom'
  apiKey: string
}

/* ==================== INITIAL DATA ==================== */
const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'Berapa budget Anda untuk properti?',
    type: 'multiple_choice',
    options: ['< 500 juta', '500 juta - 1 Miliar', '1 - 2 Miliar', '> 2 Miliar'],
    scores: [10, 25, 50, 100],
    required: true,
  },
  {
    id: 'q2',
    text: 'Kapan rencana Anda membeli properti?',
    type: 'multiple_choice',
    options: ['3 bulan', '6 bulan', '1 tahun', '> 1 tahun'],
    scores: [100, 60, 30, 10],
    required: true,
  },
  {
    id: 'q3',
    text: 'Apakah Anda sudah memiliki rumah/tanah?',
    type: 'multiple_choice',
    options: ['Ya, akan dijual', 'Ya, untuk investasi', 'Belum', 'Sedang cicil'],
    scores: [80, 60, 40, 50],
    required: true,
  },
  {
    id: 'q4',
    text: 'Sumber financing Anda?',
    type: 'multiple_choice',
    options: ['Cash', 'KPR', 'KPA', 'Still exploring'],
    scores: [100, 70, 65, 30],
    required: true,
  },
  {
    id: 'q5',
    text: 'Berapa penghasilan bulanan Anda?',
    type: 'multiple_choice',
    options: ['< 10 juta', '10 - 25 juta', '25 - 50 juta', '> 50 juta'],
    scores: [10, 30, 60, 100],
    required: true,
  },
]

const INITIAL_LEADS: Lead[] = [
  {
    id: 'l1',
    name: 'Budi Santoso',
    phone: '6281234567890',
    email: 'budi.santoso@email.com',
    answers: { q1: '1 - 2 Miliar', q2: '3 bulan', q3: 'Ya, akan dijual', q4: 'KPR', q5: '> 50 juta' },
    totalScore: 420,
    maxPossible: 500,
    status: 'qualified',
    createdAt: Date.now() - 86400000,
    propertyInterest: 'Cluster Gardenia',
  },
  {
    id: 'l2',
    name: 'Siti Rahayu',
    phone: '6289876543210',
    email: 'siti.rahayu@email.com',
    answers: { q1: '< 500 juta', q2: '> 1 tahun', q3: 'Belum', q4: 'Still exploring', q5: '< 10 juta' },
    totalScore: 100,
    maxPossible: 500,
    status: 'unqualified',
    createdAt: Date.now() - 172800000,
    propertyInterest: 'Apartemen Midwest',
  },
  {
    id: 'l3',
    name: 'Ahmad Wijaya',
    phone: '6285556667777',
    email: 'ahmad.wijaya@company.com',
    answers: { q1: '500 juta - 1 Miliar', q2: '6 bulan', q3: 'Ya, untuk investasi', q4: 'Cash', q5: '25 - 50 juta' },
    totalScore: 315,
    maxPossible: 500,
    status: 'qualified',
    createdAt: Date.now() - 3600000,
    propertyInterest: 'Villa Premium',
  },
  {
    id: 'l4',
    name: 'Dewi Lestari',
    phone: '6282223334444',
    email: 'dewi.lestari@gmail.com',
    answers: { q1: '1 - 2 Miliar', q2: '1 tahun', q3: 'Sedang cicil', q4: 'KPA', q5: '10 - 25 juta' },
    totalScore: 255,
    maxPossible: 500,
    status: 'pending',
    createdAt: Date.now() - 7200000,
    propertyInterest: 'Townhouse Elite',
  },
]

/* ==================== HELPERS ==================== */
function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

/* ==================== SUB-COMPONENTS ==================== */
const ScoreBar = ({ score, max = 500 }: { score: number; max?: number }) => {
  const pct = Math.min(100, Math.max(0, (score / max) * 100))
  let color = 'bg-red-400'
  if (pct >= 70) color = 'bg-green-500'
  else if (pct >= 40) color = 'bg-yellow-400'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={cx('h-full rounded-full transition-all duration-700', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-10 text-right">{score}</span>
    </div>
  )
}

const StatusBadge = ({ status }: { status: LeadStatus }) => {
  const styles: Record<LeadStatus, string> = {
    qualified: 'bg-green-100 text-green-700',
    unqualified: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
  }
  const labels: Record<LeadStatus, string> = { qualified: 'Qualified', unqualified: 'Unqualified', pending: 'Pending' }
  return <span className={cx('px-3 py-1 rounded-full text-xs font-medium', styles[status])}>{labels[status]}</span>
}

const ScoreChart = ({ leads }: { leads: Lead[] }) => {
  const counts = useMemo(() => {
    return {
      qualified: leads.filter((l) => l.status === 'qualified').length,
      pending: leads.filter((l) => l.status === 'pending').length,
      unqualified: leads.filter((l) => l.status === 'unqualified').length,
    }
  }, [leads])
  const maxVal = Math.max(counts.qualified + counts.pending + counts.unqualified, 1)

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-6">Lead Distribution</h3>
      <div className="flex items-end justify-around h-48 gap-4">
        {([
          { key: 'qualified' as const, color: 'bg-green-500', label: 'Qualified' },
          { key: 'pending' as const, color: 'bg-yellow-400', label: 'Pending' },
          { key: 'unqualified' as const, color: 'bg-red-400', label: 'Unqualified' },
        ]).map((item) => {
          const val = counts[item.key]
          const height = (val / maxVal) * 100
          return (
            <div key={item.key} className="flex flex-col items-center gap-2 flex-1">
              <span className="text-sm font-bold text-gray-700">{val}</span>
              <div className="w-full flex justify-center items-end h-32">
                <div className={cx('w-12 rounded-t-lg transition-all duration-700', item.color)} style={{ height: `${Math.max(height, 5)}%` }} />
              </div>
              <span className="text-xs font-medium text-gray-500">{item.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const StatCard = ({ icon, label, value, change }: { icon: string; label: string; value: string; change: string }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <span className="text-2xl">{icon}</span>
      <span className="text-green-600 text-xs font-bold">{change}</span>
    </div>
    <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    <p className="text-gray-500 text-sm mt-1">{label}</p>
  </div>
)

/* ==================== MAIN APP ==================== */
export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'questionnaire' | 'leads' | 'preview' | 'settings'>('dashboard')
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS)
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS)
  const [whatsappNumber, setWhatsappNumber] = useState('6281234567890')
  const [crm, setCrm] = useState<CRMSettings>({ enabled: false, type: 'hubspot', apiKey: '' })

  // Builder state
  const [showQModal, setShowQModal] = useState(false)
  const [editingQ, setEditingQ] = useState<Question | null>(null)
  const [qForm, setQForm] = useState<Partial<Question>>({
    text: '',
    options: ['', '', '', ''],
    scores: [0, 0, 0, 0],
    required: true,
  })

  // Preview state
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, string>>({})
  const [previewMeta, setPreviewMeta] = useState({ name: '', phone: '', email: '', property: '' })
  const [previewResult, setPreviewResult] = useState<{ score: number; status: LeadStatus; submitted: boolean } | null>(null)

  /* Analytics */
  const stats = useMemo(() => {
    const total = leads.length
    const qualified = leads.filter((l) => l.status === 'qualified').length
    return {
      total,
      qualified,
      conversionRate: total ? Math.round((qualified / total) * 100) : 0,
      avgScore: total ? Math.round(leads.reduce((a, b) => a + b.totalScore, 0) / total) : 0,
    }
  }, [leads])

  /* Actions */
  const computeScoreAndStatus = (answers: Record<string, string>) => {
    let total = 0
    let max = 0
    questions.forEach((q) => {
      const idx = q.options.indexOf(answers[q.id])
      if (idx !== -1) total += q.scores[idx]
      max += Math.max(...q.scores)
    })
    let status: LeadStatus = 'unqualified'
    const pct = max ? total / max : 0
    if (pct >= 0.7) status = 'qualified'
    else if (pct >= 0.4) status = 'pending'
    return { total, max, status }
  }

  const handleExport = () => {
    const header = ['Name', 'Email', 'Phone', 'Score', 'Status', 'Property Interest', 'Date'].join(',')
    const rows = leads
      .map((l) => [l.name, l.email, l.phone, l.totalScore, l.status, l.propertyInterest, formatDate(l.createdAt)].join(','))
      .join('\n')
    const csv = [header, rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'qualifly_leads.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const openQModal = (q?: Question) => {
    if (q) {
      setEditingQ(q)
      setQForm({ ...q })
    } else {
      setEditingQ(null)
      setQForm({ text: '', options: ['', '', '', ''], scores: [0, 0, 0, 0], required: true })
    }
    setShowQModal(true)
  }

  const saveQuestion = () => {
    if (!qForm.text || !qForm.options?.length) return
    const opts = (qForm.options || []).filter((o) => o.trim() !== '')
    if (!opts.length) return
    const payload: Question = {
      id: editingQ ? editingQ.id : Math.random().toString(36).slice(2, 9),
      text: qForm.text || '',
      type: 'multiple_choice',
      options: opts,
      scores: (qForm.scores || []).slice(0, opts.length),
      required: qForm.required ?? true,
    }
    if (editingQ) {
      setQuestions((prev) => prev.map((x) => (x.id === editingQ.id ? payload : x)))
    } else {
      setQuestions((prev) => [...prev, payload])
    }
    setShowQModal(false)
  }

  const deleteQuestion = (id: string) => {
    if (confirm('Hapus pertanyaan ini?')) setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  const handlePreviewSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!previewMeta.name || !previewMeta.phone) return alert('Nama dan WhatsApp wajib diisi')
    const missing = questions.filter((q) => q.required && !previewAnswers[q.id])
    if (missing.length) return alert('Mohon jawab semua pertanyaan wajib')
    const { total, max, status } = computeScoreAndStatus(previewAnswers)
    const newLead: Lead = {
      id: Math.random().toString(36).slice(2, 9),
      name: previewMeta.name,
      phone: previewMeta.phone,
      email: previewMeta.email,
      answers: { ...previewAnswers },
      totalScore: total,
      maxPossible: max,
      status,
      createdAt: Date.now(),
      propertyInterest: previewMeta.property || 'General Inquiry',
    }
    setLeads((prev) => [newLead, ...prev])
    setPreviewResult({ score: total, status, submitted: true })

    if (status === 'qualified') {
      const msg = `Halo! Saya ${previewMeta.name}, baru saja mengisi kuesioner QualiFly.\n\n✅ Score: ${total}/${max}\n🏠 Properti: ${previewMeta.property || 'General Inquiry'}\n📊 Status: ${status.toUpperCase()}\n\nSaya tertarik untuk diskusi lebih lanjut.`
      const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`
      setTimeout(() => window.open(waUrl, '_blank'), 1200)
    }
  }

  const resetPreview = () => {
    setPreviewAnswers({})
    setPreviewMeta({ name: '', phone: '', email: '', property: '' })
    setPreviewResult(null)
  }

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: '📊' },
    { id: 'questionnaire' as const, label: 'Questionnaire', icon: '📝' },
    { id: 'leads' as const, label: 'Leads', icon: '👥' },
    { id: 'preview' as const, label: 'Landing Preview', icon: '🎨' },
    { id: 'settings' as const, label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-800 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl">🦅</div>
            <div>
              <h1 className="font-bold text-lg leading-tight">QualiFly</h1>
              <p className="text-xs text-gray-500">AI Lead Qualifier</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all',
                activeTab === t.id ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <span className="text-lg">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-4 text-white">
            <p className="text-sm font-semibold mb-1">Pro Tip</p>
            <p className="text-xs opacity-90 mb-3">Pastikan semua pertanyaan wajib diisi agar skor akurat.</p>
            <button onClick={() => setActiveTab('settings')} className="w-full bg-white text-blue-700 text-xs py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              Open Settings
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-auto p-6 md:p-8">
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <header className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-gray-500">Overview performa lead qualification Anda</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard icon="👥" value={String(stats.total)} label="Total Leads" change="+12%" />
              <StatCard icon="✅" value={String(stats.qualified)} label="Qualified" change="+8%" />
              <StatCard icon="📈" value={`${stats.conversionRate}%`} label="Conversion Rate" change="+5%" />
              <StatCard icon="🎯" value={String(stats.avgScore)} label="Avg Score" change="+3%" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <ScoreChart leads={leads} />
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4">Recent Leads</h3>
                <div className="space-y-4">
                  {leads.slice(0, 5).map((l) => (
                    <div key={l.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{l.name}</p>
                        <p className="text-xs text-gray-500">{l.propertyInterest}</p>
                      </div>
                      <StatusBadge status={l.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">All Leads</h3>
                <button onClick={handleExport} className="text-sm text-blue-600 font-medium hover:underline">Export CSV</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 font-semibold">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Property</th>
                      <th className="px-6 py-4">Score</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l) => (
                      <tr key={l.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{l.name}</td>
                        <td className="px-6 py-4 text-gray-600">{l.propertyInterest}</td>
                        <td className="px-6 py-4">
                          <div className="w-32 md:w-40">
                            <ScoreBar score={l.totalScore} max={l.maxPossible || 500} />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={l.status} />
                        </td>
                        <td className="px-6 py-4 text-gray-500">{formatDate(l.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* QUESTIONNAIRE BUILDER */}
        {activeTab === 'questionnaire' && (
          <div>
            <header className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Questionnaire Builder</h2>
                <p className="text-gray-500">Atur pertanyaan dan bobot skor untuk kualifikasi lead</p>
              </div>
              <button onClick={() => openQModal()} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
                + Add Question
              </button>
            </header>

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">Q{idx + 1}</span>
                        {q.required && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded">Required</span>}
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-3">{q.text}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {q.options.map((opt, oidx) => (
                          <div key={opt} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-gray-700">{opt}</span>
                            <span className="text-blue-600 font-bold text-xs">{q.scores[oidx] ?? 0} pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openQModal(q)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200">✏️</button>
                      <button onClick={() => deleteQuestion(q.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200">🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUESTION MODAL */}
        {showQModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-lg">{editingQ ? 'Edit Question' : 'New Question'}</h3>
                <button onClick={() => setShowQModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question text</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={qForm.text || ''}
                    onChange={(e) => setQForm((f) => ({ ...f, text: e.target.value }))}
                    placeholder="Contoh: Berapa budget Anda?"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input id="req" type="checkbox" checked={!!qForm.required} onChange={(e) => setQForm((f) => ({ ...f, required: e.target.checked }))} />
                  <label htmlFor="req" className="text-sm text-gray-700 cursor-pointer">Wajib diisi (Required)</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Options & Bobot Skor</label>
                  <div className="space-y-2">
                    {(qForm.options || []).map((opt, i) => (
                      <div key={i} className="grid grid-cols-[1fr_auto] gap-2">
                        <input
                          type="text"
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          value={opt}
                          placeholder={`Option ${i + 1}`}
                          onChange={(e) => {
                            const newOpts = [...(qForm.options || [])]
                            newOpts[i] = e.target.value
                            setQForm((f) => ({ ...f, options: newOpts }))
                          }}
                        />
                        <input
                          type="number"
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24"
                          value={qForm.scores?.[i] ?? 0}
                          onChange={(e) => {
                            const newScores = [...(qForm.scores || [])]
                            newScores[i] = parseInt(e.target.value || '0')
                            setQForm((f) => ({ ...f, scores: newScores }))
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setQForm((f) => ({ ...f, options: [...(f.options || []), ''], scores: [...(f.scores || []), 0] }))}
                    className="mt-2 text-sm text-blue-600 font-medium"
                  >
                    + Tambah option
                  </button>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
                <button onClick={() => setShowQModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Cancel</button>
                <button onClick={saveQuestion} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Save Question</button>
              </div>
            </div>
          </div>
        )}

        {/* LEADS LIST */}
        {activeTab === 'leads' && (
          <div>
            <header className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Lead Management</h2>
                <p className="text-gray-500">Kelola, filter, dan export data lead Anda</p>
              </div>
              <button onClick={handleExport} className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm">📥 Export CSV</button>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 font-semibold">
                    <tr>
                      <th className="px-6 py-4">Lead Name</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4">Property</th>
                      <th className="px-6 py-4">Score</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l) => (
                      <tr key={l.id} className="border-t hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{l.name}</div>
                          <div className="text-xs text-gray-500">{l.email}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{l.phone}</td>
                        <td className="px-6 py-4 text-gray-700">{l.propertyInterest}</td>
                        <td className="px-6 py-4">
                          <div className="w-32 md:w-40">
                            <ScoreBar score={l.totalScore} max={l.maxPossible || 500} />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={l.status} />
                        </td>
                        <td className="px-6 py-4 text-gray-500">{formatDate(l.createdAt)}</td>
                        <td className="px-6 py-4">
                          <a href={`https://wa.me/${l.phone}`} target="_blank" rel="noreferrer" className="text-green-600 hover:underline text-sm font-medium">WhatsApp</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* LANDING PREVIEW */}
        {activeTab === 'preview' && (
          <div className="max-w-2xl mx-auto">
            <header className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900">Landing Page Preview</h2>
              <p className="text-gray-500">Ini yang akan dilihat calon lead Anda</p>
            </header>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-8 text-center text-white">
                <h1 className="text-3xl font-bold mb-2">Temukan Properti Impian Anda</h1>
                <p className="opacity-90">Isi kuesioner singkat di bawah dan kami akan membantu Anda menemukan properti terbaik sesuai budget.</p>
              </div>

              {!previewResult ? (
                <form onSubmit={handlePreviewSubmit} className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                      <input
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        value={previewMeta.name}
                        onChange={(e) => setPreviewMeta((m) => ({ ...m, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp *</label>
                      <input
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="628xxxxxxxxxx"
                        value={previewMeta.phone}
                        onChange={(e) => setPreviewMeta((m) => ({ ...m, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        value={previewMeta.email}
                        onChange={(e) => setPreviewMeta((m) => ({ ...m, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Properti yang Diminati</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        value={previewMeta.property}
                        onChange={(e) => setPreviewMeta((m) => ({ ...m, property: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {questions.map((q, idx) => (
                      <div key={q.id}>
                        <label className="block text-sm font-medium text-gray-800 mb-2">
                          Q{idx + 1}. {q.text}
                          {q.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt) => (
                            <label
                              key={opt}
                              className={cx(
                                'flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer transition-all',
                                previewAnswers[q.id] === opt ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300 bg-white'
                              )}
                            >
                              <input
                                type="radio"
                                name={q.id}
                                value={opt}
                                checked={previewAnswers[q.id] === opt}
                                onChange={() => setPreviewAnswers((a) => ({ ...a, [q.id]: opt }))}
                                className="text-blue-600"
                              />
                              <span className="text-sm text-gray-700">{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-lg shadow hover:shadow-lg transition-all"
                  >
                    Submit & Check Eligibility
                  </button>
                </form>
              ) : (
                <div className="p-8 text-center">
                  <div
                    className={cx(
                      'inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 text-3xl',
                      previewResult.status === 'qualified' ? 'bg-green-100 text-green-600' : previewResult.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                    )}
                  >
                    {previewResult.status === 'qualified' ? '🎉' : previewResult.status === 'pending' ? '⏳' : '👋'}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Skor Anda: {previewResult.score}</h3>
                  <p className="text-gray-500 mb-6">
                    Status: <span className="font-bold capitalize">{previewResult.status}</span>
                  </p>

                  {previewResult.status === 'qualified' && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-green-800 text-sm">
                      🎉 Selamat! Anda lolos kualifikasi. Kami mengarahkan Anda ke WhatsApp admin...
                    </div>
                  )}

                  <button onClick={resetPreview} className="text-blue-600 font-medium hover:underline text-sm">← Isi ulang form</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS / CRM */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl">
            <header className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Settings & Integrations</h2>
              <p className="text-gray-500">Atur WhatsApp redirect dan koneksi CRM</p>
            </header>

            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4">📱 WhatsApp Configuration</h3>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp Admin (kode negara)</label>
                <input
                  className="w-full md:w-1/2 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="6281234567890"
                />
                <p className="text-xs text-gray-500 mt-2">Lead qualified akan otomatis diarahkan ke WhatsApp ini.</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800">🔌 CRM Integration</h3>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={crm.enabled}
                      onChange={(e) => setCrm((c) => ({ ...c, enabled: e.target.checked }))}
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">{crm.enabled ? 'On' : 'Off'}</span>
                  </label>
                </div>

                {crm.enabled && (
                  <div className="space-y-4 mt-4 border-t border-gray-100 pt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CRM Type</label>
                      <select
                        className="w-full md:w-1/2 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        value={crm.type}
                        onChange={(e) => setCrm((c) => ({ ...c, type: e.target.value as CRMSettings['type'] }))}
                      >
                        <option value="hubspot">HubSpot</option>
                        <option value="zoho">Zoho CRM</option>
                        <option value="salesforce">Salesforce</option>
                        <option value="custom">Custom Webhook</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">API Key / Webhook URL</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        value={crm.apiKey}
                        onChange={(e) => setCrm((c) => ({ ...c, apiKey: e.target.value }))}
                        placeholder={crm.type === 'custom' ? 'https://your-api.com/webhook' : 'API Key'}
                      />
                    </div>
                    <button onClick={() => alert('CRM settings saved!')} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
                      Save Integration
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
