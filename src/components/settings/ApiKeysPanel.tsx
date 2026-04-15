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

export default function ApiKeysPanel() {
  const envKeys = getEnvKeys()
  const initialKeys = getApiKeys()

  const [values, setValues] = useState<ApiKeys>({
    ign: initialKeys.ign ?? '',
    thunderforest: initialKeys.thunderforest ?? '',
    graphhopper: initialKeys.graphhopper ?? '',
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

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-800">Clés API</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Les clés sont stockées uniquement dans votre navigateur.
        </p>
      </div>

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
                <input
                  type="text"
                  value={values[key] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  spellCheck={false}
                  autoComplete="off"
                />
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
