'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { formatDistance } from '@/lib/utils'
import { useSettings } from '@/hooks/useSettings'

interface MeasurePoint {
  latlng: L.LatLng
  elevation: number
}

const HAVERSINE_RADIUS = 6371000 // Earth radius in meters

function haversineDistance(p1: L.LatLng, p2: L.LatLng): number {
  const lat1 = (p1.lat * Math.PI) / 180
  const lat2 = (p2.lat * Math.PI) / 180
  const dLat = lat2 - lat1
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * HAVERSINE_RADIUS * Math.asin(Math.sqrt(a))
}

function midpoint(p1: L.LatLng, p2: L.LatLng): L.LatLng {
  return L.latLng((p1.lat + p2.lat) / 2, (p1.lng + p2.lng) / 2)
}

const fetchElevation = async (lat: number, lng: number): Promise<number> => {
  try {
    const res = await fetch(`/api/elevation?locations=${lat},${lng}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    console.log('elevation data:', data)
    if (!data.results || !data.results[0]) throw new Error('no results')
    return data.results[0].elevation ?? 0
  } catch (e) {
    console.error('elevation fetch error:', e)
    return 0
  }
}

export default function MeasureTool() {
  const map = useMap()
  const { units } = useSettings()

  // Stabilize unitSystem to prevent recreating callbacks on every render
  const unitSystem = useMemo(
    () => (units.distance === 'km' ? 'metric' : 'imperial'),
    [units.distance]
  )

  const [isActive, setIsActive] = useState(false)
  const [points, setPoints] = useState<MeasurePoint[]>([])
  const [previewPoint, setPreviewPoint] = useState<L.LatLng | null>(null)

  const buttonRef = useRef<HTMLDivElement>(null)
  const pointMarkersRef = useRef<L.Marker[]>([])
  const segmentLayersRef = useRef<(L.Polyline | L.Marker)[]>([])
  const previewLineRef = useRef<L.Polyline | null>(null)
  const previewLabelRef = useRef<L.Popup | null>(null)
  const handleMapClickRef = useRef<((e: L.LeafletMouseEvent) => Promise<void>) | null>(null)
  const handleMapMousemoveRef = useRef<((e: L.LeafletMouseEvent) => void) | null>(null)

  // Create a blue circular marker with visible elevation label
  function createPointMarker(point: MeasurePoint) {
    const elevation = Math.round(point.elevation)

    // Main marker (blue circle)
    const icon = L.divIcon({
      className: 'measure-marker',
      html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-blue-600 shadow-md"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })

    const marker = L.marker(point.latlng, { icon }).addTo(map)
    pointMarkersRef.current.push(marker)

    // Elevation label marker
    const elevationLabelIcon = L.divIcon({
      className: '',
      html: `<div style="font-size:11px;background:white;padding:1px 4px;border-radius:3px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.3)">${elevation} m</div>`,
      iconSize: [50, 16],
      iconAnchor: [-6, 6],
    })

    const elevationMarker = L.marker(point.latlng, {
      icon: elevationLabelIcon,
      interactive: false,
    }).addTo(map)

    pointMarkersRef.current.push(elevationMarker)
    return marker
  }

  // Create dashed line and label between two consecutive points
  function createSegmentLabel(p1: MeasurePoint, p2: MeasurePoint) {
    const distance = haversineDistance(p1.latlng, p2.latlng)
    const distKm = (distance / 1000).toFixed(2)
    const dElev = Math.round(p2.elevation - p1.elevation)
    const sign = dElev >= 0 ? '+' : ''

    const midLat = (p1.latlng.lat + p2.latlng.lat) / 2
    const midLng = (p1.latlng.lng + p2.latlng.lng) / 2

    // Dashed line
    const line = L.polyline([p1.latlng, p2.latlng], {
      color: '#3b82f6',
      weight: 2,
      dashArray: '5, 5',
      opacity: 0.7,
      interactive: false,
    }).addTo(map)

    segmentLayersRef.current.push(line)

    // Label marker on segment
    const labelIcon = L.divIcon({
      className: 'measure-label',
      html: `<span style="font-size:11px;background:white;padding:2px 6px;border-radius:3px;box-shadow:0 1px 3px rgba(0,0,0,0.25);white-space:nowrap;display:inline-block">${distKm} km | ${sign}${dElev} m</span>`,
      iconSize: undefined,
      iconAnchor: undefined,
    })

    const labelMarker = L.marker([midLat, midLng], {
      icon: labelIcon,
      interactive: false,
    }).addTo(map)

    segmentLayersRef.current.push(labelMarker)
  }

  // Create preview line while moving cursor
  function createPreviewLine(from: L.LatLng, to: L.LatLng) {
    if (previewLineRef.current) {
      previewLineRef.current.remove()
    }

    if (previewLabelRef.current) {
      previewLabelRef.current.remove()
    }

    const distance = haversineDistance(from, to)
    const distStr = formatDistance(distance, unitSystem)
    const mid = midpoint(from, to)

    const line = L.polyline([from, to], {
      color: '#9ca3af',
      weight: 2,
      dashArray: '5, 5',
      opacity: 0.6,
      interactive: false,
    }).addTo(map)

    const popup = L.popup({
      autoClose: false,
      closeButton: false,
      className:
        'measure-label bg-gray-100 border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 font-semibold',
    })
      .setLatLng(mid)
      .setContent(distStr)
      .addTo(map)

    previewLineRef.current = line
    previewLabelRef.current = popup
  }

  // Clear all markers and layers
  const clearAllLayers = useCallback(() => {
    pointMarkersRef.current.forEach((marker) => marker.remove())
    pointMarkersRef.current = []

    segmentLayersRef.current.forEach((layer) => layer.remove())
    segmentLayersRef.current = []

    if (previewLineRef.current) {
      previewLineRef.current.remove()
      previewLineRef.current = null
    }

    if (previewLabelRef.current) {
      previewLabelRef.current.remove()
      previewLabelRef.current = null
    }

    setPreviewPoint(null)
  }, [])

  // Calculate totals
  function calculateTotals(pts: MeasurePoint[]) {
    if (pts.length < 2) {
      return { distance: 0, elevationGain: 0, elevationLoss: 0 }
    }

    let distance = 0
    let elevationGain = 0
    let elevationLoss = 0

    for (let i = 0; i < pts.length - 1; i++) {
      distance += haversineDistance(pts[i].latlng, pts[i + 1].latlng)
      const diff = pts[i + 1].elevation - pts[i].elevation
      if (diff > 0) elevationGain += diff
      else elevationLoss += Math.abs(diff)
    }

    return { distance, elevationGain, elevationLoss }
  }

  // Handle map click to add measurement point
  const handleMapClick = useCallback(
    async (e: L.LeafletMouseEvent) => {
      const latlng = e.latlng
      const elevation = await fetchElevation(latlng.lat, latlng.lng)
      const newPoint: MeasurePoint = { latlng, elevation }

      setPoints((prev) => {
        const updated = [...prev, newPoint]
        createPointMarker(newPoint)

        // Create segment label if there's a previous point
        if (prev.length > 0) {
          createSegmentLabel(prev[prev.length - 1], newPoint)
        }

        return updated
      })
      setPreviewPoint(null)
    },
    [map, unitSystem]
  )

  // Handle mousemove to show preview line
  const handleMapMousemove = useCallback(
    (e: L.LeafletMouseEvent) => {
      if (points.length === 0) return
      const lastPoint = points[points.length - 1]
      createPreviewLine(lastPoint.latlng, e.latlng)
    },
    [points, unitSystem]
  )

  // Handle toggle with event propagation stop to avoid ghost point
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isActive) {
      setIsActive(false)
      setPoints([])
      clearAllLayers()
    } else {
      setIsActive(true)
    }
  }

  // Disable click/scroll propagation on button to prevent Leaflet interference
  useEffect(() => {
    if (buttonRef.current) {
      L.DomEvent.disableClickPropagation(buttonRef.current)
      L.DomEvent.disableScrollPropagation(buttonRef.current)
    }
  }, [])

  // Update refs with latest handler functions
  useEffect(() => {
    handleMapClickRef.current = handleMapClick
    handleMapMousemoveRef.current = handleMapMousemove
  }, [handleMapClick, handleMapMousemove])

  // Setup/cleanup event listeners when tool state changes
  useEffect(() => {
    if (!isActive) {
      return
    }

    // Wrapped listeners that use the refs (stable references)
    const clickListener = (e: L.LeafletMouseEvent) => {
      handleMapClickRef.current?.(e)
    }
    const mousemoveListener = (e: L.LeafletMouseEvent) => {
      handleMapMousemoveRef.current?.(e)
    }

    // Activate: add event listeners
    map.on('click', clickListener)
    map.on('mousemove', mousemoveListener)
    map.getContainer().style.cursor = 'crosshair'

    // Cleanup: remove listeners and clear layers when isActive becomes false
    return () => {
      map.off('click', clickListener)
      map.off('mousemove', mousemoveListener)
      map.getContainer().style.cursor = 'grab'
      clearAllLayers()
      setPoints([])
    }
  }, [isActive, map, clearAllLayers])

  const totals = calculateTotals(points)
  const showTotals = points.length >= 3

  return (
    <>
      {/* Toggle Button */}
      <div ref={buttonRef}>
        <button
          onClick={handleToggle}
          className={`w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-colors ${
            isActive
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title="Measure distance and elevation"
        >
          {/* Pin icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </button>
      </div>

      {/* Floating Stats Box */}
      {showTotals && (
        <div
          className="fixed top-[10px] left-1/2 -translate-x-1/2 z-[1001] bg-white rounded-lg shadow-lg border border-blue-200 px-4 py-2"
          style={{ pointerEvents: 'none' }}
        >
          <div className="text-center text-sm font-semibold text-gray-800">
            <div>
              Total: {formatDistance(totals.distance, unitSystem)} | D+{' '}
              {Math.round(totals.elevationGain)} m | D-{' '}
              {Math.round(totals.elevationLoss)} m
            </div>
          </div>
        </div>
      )}
    </>
  )
}
