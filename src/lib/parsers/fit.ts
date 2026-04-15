import FitParser from 'fit-file-parser'
import type { Track, TrackPoint } from '@/types'
import { computeTrackStats, generateId } from '@/lib/utils'
import { TRACK_COLORS } from '@/lib/constants'

export async function parseFIT(buffer: ArrayBuffer, colorIndexOffset = 0): Promise<Track[]> {
  const fitParser = new FitParser({
    force: true,
    speedUnit: 'km/h',
    lengthUnit: 'm',
    temperatureUnit: 'celsius',
    elapsedRecordField: true,
    mode: 'list',
  })

  const data = await fitParser.parseAsync(buffer)

  const records = data.records ?? []
  const points: TrackPoint[] = records
    .filter((r) => r.position_lat != null && r.position_long != null)
    .map((r) => ({
      lat: r.position_lat!,
      lng: r.position_long!,
      ele: r.altitude,
      // timestamp est une propriété dynamique non typée dans ParsedRecord
      time: (r as unknown as Record<string, unknown>).timestamp
        ? new Date((r as unknown as Record<string, string>).timestamp)
        : undefined,
      hr: r.heart_rate,
      cadence: r.cadence,
      speed: r.speed,
    }))

  if (points.length === 0) return []

  return [
    {
      id: generateId(),
      name: 'Trace FIT',
      color: TRACK_COLORS[colorIndexOffset % TRACK_COLORS.length],
      points,
      visible: true,
      opacity: 1,
      weight: 3,
      stats: computeTrackStats(points),
    },
  ]
}
