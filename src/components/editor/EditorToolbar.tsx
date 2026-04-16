'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { useTracksStore } from '@/store/tracks'
import type { Track } from '@/types'
import { computeTrackStats, generateId } from '@/lib/utils'

export default function EditorToolbar() {
  const {
    editorState,
    tracks,
    setDrawingMode,
    undoLastSegment,
    redoSegment,
    stopEditing,
    removeTrack,
    updateTrack,
    history,
    historyIndex,
  } = useTracksStore()

  const containerRef = useRef<HTMLDivElement>(null)

  // Disable click propagation for toolbar
  useEffect(() => {
    if (containerRef.current) {
      L.DomEvent.disableClickPropagation(containerRef.current)
      L.DomEvent.disableScrollPropagation(containerRef.current)
    }
  }, [])

  // Create new trace when starting edit mode
  useEffect(() => {
    if (!editorState.isActive && editorState.currentTraceId === null) {
      // Auto-create trace on first editor activation (handled by startEditing)
      return
    }
  }, [editorState.isActive, editorState.currentTraceId])

  const currentTrace = editorState.currentTraceId
    ? tracks.find((t) => t.id === editorState.currentTraceId)
    : null

  const canUndo = history.length > 1 && historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  const handleFinish = () => {
    if (currentTrace && currentTrace.points.length > 0) {
      const stats = computeTrackStats(currentTrace.points)
      updateTrack(currentTrace.id, { stats })
    }
    stopEditing()
  }

  const handleCancel = () => {
    if (currentTrace) {
      removeTrack(currentTrace.id)
    }
    stopEditing()
  }

  if (!editorState.isActive) return null

  return (
    <div
      ref={containerRef}
      className="flex gap-1 p-2 bg-white rounded-lg border border-gray-200 shadow-md"
    >
      {/* Mode toggle: Free/Routed */}
      <button
        onClick={() => {
          const newMode = editorState.drawingMode === 'free' ? 'routed' : 'free'
          setDrawingMode(newMode)
        }}
        className={`p-2 rounded-md transition-colors ${
          editorState.drawingMode === 'free'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-purple-100 text-purple-700'
        }`}
        title={`Mode: ${editorState.drawingMode === 'free' ? 'Libre' : 'Routé'}`}
      >
        {editorState.drawingMode === 'free' ? (
          // Pencil icon
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L9 21H4.5v-4.5L16.732 3.732z" />
          </svg>
        ) : (
          // Road/route icon
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        )}
      </button>

      {/* Undo button */}
      <button
        onClick={() => undoLastSegment()}
        disabled={!canUndo}
        className={`p-2 rounded-md transition-colors ${
          canUndo
            ? 'hover:bg-gray-100 text-gray-700'
            : 'text-gray-300 cursor-not-allowed'
        }`}
        title="Annuler"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6-6m0 0l-6 6" />
        </svg>
      </button>

      {/* Redo button */}
      <button
        onClick={() => redoSegment()}
        disabled={!canRedo}
        className={`p-2 rounded-md transition-colors ${
          canRedo
            ? 'hover:bg-gray-100 text-gray-700'
            : 'text-gray-300 cursor-not-allowed'
        }`}
        title="Refaire"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m0 0l-6-6m6 6l6-6" />
        </svg>
      </button>

      {/* Divider */}
      <div className="w-px bg-gray-200" />

      {/* Finish button */}
      <button
        onClick={handleFinish}
        className="px-3 py-2 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors text-xs font-medium"
        title="Terminer le tracé"
      >
        Terminer
      </button>

      {/* Cancel button */}
      <button
        onClick={handleCancel}
        className="px-3 py-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors text-xs font-medium"
        title="Annuler le tracé"
      >
        Annuler
      </button>
    </div>
  )
}
