'use client'

import { useEffect, useState } from 'react'
import {
  useSettings,
  type Units,
  DEFAULT_UNITS,
} from '@/hooks/useSettings'

type RadioGroupProps<T extends string> = {
  label: string
  name: string
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}

function RadioGroup<T extends string>({ label, name, options, value, onChange }: RadioGroupProps<T>) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <span className="text-sm font-medium text-gray-700 w-24 shrink-0">{label}</span>
      <div className="flex gap-1">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${
              value === opt.value
                ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  )
}

export default function UnitsPanel() {
  const { units, saveUnits } = useSettings()
  const [form, setForm] = useState<Units>(DEFAULT_UNITS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm(units)
  }, [units])

  const handleSave = () => {
    saveUnits(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const set = <K extends keyof Units>(key: K, value: Units[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  return (
    <div className="space-y-4">
      <RadioGroup
        label="Distance"
        name="distance"
        value={form.distance}
        onChange={(v) => set('distance', v)}
        options={[
          { value: 'km', label: 'km' },
          { value: 'mi', label: 'miles' },
        ]}
      />
      <RadioGroup
        label="Altitude"
        name="altitude"
        value={form.altitude}
        onChange={(v) => set('altitude', v)}
        options={[
          { value: 'm', label: 'mètres' },
          { value: 'ft', label: 'pieds' },
        ]}
      />
      <RadioGroup
        label="Vitesse"
        name="speed"
        value={form.speed}
        onChange={(v) => set('speed', v)}
        options={[
          { value: 'kmh', label: 'km/h' },
          { value: 'mph', label: 'mph' },
        ]}
      />

      <SaveRow saved={saved} onSave={handleSave} />
    </div>
  )
}

function SaveRow({ saved, onSave }: { saved: boolean; onSave: () => void }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <button
        onClick={onSave}
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
  )
}
