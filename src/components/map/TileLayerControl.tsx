'use client'

import { useRef, useState } from 'react'
import TileSelector from './TileSelector'

export default function TileLayerControl() {
  const [hovered, setHovered] = useState(false)
  const [clickedClose, setClickedClose] = useState(false)
  const closeTimer = useRef<NodeJS.Timeout | null>(null)

  const isVisible = hovered && !clickedClose

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    if (!clickedClose) setHovered(true)
  }

  const handleLeave = () => {
    closeTimer.current = setTimeout(() => {
      setHovered(false)
      setClickedClose(false)
    }, 300)
  }

  const handleClick = () => {
    if (isVisible) {
      setClickedClose(true)
      setHovered(false)
    } else {
      setClickedClose(false)
      setHovered(true)
    }
  }

  return (
    <div className="absolute bottom-6 left-6 z-[1000]" style={{ pointerEvents: 'none' }}>
      <div
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className="flex items-end"
        style={{ pointerEvents: 'auto' }}
      >
        <button
          onClick={handleClick}
          className="flex items-center justify-center w-[34px] h-[34px] bg-white border border-gray-300 shadow-md text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
          style={{ borderRadius: 4 }}
          title="Fonds de carte"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
            <polyline points="2 17 12 22 22 17"/>
            <polyline points="2 12 12 17 22 12"/>
          </svg>
        </button>

        {isVisible && (
          <div
            className="ml-2 bg-white border border-gray-200 shadow-lg rounded-lg overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 80px)', width: 220 }}
          >
            <TileSelector />
          </div>
        )}
      </div>
    </div>
  )
}
