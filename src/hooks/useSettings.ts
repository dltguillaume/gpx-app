'use client'

import { useState, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────

export interface Units {
  distance: 'km' | 'mi'
  altitude: 'm' | 'ft'
  speed: 'kmh' | 'mph'
}

export interface MapPreferences {
  startMode: 'last' | 'fixed' | 'geo'
  fixedLat: number
  fixedLng: number
  defaultZoom: number
}

export interface TracePreferences {
  lineWidth: number
  opacity: number // 10–100
}

// ── Defaults ───────────────────────────────────────────────────────────────

export const DEFAULT_UNITS: Units = { distance: 'km', altitude: 'm', speed: 'kmh' }
export const DEFAULT_MAP_PREFS: MapPreferences = {
  startMode: 'last',
  fixedLat: 46.603354,
  fixedLng: 1.888334,
  defaultZoom: 10,
}
export const DEFAULT_TRACE_PREFS: TracePreferences = { lineWidth: 3, opacity: 100 }

// ── LS keys ────────────────────────────────────────────────────────────────

export const LS_UNITS = 'mapsgps-units'
export const LS_MAP = 'mapsgps-map-settings'
export const LS_TRACE = 'mapsgps-trace-settings'

// ── Helper ─────────────────────────────────────────────────────────────────

function readLS<T>(key: string, defaults: T): T {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return defaults
    return { ...defaults, ...(JSON.parse(stored) as Partial<T>) }
  } catch {
    return defaults
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useSettings() {
  // Démarre avec les valeurs par défaut pour éviter les écarts d'hydratation,
  // puis lit localStorage après le montage.
  const [units, setUnits] = useState<Units>(DEFAULT_UNITS)
  const [mapPrefs, setMapPrefs] = useState<MapPreferences>(DEFAULT_MAP_PREFS)
  const [tracePrefs, setTracePrefs] = useState<TracePreferences>(DEFAULT_TRACE_PREFS)

  useEffect(() => {
    setUnits(readLS(LS_UNITS, DEFAULT_UNITS))
    setMapPrefs(readLS(LS_MAP, DEFAULT_MAP_PREFS))
    setTracePrefs(readLS(LS_TRACE, DEFAULT_TRACE_PREFS))
  }, [])

  const saveUnits = (values: Units) => {
    localStorage.setItem(LS_UNITS, JSON.stringify(values))
    setUnits(values)
  }

  const saveMapPrefs = (values: MapPreferences) => {
    localStorage.setItem(LS_MAP, JSON.stringify(values))
    setMapPrefs(values)
  }

  const saveTracePrefs = (values: TracePreferences) => {
    localStorage.setItem(LS_TRACE, JSON.stringify(values))
    setTracePrefs(values)
  }

  return { units, saveUnits, mapPrefs, saveMapPrefs, tracePrefs, saveTracePrefs }
}
