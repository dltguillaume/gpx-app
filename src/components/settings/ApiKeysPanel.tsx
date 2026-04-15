'use client'

import { useRef, useState } from 'react'
import {
  getApiKeys,
  getEnvKeys,
  saveApiKeys,
  exportApiKeys,
  importApiKeys,
  type ApiKeys,
} from '@/lib/apiKeys'

const FIELDS: { key: keyof ApiKeys; label: string; placeholder: string }[] = [
  { key: 'ign', label: 'Clé IGN Géoportail', placeholder: 'Votre clé IGN…' },
  { key: 'thunderforest', label: 'Clé Thunderforest', placeholder: 'Votre clé Thunderforest…' },
  { key: 'graphhopper', label: 'Clé GraphHopper', placeholder: 'Votre clé GraphHopper…' },
]

function EyeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

export default function ApiKeysPanel() {
  const envKeys = getEnvKeys()
  const initialKeys = getApiKeys()

  const [values, setValues] = useState<ApiKeys>({
    ign: initialKeys.ign ?? '',
    thunderforest: initialKeys.thunderforest ?? '',
    graphhopper: initialKeys.graphhopper ?? '',
  })
  const [visible, setVisible] = useState<Record<keyof ApiKeys, boolean>>({
    ign: false,
    thunderforest: false,
    graphhopper: false,
  })
  const [saved, setSaved] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  const showConfirmation = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleSave = () => {
    saveApiKeys(values)
    showConfirmation()
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = await importApiKeys(file)
      setValues({
        ign: imported.ign ?? '',
        thunderforest: imported.thunderforest ?? '',
        graphhopper: imported.graphhopper ?? '',
      })
      showConfirmation()
    } catch {
      alert('Fichier JSON invalide.')
    } finally {
      e.target.value = ''
    }
  }

  const toggleVisible = (key: keyof ApiKeys) =>
    setVisible((v) => ({ ...v, [key]: !v[key] }))

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">
        Les clés sont stockées uniquement dans votre navigateur (localStorage).
      </p>

      <div className="space-y-4">
        {FIELDS.map(({ key, label, placeholder }) => {
          const fromEnv = !!envKeys[key]
          return (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              {fromEnv ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-400">
                  <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Configurée par le site
                </div>
              ) : (
                <div className="relative">
                  <input
                    type={visible[key] ? 'text' : 'password'}
                    value={values[key] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    spellCheck={false}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisible(key)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title={visible[key] ? 'Masquer' : 'Afficher'}
                  >
                    {visible[key] ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {saved && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Clés sauvegardées
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Sauvegarder
        </button>
        <button
          onClick={exportApiKeys}
          className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 transition-colors"
        >
          Exporter (.json)
        </button>
        <button
          onClick={() => importRef.current?.click()}
          className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 transition-colors"
        >
          Importer
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="sr-only"
        />
      </div>
    </div>
  )
}
