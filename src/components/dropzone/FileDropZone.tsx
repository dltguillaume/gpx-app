'use client'

import { useState, useCallback, type ReactNode } from 'react'
import { useTracksStore } from '@/store/tracks'
import { parseFile } from '@/lib/parsers'

interface Props {
  children: ReactNode
}

export default function FileDropZone({ children }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const tracks = useTracksStore((s) => s.tracks)
  const addTrack = useTracksStore((s) => s.addTrack)

  const handleFiles = useCallback(
    async (files: FileList) => {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop()?.toLowerCase()
        if (!['gpx', 'tcx', 'fit'].includes(ext ?? '')) continue
        try {
          const parsed = await parseFile(file, tracks.length)
          parsed.forEach(addTrack)
        } catch (err) {
          console.error(`Erreur import ${file.name} :`, err)
        }
      }
    },
    [tracks.length, addTrack],
  )

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setDragCounter((c) => c + 1)
    setIsDragging(true)
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragCounter((c) => {
      const next = c - 1
      if (next <= 0) setIsDragging(false)
      return next
    })
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setDragCounter(0)
    if (e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files)
    }
  }

  return (
    <div
      className="relative w-full h-full"
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {children}

      {isDragging && (
        <div className="absolute inset-0 z-[9999] bg-blue-500/20 border-4 border-dashed border-blue-500 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl px-8 py-6 shadow-xl text-center">
            <svg
              className="w-10 h-10 text-blue-500 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-lg font-semibold text-gray-800">Déposer vos fichiers GPS</p>
            <p className="text-sm text-gray-500 mt-1">GPX · TCX · FIT</p>
          </div>
        </div>
      )}
    </div>
  )
}
