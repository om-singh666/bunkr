import { useState, useRef } from 'react'
import { Upload, Key, BookOpen, ChevronRight, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { parseTimetableImage } from '../utils/gemini'
import './Onboarding.css'

const STEPS = ['welcome', 'apikey', 'attendance', 'timetable']

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState('welcome')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('bunkr_api_key') || '')
  const [showKey, setShowKey] = useState(false)
  const [totalClasses, setTotalClasses] = useState('')
  const [presentClasses, setPresentClasses] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  const stepIndex = STEPS.indexOf(step)

  const handleApiKeyContinue = () => {
    if (!apiKey.trim()) { setError('Please enter your Gemini API key'); return }
    setError('')
    localStorage.setItem('bunkr_api_key', apiKey.trim())
    setStep('attendance')
  }

  const handleAttendanceContinue = () => {
    const total = parseInt(totalClasses)
    const present = parseInt(presentClasses)
    if (!total || total <= 0) { setError('Enter valid total classes'); return }
    if (present < 0 || present > total) { setError('Present classes must be between 0 and total'); return }
    setError('')
    setStep('timetable')
  }

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please upload a valid image file')
      return
    }
    setError('')
    setImageFile(file)
    const url = URL.createObjectURL(file)
    setImagePreview(url)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  const handleTimetableParse = async () => {
    if (!imageFile) { setError('Please upload a timetable image'); return }
    setError('')
    setLoading(true)
    try {
      const timetableData = await parseTimetableImage(imageFile, apiKey.trim())
      onComplete({
        apiKey: apiKey.trim(),
        totalClasses: parseInt(totalClasses),
        presentClasses: parseInt(presentClasses),
        timetable: timetableData,
      })
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to parse timetable. Check your API key and image.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkipTimetable = () => {
    const defaultTimetable = {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      timetable: {
        Monday: [
          { subject: 'Lecture 1', time: '', room: '' },
          { subject: 'Lecture 2', time: '', room: '' },
          { subject: 'Lecture 3', time: '', room: '' },
        ],
        Tuesday: [
          { subject: 'Lecture 1', time: '', room: '' },
          { subject: 'Lecture 2', time: '', room: '' },
        ],
        Wednesday: [
          { subject: 'Lecture 1', time: '', room: '' },
          { subject: 'Lecture 2', time: '', room: '' },
          { subject: 'Lecture 3', time: '', room: '' },
        ],
        Thursday: [
          { subject: 'Lecture 1', time: '', room: '' },
          { subject: 'Lecture 2', time: '', room: '' },
        ],
        Friday: [
          { subject: 'Lecture 1', time: '', room: '' },
          { subject: 'Lecture 2', time: '', room: '' },
          { subject: 'Lecture 3', time: '', room: '' },
        ],
      },
    }
    onComplete({
      apiKey: apiKey.trim(),
      totalClasses: parseInt(totalClasses),
      presentClasses: parseInt(presentClasses),
      timetable: defaultTimetable,
    })
  }

  // Calculate current attendance for preview
  const currentPct = totalClasses && presentClasses !== ''
    ? ((parseInt(presentClasses) / parseInt(totalClasses)) * 100).toFixed(1)
    : null

  return (
    <div className="onboarding">
      {/* Animated background */}
      <div className="ob-bg">
        <div className="ob-glow ob-glow-1" />
        <div className="ob-glow ob-glow-2" />
      </div>

      <div className="ob-container">
        {/* Logo / Brand */}
        <div className={`ob-brand ${step !== 'welcome' ? 'ob-brand-sm' : ''}`}>
          <div className="ob-logo">
            <span className="ob-logo-b">B</span>
          </div>
          {step !== 'welcome' && (
            <span className="ob-logo-name">BUNKR</span>
          )}
        </div>

        {/* Step progress */}
        {step !== 'welcome' && (
          <div className="ob-progress">
            {['apikey', 'attendance', 'timetable'].map((s, i) => (
              <div key={s} className={`ob-dot ${STEPS.indexOf(step) > i + 1 ? 'done' : ''} ${step === s ? 'active' : ''}`} />
            ))}
          </div>
        )}

        {/* ——— WELCOME ——— */}
        {step === 'welcome' && (
          <div className="ob-card animate-in">
            <h1 className="ob-title">
              Welcome to <span className="text-red">BUNKR</span>
            </h1>
            <p className="ob-subtitle">
              The smart attendance tracker built for engineers who know when to grind — and when to bunk.
            </p>
            <div className="ob-features">
              <div className="ob-feature">
                <div className="ob-feature-icon">📊</div>
                <div>
                  <div className="ob-feature-title">Real-time Calculations</div>
                  <div className="ob-feature-desc">See attendance impact instantly as you toggle classes</div>
                </div>
              </div>
              <div className="ob-feature">
                <div className="ob-feature-icon">🤖</div>
                <div>
                  <div className="ob-feature-title">AI Timetable Parsing</div>
                  <div className="ob-feature-desc">Upload your college timetable image — we extract everything</div>
                </div>
              </div>
              <div className="ob-feature">
                <div className="ob-feature-icon">⚠️</div>
                <div>
                  <div className="ob-feature-title">75% Rule Guardian</div>
                  <div className="ob-feature-desc">Never accidentally slip below the attendance threshold</div>
                </div>
              </div>
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep('apikey')}>
              Get Started <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ——— API KEY ——— */}
        {step === 'apikey' && (
          <div className="ob-card animate-in">
            <div className="ob-step-icon">
              <Key size={22} />
            </div>
            <h2 className="ob-card-title">Gemini API Key</h2>
            <p className="ob-card-desc">
              We use Google Gemini to intelligently parse your timetable from an image. Your key is stored only in your browser — never on any server.
            </p>
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label className="input-label">API Key</label>
              <div className="input-wrap">
                <input
                  id="api-key-input"
                  type={showKey ? 'text' : 'password'}
                  className="input-field"
                  placeholder="AIza..."
                  value={apiKey}
                  onChange={e => { setApiKey(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleApiKeyContinue()}
                />
                <button className="input-toggle" onClick={() => setShowKey(!showKey)} tabIndex={-1}>
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="ob-link"
            >
              Get a free key from Google AI Studio →
            </a>
            {error && <div className="ob-error"><AlertCircle size={14} />{error}</div>}
            <div className="ob-actions">
              <button className="btn btn-ghost" onClick={() => setStep('welcome')}>Back</button>
              <button className="btn btn-primary" onClick={handleApiKeyContinue}>Continue <ChevronRight size={16} /></button>
            </div>
          </div>
        )}

        {/* ——— ATTENDANCE ——— */}
        {step === 'attendance' && (
          <div className="ob-card animate-in">
            <div className="ob-step-icon">
              <BookOpen size={22} />
            </div>
            <h2 className="ob-card-title">Current Attendance</h2>
            <p className="ob-card-desc">
              Enter your overall attendance from your college portal right now.
            </p>
            <div className="ob-two-col">
              <div className="input-group">
                <label className="input-label">Total Classes Held</label>
                <input
                  id="total-classes-input"
                  type="number"
                  className="input-field"
                  placeholder="e.g. 120"
                  min="1"
                  value={totalClasses}
                  onChange={e => { setTotalClasses(e.target.value); setError('') }}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Classes Attended</label>
                <input
                  id="attended-classes-input"
                  type="number"
                  className="input-field"
                  placeholder="e.g. 95"
                  min="0"
                  value={presentClasses}
                  onChange={e => { setPresentClasses(e.target.value); setError('') }}
                />
              </div>
            </div>
            {currentPct && (
              <div className="ob-attendance-preview">
                <div className="ob-att-label">Current Attendance</div>
                <div className={`ob-att-value ${parseFloat(currentPct) < 75 ? 'danger' : parseFloat(currentPct) < 80 ? 'warning' : 'good'}`}>
                  {currentPct}%
                </div>
                {parseFloat(currentPct) < 75 && (
                  <div className="ob-att-warn">⚠️ Below 75% — you're in danger zone!</div>
                )}
              </div>
            )}
            {error && <div className="ob-error"><AlertCircle size={14} />{error}</div>}
            <div className="ob-actions">
              <button className="btn btn-ghost" onClick={() => setStep('apikey')}>Back</button>
              <button className="btn btn-primary" onClick={handleAttendanceContinue}>Continue <ChevronRight size={16} /></button>
            </div>
          </div>
        )}

        {/* ——— TIMETABLE ——— */}
        {step === 'timetable' && (
          <div className="ob-card animate-in">
            <div className="ob-step-icon">
              <Upload size={22} />
            </div>
            <h2 className="ob-card-title">Upload Timetable</h2>
            <p className="ob-card-desc">
              Upload a screenshot or photo of your college timetable. Gemini AI will extract your schedule automatically.
            </p>

            <div
              className={`ob-dropzone ${dragOver ? 'drag-over' : ''} ${imagePreview ? 'has-image' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])}
                id="timetable-upload"
              />
              {imagePreview ? (
                <div className="ob-preview">
                  <img src={imagePreview} alt="Timetable preview" />
                  <div className="ob-preview-overlay">
                    <span>Click to change</span>
                  </div>
                </div>
              ) : (
                <div className="ob-drop-content">
                  <div className="ob-drop-icon">
                    <Upload size={28} />
                  </div>
                  <div className="ob-drop-title">Drop your timetable here</div>
                  <div className="ob-drop-desc">or click to browse · PNG, JPG, WEBP</div>
                </div>
              )}
            </div>

            {error && <div className="ob-error"><AlertCircle size={14} />{error}</div>}

            <div className="ob-actions">
              <button className="btn btn-ghost" onClick={() => setStep('attendance')}>Back</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={handleSkipTimetable} disabled={loading}>
                  Skip →
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleTimetableParse}
                  disabled={loading || !imageFile}
                  id="parse-timetable-btn"
                >
                  {loading ? (
                    <><div className="spinner" />&nbsp;Analyzing...</>
                  ) : (
                    <>Analyze & Start <ChevronRight size={16} /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
