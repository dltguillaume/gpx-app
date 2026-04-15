import type { Track, TrackPoint } from '@/types'
import { computeTrackStats, generateId } from '@/lib/utils'
import { TRACK_COLORS } from '@/lib/constants'

export function parseGPX(content: string, colorIndexOffset = 0): Track[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/xml')

  const parseError = doc.querySelector('parsererror')
  if (parseError) throw new Error('Fichier GPX invalide')

  const tracks: Track[] = []

  doc.querySelectorAll('trk').forEach((trk, i) => {
    const name =
      trk.querySelector('name')?.textContent?.trim() || `Trace ${i + 1}`
    const points: TrackPoint[] = []

    trk.querySelectorAll('trkpt').forEach((pt) => {
      const lat = parseFloat(pt.getAttribute('lat') ?? '')
      const lng = parseFloat(pt.getAttribute('lon') ?? '')
      if (isNaN(lat) || isNaN(lng)) return

      const eleText = pt.querySelector('ele')?.textContent
      const timeText = pt.querySelector('time')?.textContent
      // Heart rate is in extensions
      const hrText =
        pt.querySelector('hr')?.textContent ??
        pt.querySelector('heartrate')?.textContent ??
        pt.querySelector('HeartRateBpm value')?.textContent ??
        pt.querySelector('Value')?.textContent

      points.push({
        lat,
        lng,
        ele: eleText ? parseFloat(eleText) : undefined,
        time: timeText ? new Date(timeText) : undefined,
        hr: hrText ? parseInt(hrText) : undefined,
      })
    })

    if (points.length === 0) return

    tracks.push({
      id: generateId(),
      name,
      color: TRACK_COLORS[(colorIndexOffset + i) % TRACK_COLORS.length],
      points,
      visible: true,
      opacity: 1,
      weight: 3,
      stats: computeTrackStats(points),
    })
  })

  // Also support routes (<rte>/<rtept>)
  if (tracks.length === 0) {
    doc.querySelectorAll('rte').forEach((rte, i) => {
      const name =
        rte.querySelector('name')?.textContent?.trim() || `Route ${i + 1}`
      const points: TrackPoint[] = []

      rte.querySelectorAll('rtept').forEach((pt) => {
        const lat = parseFloat(pt.getAttribute('lat') ?? '')
        const lng = parseFloat(pt.getAttribute('lon') ?? '')
        if (isNaN(lat) || isNaN(lng)) return

        const eleText = pt.querySelector('ele')?.textContent
        points.push({ lat, lng, ele: eleText ? parseFloat(eleText) : undefined })
      })

      if (points.length === 0) return

      tracks.push({
        id: generateId(),
        name,
        color: TRACK_COLORS[(colorIndexOffset + i) % TRACK_COLORS.length],
        points,
        visible: true,
        opacity: 1,
        weight: 3,
        stats: computeTrackStats(points),
      })
    })
  }

  return tracks
}
