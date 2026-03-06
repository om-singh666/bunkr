import { useState } from 'react'
import { BookOpen, ChevronRight, AlertCircle, Plus, Minus, Calendar } from 'lucide-react'
import FuzzyText from './FuzzyText'
import SpotlightCard from './SpotlightCard'
import './Onboarding.css'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri' }

const STEPS = ['welcome', 'attendance', 'timetable']

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState('welcome')
  const [totalClasses, setTotalClasses] = useState('')
  const [presentClasses, setPresentClasses] = useState('')
  const [error, setError] = useState('')

  // Timetable: { Monday: ['Math', 'Physics', 'DSA'], ... }
  const [timetable, setTimetable] = useState(() => {
    const init = {}
    DAYS.forEach(day => { init[day] = ['', '', ''] }) // default 3 per day
    return init
  })

  // Attendance live validation
  const totalVal = parseInt(totalClasses) || 0
  const presentVal = parseInt(presentClasses)
  const attendanceInputError =
    totalClasses && presentClasses !== '' && !isNaN(presentVal)
      ? presentVal < 0
        ? 'Attended cannot be negative'
        : presentVal > totalVal
        ? `Attended (${presentVal}) cannot exceed total (${totalVal})`
        : null
      : null

  const currentPct =
    totalClasses && presentClasses !== '' && !isNaN(presentVal) &&
    totalVal > 0 && presentVal >= 0 && presentVal <= totalVal
      ? ((presentVal / totalVal) * 100).toFixed(1)
      : null

  const handleAttendanceContinue = () => {
    const t = parseInt(totalClasses)
    const p = parseInt(presentClasses)
    if (!t || t <= 0) { setError('Enter total classes conducted'); return }
    if (isNaN(p) || p < 0) { setError('Enter how many classes you attended'); return }
    if (p > t) { setError(`Attended (${p}) cannot exceed total (${t})`); return }
    setError('')
    setStep('timetable')
  }

  // Timetable helpers
  const setSubjectName = (day, idx, value) => {
    setTimetable(prev => {
      const updated = [...prev[day]]
      updated[idx] = value
      return { ...prev, [day]: updated }
    })
  }
  const addLecture = (day) => {
    setTimetable(prev => ({ ...prev, [day]: [...prev[day], ''] }))
  }
  const removeLecture = (day) => {
    setTimetable(prev => {
      if (prev[day].length <= 0) return prev
      const updated = [...prev[day]]
      updated.pop()
      return { ...prev, [day]: updated }
    })
  }

  const handleComplete = () => {
    const hasAnyClass = DAYS.some(d => timetable[d].length > 0)
    if (!hasAnyClass) { setError('Add at least 1 class to any day'); return }
    setError('')

    // Build the timetable structure expected by Dashboard
    const days = DAYS.filter(d => timetable[d].length > 0)
    const structured = {}
    days.forEach(day => {
      structured[day] = timetable[day].map((name, i) => ({
        subject: name.trim() || `Lecture ${i + 1}`,
        time: '',
        room: '',
      }))
    })

    onComplete({
      totalClasses: parseInt(totalClasses),
      presentClasses: parseInt(presentClasses),
      timetable: { days, timetable: structured },
    })
  }

  return (
    <div className="onboarding">
      <div className="ob-container">
        {/* Brand — small header on steps 2+ */}
        {step !== 'welcome' && (
          <div className="ob-brand ob-brand-sm">
            <div className="ob-logo">
              <span className="ob-logo-b">B</span>
            </div>
            <span className="ob-logo-name">BUNKR</span>
          </div>
        )}

        {/* Progress dots */}
        {step !== 'welcome' && (
          <div className="ob-progress">
            {['attendance', 'timetable'].map((s, i) => (
              <div
                key={s}
                className={`ob-dot ${STEPS.indexOf(step) > i + 1 ? 'done' : ''} ${step === s ? 'active' : ''}`}
              />
            ))}
          </div>
        )}

        {/* ——— WELCOME ——— */}
        {step === 'welcome' && (
          <>
            {/* Fuzzy Text hero — ABOVE the card */}
            <div className="fuzzy-hero">
              <FuzzyText
                baseIntensity={0.08}
                hoverIntensity={0.3}
                enableHover={true}
                color="#f83a3a"
                fontSize={100}
                fontWeight={900}
                direction="horizontal"
                fuzzRange={20}
              >
                BUNKR
              </FuzzyText>
            </div>

            <SpotlightCard className="ob-card animate-in" spotlightColor="rgba(248, 58, 58, 0.15)">
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
                <div className="ob-feature-icon">📅</div>
                <div>
                  <div className="ob-feature-title">Day-wise Planner</div>
                  <div className="ob-feature-desc">Set your Mon–Fri schedule in 30 seconds</div>
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
            <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep('attendance')}>
              Get Started <ChevronRight size={18} />
            </button>
            </SpotlightCard>
          </>
        )}

        {/* ——— ATTENDANCE ——— */}
        {step === 'attendance' && (
          <SpotlightCard className="ob-card animate-in" spotlightColor="rgba(248, 58, 58, 0.12)">
            <div className="ob-step-icon">
              <BookOpen size={22} />
            </div>
            <h2 className="ob-card-title">Current Attendance</h2>
            <p className="ob-card-desc">
              Enter your overall attendance from your college portal right now.
            </p>
            <div className="ob-two-col">
              <div className="input-group">
                <label className="input-label">Total Classes Conducted</label>
                <input
                  id="total-classes-input"
                  type="number"
                  className="input-field"
                  placeholder="e.g. 151"
                  min="1"
                  value={totalClasses}
                  onChange={e => { setTotalClasses(e.target.value); setError('') }}
                />
                <span className="input-hint">All classes held so far</span>
              </div>
              <div className="input-group">
                <label className="input-label">Classes You Attended</label>
                <input
                  id="attended-classes-input"
                  type="number"
                  className="input-field"
                  placeholder="e.g. 120"
                  min="0"
                  value={presentClasses}
                  onChange={e => { setPresentClasses(e.target.value); setError('') }}
                />
                <span className="input-hint">Must be ≤ total</span>
              </div>
            </div>

            {attendanceInputError && (
              <div className="ob-error"><AlertCircle size={14} />{attendanceInputError}</div>
            )}
            {currentPct && !attendanceInputError && (
              <div className="ob-attendance-preview">
                <div className="ob-att-label">Your Current Attendance</div>
                <div className={`ob-att-value ${parseFloat(currentPct) < 75 ? 'danger' : parseFloat(currentPct) < 80 ? 'warning' : 'good'}`}>
                  {currentPct}%
                </div>
                <div className="ob-att-fraction">{presentVal} out of {totalVal} classes</div>
                {parseFloat(currentPct) < 75 && (
                  <div className="ob-att-warn">⚠️ Below 75% — you're in danger zone!</div>
                )}
                {parseFloat(currentPct) >= 75 && parseFloat(currentPct) < 80 && (
                  <div className="ob-att-warn-ok">🟡 Borderline — bunk carefully</div>
                )}
              </div>
            )}
            {error && !attendanceInputError && <div className="ob-error"><AlertCircle size={14} />{error}</div>}
            <div className="ob-actions">
              <button className="btn btn-ghost" onClick={() => setStep('welcome')}>Back</button>
              <button className="btn btn-primary" onClick={handleAttendanceContinue}>
                Continue <ChevronRight size={16} />
              </button>
            </div>
          </SpotlightCard>
        )}

        {/* ——— TIMETABLE ——— */}
        {step === 'timetable' && (
          <SpotlightCard className="ob-card animate-in ob-card-wide" spotlightColor="rgba(248, 58, 58, 0.12)">
            <div className="ob-step-icon">
              <Calendar size={22} />
            </div>
            <h2 className="ob-card-title">Set Your Timetable</h2>
            <p className="ob-card-desc">
              Enter your classes for each day. You can name them or leave blank — we'll auto-label them.
            </p>

            <div className="tt-days">
              {DAYS.map(day => (
                <div key={day} className="tt-day-row">
                  <div className="tt-day-header">
                    <span className="tt-day-name">{DAY_SHORT[day]}</span>
                    <div className="tt-day-controls">
                      <button
                        className="tt-count-btn"
                        onClick={() => removeLecture(day)}
                        disabled={timetable[day].length === 0}
                        title="Remove a lecture"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="tt-count">{timetable[day].length}</span>
                      <button
                        className="tt-count-btn"
                        onClick={() => addLecture(day)}
                        disabled={timetable[day].length >= 10}
                        title="Add a lecture"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                  {timetable[day].length > 0 && (
                    <div className="tt-subjects">
                      {timetable[day].map((name, i) => (
                        <input
                          key={i}
                          type="text"
                          className="input-field tt-subject-input"
                          placeholder={`Lecture ${i + 1}`}
                          value={name}
                          onChange={e => setSubjectName(day, i, e.target.value)}
                          maxLength={30}
                        />
                      ))}
                    </div>
                  )}
                  {timetable[day].length === 0 && (
                    <div className="tt-empty-day">No class — holiday / free day</div>
                  )}
                </div>
              ))}
            </div>

            {error && <div className="ob-error"><AlertCircle size={14} />{error}</div>}
            <div className="ob-actions">
              <button className="btn btn-ghost" onClick={() => setStep('attendance')}>Back</button>
              <button className="btn btn-primary" onClick={handleComplete} id="finish-setup-btn">
                Start Tracking <ChevronRight size={16} />
              </button>
            </div>
          </SpotlightCard>
        )}
      </div>
    </div>
  )
}
