import type { TrackPoint } from '@/types'
import L from 'leaflet'

export const PROXIMITY_THRESHOLD_PX = 15
export const SIMPLIFICATION_ANGLE_THRESHOLD = 5

export function pixelsToLatLngDistance(
  map: L.Map,
  pixels: number,
  point: L.LatLng
): number {
  const p1 = map.project(point)
  const p2 = L.point(p1.x + pixels, p1.y)
  const latLng2 = map.unproject(p2)
  return haversineDistance(point, latLng2)
}

export function haversineDistance(p1: L.LatLng, p2: L.LatLng): number {
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

export function calculateAngle(p1: L.LatLng, p2: L.LatLng, p3: L.LatLng): number {
  const a = Math.atan2(p2.lat - p1.lat, p2.lng - p1.lng)
  const b = Math.atan2(p3.lat - p2.lat, p3.lng - p2.lng)
  const angle = Math.abs((b - a) * (180 / Math.PI))
  return angle > 180 ? 360 - angle : angle
}

export function findNearbyPoint(
  clickLatLng: L.LatLng,
  points: TrackPoint[],
  map: L.Map
): number | null {
  const thresholdMeters = pixelsToLatLngDistance(map, PROXIMITY_THRESHOLD_PX, clickLatLng)

  for (let i = 0; i < points.length; i++) {
    const p = L.latLng(points[i].lat, points[i].lng)
    const distance = haversineDistance(clickLatLng, p)
    if (distance < thresholdMeters) {
      return i
    }
  }
  return null
}

export function getDistanceColor(meters: number): string {
  if (meters < 30) return '#22c55e' // green
  if (meters < 50) return '#f97316' // orange
  return '#ef4444' // red
}

export function shouldSimplify(
  p1: L.LatLng,
  p2: L.LatLng,
  p3: L.LatLng
): boolean {
  const angle = calculateAngle(p1, p2, p3)
  return angle < SIMPLIFICATION_ANGLE_THRESHOLD
}
