'use client'

import type { Track } from '@/types'
import { useTracksStore } from '@/store/tracks'
import { formatDistance, formatElevation, formatDuration } from '@/lib/utils'
import { exportGpxFile } from '@/lib/exporters/gpx'

interface Props {
  track: Track
}

export default function TrackItem({ track }: Props) {
  const activeTrackId = useTracksStore((s) => s.activeTrackId)
  const setActiveTrack = useTracksStore((s) => s.setActiveTrack)
  const updateTrack = useTracksStore((s) => s.updateTrack)
  const removeTrack = useTracksStore((s) => s.removeTrack)
  const startEditing = useTracksStore((s) => s.startEditing)
  const editorState = useTracksStore((s) => s.editorState)

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
            startEditing(track.id)
            // Show warning if track has time/cardio data
            const hasTimeData = track.points.some((p) => p.time !== undefined)
            const hasCardioData = track.points.some((p) => p.hr !== undefined || p.cadence !== undefined)
            if ((hasTimeData || hasCardioData) && !sessionStorage.getItem(`edited-${track.id}`)) {
              // Warning will be handled by DrawingController
              sessionStorage.setItem(`edited-${track.id}`, 'true')
            }
          }}
          className={`transition-colors ${editorState.isActive ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-green-500'}`}
          title={editorState.isActive ? 'Un tracé est en édition' : 'Éditer'}
          disabled={editorState.isActive}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            exportGpxFile(track)
          }}
          className="text-gray-400 hover:text-blue-500 transition-colors"
          title="Exporter GPX"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            removeTrack(track.id)
          }}
          className={`transition-colors ${editorState.isActive ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-red-500'}`}
          title={editorState.isActive ? 'Un tracé est en édition' : 'Supprimer'}
          disabled={editorState.isActive}
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
