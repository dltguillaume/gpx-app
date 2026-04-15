import type { Track, TrackPoint } from '@/types'
import { computeTrackStats, generateId } from '@/lib/utils'
import { TRACK_COLORS } from '@/lib/constants'

export function parseTCX(content: string, colorIndexOffset = 0): Track[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/xml')

  const parseError = doc.querySelector('parsererror')
  if (parseError) throw new Error('Fichier TCX invalide')

  const tracks: Track[] = []

  doc.querySelectorAll('Activity').forEach((activity, i) => {
    const idText = activity.querySelector('Id')?.textContent?.trim()
    const sport = activity.getAttribute('Sport') || ''
    const name = idText
      ? `${sport ? sport + ' — ' : ''}${idText.slice(0, 19).replace('T', ' ')}`
      : `Trace ${i + 1}`

    const points: TrackPoint[] = []

    activity.querySelectorAll('Trackpoint').forEach((tp) => {
      const latText = tp.querySelector('LatitudeDegrees')?.textContent
      const lngText = tp.querySelector('LongitudeDegrees')?.textContent
      if (!latText || !lngText) return

      const lat = parseFloat(latText)
      const lng = parseFloat(lngText)
      if (isNaN(lat) || isNaN(lng)) return

      const eleText = tp.querySelector('AltitudeMeters')?.textContent
      const timeText = tp.querySelector('Time')?.textContent
      const hrText = tp.querySelector('HeartRateBpm Value, HeartRateBpm value')?.textContent

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

  return tracks
}
