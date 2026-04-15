'use client'

import type { Track } from '@/types'
import { useTracksStore } from '@/store/tracks'
import { formatDistance, formatElevation, formatDuration } from '@/lib/utils'

interface Props {
  track: Track
}

export default function TrackItem({ track }: Props) {
  const activeTrackId = useTracksStore((s) => s.activeTrackId)
  const setActiveTrack = useTracksStore((s) => s.setActiveTrack)
  const updateTrack = useTracksStore((s) => s.updateTrack)
  const removeTrack = useTracksStore((s) => s.removeTrack)

  const isActive = track.id === activeTrackId

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setActiveTrack(track.id)}
      onKeyDown={(e) => e.key === 'Enter' && setActiveTrack(track.id)}
      className={`rounded-lg border p-2 cursor-pointer transition-colors ${
        isActive
          ? 'border-blue-300 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      {/* En-tête : couleur + nom + actions */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={track.color}
          onChange={(e) => updateTrack(track.id, { color: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          className="w-5 h-5 rounded cursor-pointer border border-gray-200 p-0.5 bg-transparent"
          title="Changer la couleur"
        />
        <span className="flex-1 text-sm font-medium truncate text-gray-800">
          {track.name}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            updateTrack(track.id, { visible: !track.visible })
          }}
          className={`text-sm transition-opacity ${track.visible ? 'opacity-60 hover:opacity-100' : 'opacity-30 hover:opacity-60'}`}
          title={track.visible ? 'Masquer' : 'Afficher'}
        >
          {track.visible ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            removeTrack(track.id)
          }}
          className="text-gray-400 hover:text-red-500 transition-colors"
          title="Supprimer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Stats */}
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
        <span>{formatDistance(track.stats.distance)}</span>
        {track.stats.elevationGain > 0 && (
          <span>↑ {formatElevation(track.stats.elevationGain)}</span>
        )}
        {track.stats.elevationLoss > 0 && (
          <span>↓ {formatElevation(track.stats.elevationLoss)}</span>
        )}
        {track.stats.duration != null && track.stats.duration > 0 && (
          <span>{formatDuration(track.stats.duration)}</span>
        )}
      </div>
    </div>
  )
}
