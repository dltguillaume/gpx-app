'use client'

import { useRef, useState } from 'react'
import TileSelector from './TileSelector'

export default function TileLayerControl() {
  const [show, setShow] = useState(false)
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelHide = () => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current)
      hideTimeout.current = null
    }
  }

  const scheduleHide = () => {
    hideTimeout.current = setTimeout(() => setShow(false), 200)
  }

  return (
    <div className="absolute bottom-6 left-6 z-[1000] flex items-start" style={{ pointerEvents: 'none' }}>
      {/* Bouton couches */}
      <button
        onMouseEnter={() => { cancelHide(); setShow(true) }}
        onMouseLeave={scheduleHide}
        className="flex items-center justify-center w-[34px] h-[34px] bg-white border border-gray-300 shadow-md text-gray-600 hover:bg-gray-50 transition-colors"
        style={{ pointerEvents: 'auto', borderRadius: 4 }}
        title="Fonds de carte"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
      </button>

      {/* Panneau TileSelector */}
      {show && (
        <div
          onMouseEnter={cancelHide}
          onMouseLeave={scheduleHide}
          className="ml-2 bg-white border border-gray-200 shadow-lg rounded-lg overflow-y-auto"
          style={{ pointerEvents: 'auto', maxHeight: 'calc(100vh - 80px)', width: 220 }}
        >
          <TileSelector />
        </div>
      )}
    </div>
  )
}
