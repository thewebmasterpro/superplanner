import { useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { tourConfig } from '../config/tourConfig'

const TOUR_STORAGE_PREFIX = 'superplanner_tour_seen_'

function getSeenKey(path) {
  const normalized = path === '/' ? 'dashboard' : path.replace(/^\//, '')
  return `${TOUR_STORAGE_PREFIX}${normalized}`
}

function hasSeenTour(path) {
  return localStorage.getItem(getSeenKey(path)) === 'true'
}

function markTourSeen(path) {
  localStorage.setItem(getSeenKey(path), 'true')
}

export function useTour() {
  const location = useLocation()
  const driverRef = useRef(null)
  const timerRef = useRef(null)

  const currentPath = location.pathname
  const config = tourConfig[currentPath]
  const hasTour = !!config && config.steps.length > 0

  const startTour = useCallback(() => {
    if (!config) return

    const availableSteps = config.steps.filter(step =>
      document.querySelector(step.element)
    )

    if (availableSteps.length === 0) return

    if (driverRef.current) {
      driverRef.current.destroy()
    }

    driverRef.current = driver({
      showProgress: true,
      animate: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Suivant',
      prevBtnText: 'Precedent',
      doneBtnText: 'Terminer',
      progressText: '{{current}} / {{total}}',
      steps: availableSteps,
      onDestroyed: () => {
        markTourSeen(currentPath)
      },
    })

    driverRef.current.drive()
  }, [config, currentPath])

  const replayTour = useCallback(() => {
    startTour()
  }, [startTour])

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    if (!config || hasSeenTour(currentPath)) return

    timerRef.current = setTimeout(() => {
      startTour()
    }, 1200)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (driverRef.current) driverRef.current.destroy()
    }
  }, [currentPath])

  return {
    replayTour,
    hasTour,
    currentPageTitle: config?.pageTitle || null,
  }
}
