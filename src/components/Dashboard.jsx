import { useState, useRef, useEffect } from 'react'
import {
  RotateCcw, ChevronLeft, ChevronRight, CheckSquare,
  Square, AlertTriangle, TrendingUp, TrendingDown,
  BookOpen, Settings, X, Check
} from 'lucide-react'
import './Dashboard.css'

const DAY_SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' }

// Calculates how many bunks possible while staying above `threshold`
function calcBunksAllowed(present, total, threshold = 75) {
  // present / (total + extra) >= threshold/100
  // We need present / total >= threshold/100 i.e. we can bunk if current is above threshold
  // bunks_possible = floor((present - threshold/100 * total) / (threshold/100))
  // But we also account for future (today's) classes not yet added
  const needed = Math.ceil((threshold / 100) * total)
  const excess = present - needed
  if (excess < 0) return 0
  // Each bunk adds 1 to total without adding to present
  // present / (total + bunks) >= threshold/100
  // bunks <= (present * 100 / threshold) - total
  return Math.max(0, Math.floor((present * 100) / threshold - total))
}

export default function Dashboard({ userData, onReset, onUpdateAttendance }) {
  const { timetable, totalClasses: initTotal, presentClasses: initPresent } = userData
  const days = timetable.days || []

  // Today detection
  const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]
  const todayIdx = days.includes(todayName) ? days.indexOf(todayName) : 0
  const [activeDayIdx, setActiveDayIdx] = useState(todayIdx)
  const [slideDir, setSlideDir] = useState('right')

  // Per-day selected classes (default: all selected)
  const [selected, setSelected] = useState(() => {
    const init = {}
    days.forEach(day => {
      const classes = timetable.timetable[day] || []
      init[day] = classes.map((_, i) => i)
    })
    return init
  })

  // Attendance tracking
  const [totalClasses, setTotalClasses] = useState(initTotal)
  const [presentClasses, setPresentClasses] = useState(initPresent)

  // Edit attendance modal
  const [showEdit, setShowEdit] = useState(false)
  const [editTotal, setEditTotal] = useState(String(initTotal))
  const [editPresent, setEditPresent] = useState(String(initPresent))

  const activeDay = days[activeDayIdx] || ''
  const todayClasses = timetable.timetable[activeDay] || []
  const selectedForDay = selected[activeDay] || []

  // Compute projected attendance for active day with current selection
  const todayTotal = todayClasses.length
  const todayPresent = selectedForDay.length
  const projectedTotal = totalClasses + todayTotal
  const projectedPresent = presentClasses + todayPresent
  const projectedPct = projectedTotal > 0 ? (projectedPresent / projectedTotal) * 100 : 0
  const currentPct = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0
  const bunksAllowed = calcBunksAllowed(presentClasses, totalClasses)
  const classesNeeded = Math.max(0, Math.ceil(0.75 * totalClasses - presentClasses))

  const navigateDay = (dir) => {
    setSlideDir(dir === 1 ? 'right' : 'left')
    setActiveDayIdx(prev => Math.max(0, Math.min(days.length - 1, prev + dir)))
  }

  const toggleClass = (idx) => {
    setSelected(prev => {
      const current = prev[activeDay] || []
      const updated = current.includes(idx)
        ? current.filter(i => i !== idx)
        : [...current, idx]
      return { ...prev, [activeDay]: updated }
    })
  }

  const selectAll = () => {
    setSelected(prev => ({ ...prev, [activeDay]: todayClasses.map((_, i) => i) }))
  }

  const deselectAll = () => {
    setSelected(prev => ({ ...prev, [activeDay]: [] }))
  }

  const saveEdit = () => {
    const t = parseInt(editTotal)
    const p = parseInt(editPresent)
    if (!t || t <= 0 || p < 0 || p > t) return
    setTotalClasses(t)
    setPresentClasses(p)
    onUpdateAttendance(t, p)
    setShowEdit(false)
  }

  const pctColor = (pct) => {
    if (pct >= 85) return '#4caf50'
    if (pct >= 75) return '#ff9800'
    return '#e53935'
  }

  return (
    <div className="dashboard">
      {/* Sidebar glow */}
      <div className="dash-glow" />

      {/* Header */}
      <header className="dash-header">
        <div className="dash-header-inner">
          <div className="dash-brand">
            <div className="dash-logo">B</div>
            <span className="dash-brand-name">BUNKR</span>
          </div>
          <div className="dash-header-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setShowEdit(true)} id="edit-attendance-btn">
              <Settings size={14} /> Update
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onReset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>
      </header>

      <div className="dash-body">
        {/* ——— STATS SECTION ——— */}
        <section className="dash-stats">
          {/* Main ring */}
          <div className="dash-main-stat">
            <div className="stat-ring-wrap">
              <AttendanceRing pct={currentPct} color={pctColor(currentPct)} size={140} />
              <div className="stat-ring-center">
                <div className="stat-ring-value" style={{ color: pctColor(currentPct) }}>
                  {currentPct.toFixed(1)}%
                </div>
                <div className="stat-ring-label">Current</div>
              </div>
            </div>
            <div className="stat-main-info">
              <div className="stat-main-title">Overall Attendance</div>
              <div className="stat-main-sub">{presentClasses} of {totalClasses} classes attended</div>
              {currentPct < 75 && (
                <div className="dash-alert danger">
                  <AlertTriangle size={14} />
                  Need {classesNeeded} more class{classesNeeded !== 1 ? 'es' : ''} to reach 75%
                </div>
              )}
              {currentPct >= 75 && (
                <div className="dash-alert success">
                  <Check size={14} />
                  You can bunk up to <strong>{bunksAllowed}</strong> more class{bunksAllowed !== 1 ? 'es' : ''}
                </div>
              )}
            </div>
          </div>

          {/* Projected for today */}
          <div className="dash-projected">
            <div className="proj-header">
              <span className="proj-title">After Today</span>
              <span className="badge badge-red">{activeDay}</span>
            </div>
            <div className="proj-grid">
              <div className="proj-card">
                <div className="proj-card-label">Projected %</div>
                <div className="proj-card-value" style={{ color: pctColor(projectedPct) }}>
                  {projectedPct.toFixed(1)}%
                </div>
              </div>
              <div className="proj-card">
                <div className="proj-card-label">Attending</div>
                <div className="proj-card-value">{todayPresent}/{todayTotal}</div>
              </div>
              <div className="proj-card">
                <div className="proj-card-label">Delta</div>
                <div className={`proj-card-value ${projectedPct >= currentPct ? 'up' : 'down'}`}>
                  {projectedPct >= currentPct ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  {Math.abs(projectedPct - currentPct).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="proj-bars">
              <div className="proj-bar-row">
                <span>Current</span>
                <div className="progress-bar-track" style={{ flex: 1, margin: '0 10px' }}>
                  <div className="progress-bar-fill" style={{ width: `${Math.min(100, currentPct)}%`, background: pctColor(currentPct) }} />
                </div>
                <span>{currentPct.toFixed(1)}%</span>
              </div>
              <div className="proj-bar-row">
                <span>Projected</span>
                <div className="progress-bar-track" style={{ flex: 1, margin: '0 10px' }}>
                  <div className="progress-bar-fill" style={{ width: `${Math.min(100, projectedPct)}%`, background: pctColor(projectedPct), transition: 'width 0.4s ease' }} />
                </div>
                <span>{projectedPct.toFixed(1)}%</span>
              </div>
              {/* 75% marker */}
              <div className="proj-threshold-label">
                <span>75% min</span>
                <div className="proj-threshold-line" />
              </div>
            </div>

            {projectedPct < 75 && (
              <div className="dash-alert danger" style={{ marginTop: 12 }}>
                <AlertTriangle size={14} />
                Attending this selection drops you below 75%!
              </div>
            )}
          </div>
        </section>

        {/* ——— DAY SELECTOR ——— */}
        <section className="dash-day-section">
          <div className="day-nav">
            <button
              className="btn btn-ghost btn-sm day-nav-btn"
              onClick={() => navigateDay(-1)}
              disabled={activeDayIdx === 0}
              id="prev-day-btn"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="day-tabs">
              {days.map((day, i) => (
                <button
                  key={day}
                  className={`day-tab ${i === activeDayIdx ? 'active' : ''} ${day === todayName ? 'today' : ''}`}
                  onClick={() => { setSlideDir(i > activeDayIdx ? 'right' : 'left'); setActiveDayIdx(i) }}
                  id={`day-tab-${day.toLowerCase()}`}
                >
                  {DAY_SHORT[day] || day.slice(0, 3)}
                  {day === todayName && <span className="today-dot" />}
                </button>
              ))}
            </div>

            <button
              className="btn btn-ghost btn-sm day-nav-btn"
              onClick={() => navigateDay(1)}
              disabled={activeDayIdx === days.length - 1}
              id="next-day-btn"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day header */}
          <div className="day-header">
            <div>
              <h2 className="day-title">
                {activeDay}
                {activeDay === todayName && <span className="badge badge-red" style={{ marginLeft: 10, fontSize: 11 }}>TODAY</span>}
              </h2>
              <p className="day-sub">{todayClasses.length} classes scheduled</p>
            </div>
            <div className="day-bulk-actions">
              <button className="btn btn-secondary btn-sm" onClick={deselectAll} id="deselect-all-btn">
                <Square size={13} /> None
              </button>
              <button className="btn btn-primary btn-sm" onClick={selectAll} id="select-all-btn">
                <CheckSquare size={13} /> All
              </button>
            </div>
          </div>

          {/* Class cards */}
          <div className={`class-list slide-${slideDir}`} key={activeDay}>
            {todayClasses.length === 0 && (
              <div className="empty-day">
                <BookOpen size={32} />
                <p>No classes scheduled</p>
              </div>
            )}
            {todayClasses.map((cls, i) => {
              const isSelected = selectedForDay.includes(i)
              return (
                <button
                  key={i}
                  className={`class-card ${isSelected ? 'selected' : 'bunked'}`}
                  onClick={() => toggleClass(i)}
                  id={`class-card-${activeDay.toLowerCase()}-${i}`}
                >
                  <div className="class-card-left">
                    <div className="class-check">
                      {isSelected ? <Check size={14} /> : <X size={14} />}
                    </div>
                    <div className="class-info">
                      <div className="class-name">{cls.subject}</div>
                      {(cls.time || cls.room) && (
                        <div className="class-meta">
                          {cls.time && <span>{cls.time}</span>}
                          {cls.time && cls.room && <span className="meta-dot">·</span>}
                          {cls.room && <span>Room {cls.room}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="class-status">
                    {isSelected ? (
                      <span className="status-badge attending">Attending</span>
                    ) : (
                      <span className="status-badge bunking">Bunking</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      </div>

      {/* ——— EDIT MODAL ——— */}
      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Attendance</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowEdit(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="ob-two-col">
                <div className="input-group">
                  <label className="input-label">Total Classes</label>
                  <input
                    type="number"
                    className="input-field"
                    value={editTotal}
                    onChange={e => setEditTotal(e.target.value)}
                    id="edit-total-input"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Classes Attended</label>
                  <input
                    type="number"
                    className="input-field"
                    value={editPresent}
                    onChange={e => setEditPresent(e.target.value)}
                    id="edit-present-input"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowEdit(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEdit} id="save-attendance-btn">
                <Check size={15} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// SVG Ring component
function AttendanceRing({ pct, color, size }) {
  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const dash = (Math.min(100, pct) / 100) * circ

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ - dash}
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.4s' }}
      />
      {/* 75% threshold tick */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="rgba(255,152,0,0.6)"
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={`2 ${circ - 2}`}
        strokeDashoffset={circ - (0.75 * circ)}
      />
    </svg>
  )
}
