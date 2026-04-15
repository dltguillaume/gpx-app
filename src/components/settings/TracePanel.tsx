'use client'

import { useEffect, useState } from 'react'
import {
  useSettings,
  type TracePreferences,
  DEFAULT_TRACE_PREFS,
} from '@/hooks/useSettings'

export default function TracePanel() {
  const { tracePrefs, saveTracePrefs } = useSettings()
  const [form, setForm] = useState<TracePreferences>(DEFAULT_TRACE_PREFS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm(tracePrefs)
  }, [tracePrefs])

  const set = <K extends keyof TracePreferences>(key: K, value: TracePreferences[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSave = () => {
    saveTracePrefs(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-5">
      {/* Épaisseur de ligne */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Épaisseur de ligne</label>
          <span className="text-sm font-semibold text-blue-600">{form.lineWidth} px</span>
        </div>
        <input
          type="range"
          min={1}
          max={8}
          step={1}
          value={form.lineWidth}
          onChange={(e) => set('lineWidth', parseInt(e.target.value))}
          className="w-full h-2 accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1 px — fin</span>
          <span>8 px — épais</span>
        </div>
        {/* Aperçu visuel */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-gray-400">Aperçu :</span>
          <div
            className="flex-1 bg-blue-500 rounded-full"
            style={{ height: `${form.lineWidth}px` }}
          />
        </div>
      </div>

      {/* Opacité */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Opacité par défaut</label>
          <span className="text-sm font-semibold text-blue-600">{form.opacity} %</span>
        </div>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={form.opacity}
          onChange={(e) => set('opacity', parseInt(e.target.value))}
          className="w-full h-2 accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>10 % — transparent</span>
          <span>100 % — opaque</span>
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
