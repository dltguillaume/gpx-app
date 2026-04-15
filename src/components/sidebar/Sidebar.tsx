'use client'

import { useState } from 'react'
import TileSelector from '@/components/map/TileSelector'
import TrackList from './TrackList'

export default function Sidebar() {
  const [open, setOpen] = useState(true)

  return (
    <div
      className={`relative flex flex-col h-full bg-white border-r border-gray-200 shadow-sm transition-all duration-200 ${
        open ? 'w-64' : 'w-10'
      }`}
    >
      {/* Bouton toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="absolute -right-3 top-4 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
        title={open ? 'Réduire' : 'Agrandir'}
      >
        <svg
          className={`w-3 h-3 text-gray-500 transition-transform ${open ? '' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {open ? (
        <>
          {/* En-tête */}
          <div className="px-3 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="font-semibold text-gray-800">MapsGPS</span>
            </div>
          </div>

          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto">
            <TileSelector />
            <TrackList />
          </div>
        </>
      ) : (
        /* Sidebar réduite : icônes verticales */
        <div className="flex flex-col items-center pt-12 gap-4 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
      )}
    </div>
  )
}
