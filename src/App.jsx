import { useState, useEffect } from 'react'
import Onboarding from './components/Onboarding'
import Dashboard from './components/Dashboard'
import Particles from './components/Particles'
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
        <Particles
          particleColors={["#b80000"]}
          particleCount={200}
          particleSpread={12}
          speed={0.1}
          particleBaseSize={150}
          moveParticlesOnHover
          alphaParticles={true}
          disableRotation={false}
          sizeRandomness={1.5}
          pixelRatio={1}
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
