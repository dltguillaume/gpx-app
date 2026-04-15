'use client'

import { useEffect, useRef, useState } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

export default function GeolocationButton() {
  const map = useMap()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const markerRef = useRef<L.Marker | null>(null)
  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator

  function clearMarker() {
    if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }
  }

  useEffect(() => () => clearMarker(), [])

  function handleLocate() {
    if (loading || !supported) return
    setLoading(true)
    setError(false)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords
        map.flyTo([lat, lng], 15)
        clearMarker()
        const icon = L.divIcon({
          className: '',
          html: '<div class="geoloc-pulse"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })
        markerRef.current = L.marker([lat, lng], { icon }).addTo(map)
        setLoading(false)
      },
      () => {
        setLoading(false)
        setError(true)
        setTimeout(() => setError(false), 3000)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <div className="relative">
      <button
        onClick={handleLocate}
        disabled={!supported}
        className={`flex items-center justify-center w-[34px] h-[34px] bg-white border border-gray-300 shadow-md transition-colors ${
          !supported ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'
        }`}
        style={{ borderRadius: 4 }}
        title={supported ? 'Ma position' : 'Géolocalisation non disponible'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={loading ? 'animate-spin' : ''}
        >
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          <circle cx="12" cy="12" r="8"/>
        </svg>
      </button>

      {error && (
        <div className="absolute left-[42px] top-1/2 -translate-y-1/2 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none">
          Localisation non disponible
        </div>
      )}
    </div>
  )
}
