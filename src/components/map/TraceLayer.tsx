'use client'

import { Polyline } from 'react-leaflet'
import { useTracksStore } from '@/store/tracks'

export default function TraceLayer() {
  const tracks = useTracksStore((s) => s.tracks)

  return (
    <>
      {tracks
        .filter((t) => t.visible)
        .map((track) => (
          <Polyline
            key={track.id}
            positions={track.points.map((p) => [p.lat, p.lng] as [number, number])}
            color={track.color}
            weight={track.weight}
            opacity={track.opacity}
          />
        ))}
    </>
  )
}
