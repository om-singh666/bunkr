import { useState, useEffect } from 'react'
import Onboarding from './components/Onboarding'
import Dashboard from './components/Dashboard'
import Galaxy from './components/Galaxy'
import './App.css'

const STORAGE_KEY = 'bunkr_data_v1'

function App() {
  const [userData, setUserData] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed?.timetable && parsed?.totalClasses !== undefined) {
          setUserData(parsed)
        }
      }
    } catch (e) {
      console.error('Error loading saved data', e)
    }
    setIsLoaded(true)
  }, [])

  const handleSetupComplete = (data) => {
    const newData = {
      timetable: data.timetable,
      totalClasses: data.totalClasses,
      presentClasses: data.presentClasses,
      setupDate: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData))
    setUserData(newData)
  }

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY)
    setUserData(null)
  }

  const handleUpdateAttendance = (totalClasses, presentClasses) => {
    const updated = { ...userData, totalClasses, presentClasses }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setUserData(updated)
  }

  if (!isLoaded) return null

  return (
    <div className="app noise-bg">
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
        <Galaxy 
          mouseRepulsion
          mouseInteraction
          density={1}
          glowIntensity={0.3}
          saturation={0}
          hueShift={140}
          twinkleIntensity={0.3}
          rotationSpeed={0.1}
          repulsionStrength={2}
          autoCenterRepulsion={0}
          starSpeed={0.5}
          speed={1}
        />
      </div>
      {!userData ? (
        <Onboarding onComplete={handleSetupComplete} />
      ) : (
        <Dashboard
          userData={userData}
          onReset={handleReset}
          onUpdateAttendance={handleUpdateAttendance}
        />
      )}
    </div>
  )
}

export default App
