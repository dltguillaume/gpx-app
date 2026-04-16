'use client'

import { useEffect, useRef } from 'react'
import { useTracksStore } from '@/store/tracks'
import type { TrackPoint } from '@/types'

interface ContextMenuProps {
  point: TrackPoint
  pointIndex: number
  position: { x: number; y: number }
  onClose: () => void
}

export default function ContextMenu({
  point,
  pointIndex,
  position,
  onClose,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const {
    editorState,
    tracks,
    updateTrack,
  } = useTracksStore()

  const currentTrace = editorState.currentTraceId
    ? tracks.find((t) => t.id === editorState.currentTraceId)
    : null

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  if (!currentTrace) return null

  const handleDeletePoint = () => {
    const newPoints = currentTrace.points.filter((_, i) => i !== pointIndex)
    updateTrack(currentTrace.id, { points: newPoints })
    onClose()
  }

  const handleRouting = async (profile: 'hike' | 'bike') => {
    if (!currentTrace || currentTrace.points.length === 0) {
      onClose()
      return
    }

    const lastPoint = currentTrace.points[currentTrace.points.length - 1]

    try {
      const res = await fetch(
        `/api/routing?${[
          `point=${encodeURIComponent(`${lastPoint.lat},${lastPoint.lng}`)}`,
          `point=${encodeURIComponent(`${point.lat},${point.lng}`)}`,
          `profile=${profile}`,
        ].join('&')}`
      )

      if (res.ok) {
        const data = await res.json()
        const coords = data.paths?.[0]?.points?.coordinates

        if (coords && coords.length > 0) {
          const routePoints = coords.map((coord: [number, number]) => ({
            lat: coord[1],
            lng: coord[0],
          }))

          // Add routed points to current trace
          for (const routePoint of routePoints) {
            useTracksStore.getState().addPointToCurrentTrace(routePoint)
          }
        }
      }
    } catch (e) {
      console.error('Routing error:', e)
    }

    onClose()
  }

  const handleSetStart = () => {
    // Keep this point and remove all before it
    const newPoints = currentTrace.points.slice(pointIndex)
    updateTrack(currentTrace.id, { points: newPoints })
    onClose()
  }

  const handleSetEnd = () => {
    // Keep this point and remove all after it
    const newPoints = currentTrace.points.slice(0, pointIndex + 1)
    updateTrack(currentTrace.id, { points: newPoints })
    onClose()
  }

  const handleReverse = () => {
    const newPoints = [...currentTrace.points].reverse()
    updateTrack(currentTrace.id, { points: newPoints })
    onClose()
  }

  const handleRoundTrip = () => {
    // Add points in reverse from this point onwards
    const pointsFromHere = currentTrace.points.slice(pointIndex)
    const reversedPoints = [...pointsFromHere].reverse()

    // Remove the first point of reversed (duplicate) and append
    const newPoints = [
      ...currentTrace.points,
      ...reversedPoints.slice(1),
    ]
    updateTrack(currentTrace.id, { points: newPoints })
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[2000] py-1"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {/* Delete Point */}
      <button
        onClick={handleDeletePoint}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-gray-800 transition-colors"
      >
        Supprimer ce point
      </button>

      {/* Separator */}
      <div className="h-px bg-gray-200 my-1" />

      {/* Route here - Hike */}
      <button
        onClick={() => handleRouting('hike')}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-gray-800 transition-colors"
      >
        Venir ici (randonnée)
      </button>

      {/* Route here - Bike */}
      <button
        onClick={() => handleRouting('bike')}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-gray-800 transition-colors"
      >
        Venir ici (vélo)
      </button>

      {/* Separator */}
      <div className="h-px bg-gray-200 my-1" />

      {/* Set Start */}
      <button
        onClick={handleSetStart}
        disabled={pointIndex === 0}
        className={`w-full px-4 py-2 text-left text-sm transition-colors ${
          pointIndex === 0
            ? 'text-gray-300 cursor-not-allowed'
            : 'hover:bg-gray-100 text-gray-800'
        }`}
      >
        Définir comme départ
      </button>

      {/* Set End */}
      <button
        onClick={handleSetEnd}
        disabled={pointIndex === currentTrace.points.length - 1}
        className={`w-full px-4 py-2 text-left text-sm transition-colors ${
          pointIndex === currentTrace.points.length - 1
            ? 'text-gray-300 cursor-not-allowed'
            : 'hover:bg-gray-100 text-gray-800'
        }`}
      >
        Définir comme arrivée
      </button>

      {/* Separator */}
      <div className="h-px bg-gray-200 my-1" />

      {/* Reverse */}
      <button
        onClick={handleReverse}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-gray-800 transition-colors"
      >
        Inverser le sens
      </button>

      {/* Round Trip */}
      <button
        onClick={handleRoundTrip}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-gray-800 transition-colors"
      >
        Aller-retour depuis ici
      </button>
    </div>
  )
}
