'use client'

import { useEffect, useState } from 'react'
import {
  useSettings,
  type MapPreferences,
  DEFAULT_MAP_PREFS,
} from '@/hooks/useSettings'

export default function MapPanel() {
  const { mapPrefs, saveMapPrefs } = useSettings()
  const [form, setForm] = useState<MapPreferences>(DEFAULT_MAP_PREFS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm(mapPrefs)
  }, [mapPrefs])

  const set = <K extends keyof MapPreferences>(key: K, value: MapPreferences[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSave = () => {
    saveMapPrefs(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-5">
      {/* Position de départ */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-2">
          Position de départ
        </legend>
        <div className="space-y-2">
          {(
            [
              { value: 'last', label: 'Dernière position mémorisée' },
              { value: 'fixed', label: 'Position fixe' },
              { value: 'geo', label: 'Géolocalisation' },
            ] as const
          ).map((opt) => (
            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="startMode"
                value={opt.value}
                checked={form.startMode === opt.value}
                onChange={() => set('startMode', opt.value)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>

        {form.startMode === 'fixed' && (
          <div className="mt-3 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Latitude</label>
              <input
                type="number"
                step="0.000001"
                min={-90}
                max={90}
                value={form.fixedLat}
                onChange={(e) => set('fixedLat', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="48.8566"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Longitude</label>
              <input
                type="number"
                step="0.000001"
                min={-180}
                max={180}
                value={form.fixedLng}
                onChange={(e) => set('fixedLng', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="2.3522"
              />
            </div>
          </div>
        )}
      </fieldset>

      {/* Zoom par défaut */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Zoom par défaut</label>
          <span className="text-sm font-semibold text-blue-600">{form.defaultZoom}</span>
        </div>
        <input
          type="range"
          min={5}
          max={18}
          step={1}
          value={form.defaultZoom}
          onChange={(e) => set('defaultZoom', parseInt(e.target.value))}
          className="w-full h-2 accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>5 — pays</span>
          <span>18 — rue</span>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Sauvegarder
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Sauvegardé
          </span>
        )}
      </div>
    </div>
  )
}
