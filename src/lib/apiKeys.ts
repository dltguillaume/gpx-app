export interface ApiKeys {
  ign?: string
  thunderforest?: string
  graphhopper?: string
}

const LS_KEY = 'mapsgps-api-keys'

/** Lecture : variables d'env en priorité, sinon localStorage. */
export function getApiKeys(): ApiKeys {
  const fromEnv: ApiKeys = {
    ign: process.env.NEXT_PUBLIC_IGN_API_KEY || undefined,
    thunderforest: process.env.NEXT_PUBLIC_THUNDERFOREST_API_KEY || undefined,
    graphhopper: process.env.NEXT_PUBLIC_GRAPHHOPPER_API_KEY || undefined,
  }
  if (typeof window === 'undefined') return fromEnv
  try {
    const stored = localStorage.getItem(LS_KEY)
    const fromLS: ApiKeys = stored ? (JSON.parse(stored) as ApiKeys) : {}
    return {
      ign: fromEnv.ign || fromLS.ign,
      thunderforest: fromEnv.thunderforest || fromLS.thunderforest,
      graphhopper: fromEnv.graphhopper || fromLS.graphhopper,
    }
  } catch {
    return fromEnv
  }
}

/** Retourne uniquement les clés provenant des variables d'environnement. */
export function getEnvKeys(): ApiKeys {
  return {
    ign: process.env.NEXT_PUBLIC_IGN_API_KEY || undefined,
    thunderforest: process.env.NEXT_PUBLIC_THUNDERFOREST_API_KEY || undefined,
    graphhopper: process.env.NEXT_PUBLIC_GRAPHHOPPER_API_KEY || undefined,
  }
}

/** Sauvegarde dans localStorage (fusionne avec l'existant). */
export function saveApiKeys(keys: Partial<ApiKeys>): void {
  const current = getApiKeys()
  const merged: ApiKeys = { ...current, ...keys }
  localStorage.setItem(LS_KEY, JSON.stringify(merged))
}

/** Télécharge la config clés en JSON. */
export function exportApiKeys(): void {
  const keys = getApiKeys()
  const blob = new Blob([JSON.stringify(keys, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'mapsgps-keys.json'
  a.click()
  URL.revokeObjectURL(url)
}

/** Import depuis un fichier JSON. */
export async function importApiKeys(file: File): Promise<ApiKeys> {
  const text = await file.text()
  const keys = JSON.parse(text) as ApiKeys
  saveApiKeys(keys)
  return keys
}
