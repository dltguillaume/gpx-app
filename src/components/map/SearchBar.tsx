'use client'

import { useEffect, useRef, useState } from 'react'
import { useMap } from 'react-leaflet'

interface PhotonResult {
  lat: number
  lon: number
  display_name: string
  importance: number
}

interface ScoredResult extends PhotonResult {
  distanceKm: number
  score: number
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

function ImportanceDot({ importance }: { importance: number }) {
  const color =
    importance > 0.7 ? 'bg-green-500' : importance >= 0.4 ? 'bg-orange-400' : 'bg-gray-400'
  return <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
}

export default function SearchBar() {
  const map = useMap()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ScoredResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounced Photon search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8&lang=fr`,
        )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: { features: any[] } = await res.json()
        const parsed: PhotonResult[] = data.features.map((f) => ({
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
          display_name: [f.properties.name, f.properties.city, f.properties.country]
            .filter(Boolean)
            .join(', '),
          importance: f.properties.importance ?? 0.5,
        }))
        const center = map.getCenter()
        const scored: ScoredResult[] = parsed
          .map((r) => {
            const distanceKm = haversineKm(center.lat, center.lng, r.lat, r.lon)
            const score = r.importance / Math.log(distanceKm + Math.E)
            return { ...r, distanceKm, score }
          })
          .sort((a, b) => b.score - a.score)
        setResults(scored)
        setOpen(scored.length > 0)
      } catch {
        // réseau indisponible — on ignore silencieusement
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, map])

  // Clic en dehors → ferme la liste
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  // Échap → vide + ferme
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setQuery('')
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  function handleSelect(r: ScoredResult) {
    map.flyTo([r.lat, r.lon], 15)
    setOpen(false)
  }

  return (
    <div
      ref={containerRef}
      className="absolute top-[10px] right-[46px] z-[1000] w-72"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Input */}
      <div
        className="flex items-center gap-2 bg-white border border-gray-300 shadow-md px-2.5 py-1.5"
        style={{ borderRadius: 4 }}
      >
        <svg
          className="w-4 h-4 text-gray-400 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Rechercher un lieu…"
          className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent"
        />
        {loading && (
          <svg
            className="w-4 h-4 text-gray-400 animate-spin shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        )}
      </div>

      {/* Liste résultats */}
      {open && results.length > 0 && (
        <ul
          className="mt-1 bg-white border border-gray-200 shadow-lg overflow-hidden"
          style={{ borderRadius: 4 }}
        >
          {results.map((r, idx) => (
            <li key={`${r.lat}-${r.lon}-${idx}`}>
              <button
                onMouseDown={() => handleSelect(r)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <ImportanceDot importance={r.importance} />
                <span className="flex-1 text-sm text-gray-800 truncate min-w-0">
                  {r.display_name.length > 50
                    ? r.display_name.slice(0, 50) + '…'
                    : r.display_name}
                </span>
                <span className="text-xs text-gray-400 shrink-0">
                  {formatDistance(r.distanceKm)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
