'use client'

import { useRef } from 'react'
import { useTracksStore } from '@/store/tracks'
import { parseFile } from '@/lib/parsers'
import TrackItem from './TrackItem'

export default function TrackList() {
  const tracks = useTracksStore((s) => s.tracks)
  const addTrack = useTracksStore((s) => s.addTrack)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList) => {
    for (const file of Array.from(files)) {
      try {
        const parsed = await parseFile(file, tracks.length)
        parsed.forEach(addTrack)
      } catch (err) {
        console.error(`Erreur import ${file.name} :`, err)
        alert(`Impossible d'importer ${file.name}`)
      }
    }
  }

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Traces {tracks.length > 0 && `(${tracks.length}/20)`}
        </h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
          title="Importer un fichier GPS"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Importer
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".gpx,.tcx,.fit"
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="sr-only"
        />
      </div>

      {tracks.length === 0 ? (
        <p className="text-xs text-gray-400 leading-relaxed">
          Glissez-déposez des fichiers GPX, TCX ou FIT sur la carte, ou cliquez sur Importer.
        </p>
      ) : (
        <div className="space-y-2">
          {tracks.map((track) => (
            <TrackItem key={track.id} track={track} />
          ))}
        </div>
      )}
    </div>
  )
}
