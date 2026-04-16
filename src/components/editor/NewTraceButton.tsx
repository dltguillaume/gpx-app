'use client'

import { useTracksStore } from '@/store/tracks'

export default function NewTraceButton() {
  const startNewTrace = useTracksStore((s) => s.startNewTrace)
  const editorState = useTracksStore((s) => s.editorState)

  if (editorState.isActive) return null

  return (
    <button
      onClick={() => startNewTrace()}
      className="p-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white shadow-md transition-colors"
      title="Créer une nouvelle trace"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  )
}
