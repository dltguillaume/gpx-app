import type { TrackPoint, TrackStats } from '@/types'

function haversineDistance(p1: TrackPoint, p2: TrackPoint): number {
  const R = 6371000
  const lat1 = (p1.lat * Math.PI) / 180
  const lat2 = (p2.lat * Math.PI) / 180
  const dLat = lat2 - lat1
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export function computeTrackStats(points: TrackPoint[]): TrackStats {
  if (points.length === 0) {
    return { distance: 0, elevationGain: 0, elevationLoss: 0, maxElevation: 0, minElevation: 0 }
  }

  let distance = 0
  let elevationGain = 0
  let elevationLoss = 0
  let maxElevation = points[0].ele ?? 0
  let minElevation = points[0].ele ?? 0

  for (let i = 1; i < points.length; i++) {
    distance += haversineDistance(points[i - 1], points[i])

    const ele1 = points[i - 1].ele
    const ele2 = points[i].ele
    if (ele1 != null && ele2 != null) {
      const diff = ele2 - ele1
      if (diff > 0) elevationGain += diff
      else elevationLoss += Math.abs(diff)
      if (ele2 > maxElevation) maxElevation = ele2
      if (ele2 < minElevation) minElevation = ele2
    }
  }

  const firstTime = points[0]?.time
  const lastTime = points[points.length - 1]?.time
  const duration =
    firstTime && lastTime
      ? (lastTime.getTime() - firstTime.getTime()) / 1000
      : undefined
  const avgSpeed =
    duration && duration > 0 && distance > 0
      ? distance / 1000 / (duration / 3600)
      : undefined

  return { distance, elevationGain, elevationLoss, maxElevation, minElevation, duration, avgSpeed }
}

export function formatDistance(meters: number, units: 'metric' | 'imperial' = 'metric'): string {
  if (units === 'imperial') {
    const miles = meters / 1609.344
    return miles < 0.1 ? `${Math.round(meters * 3.281)} ft` : `${miles.toFixed(2)} mi`
  }
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(2)} km`
}

export function formatElevation(meters: number, units: 'metric' | 'imperial' = 'metric'): string {
  if (units === 'imperial') return `${Math.round(meters * 3.281)} ft`
  return `${Math.round(meters)} m`
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}`
  return `${m} min`
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}
