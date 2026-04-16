'use client'

import { useEffect, useRef, useState } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useTracksStore } from '@/store/tracks'
import type { TrackPoint } from '@/types'
import { computeTrackStats } from '@/lib/utils'
import {
  findNearbyPoint,
  haversineDistance,
  shouldSimplify,
  getDistanceColor,
} from '@/lib/editor'
import ContextMenu from './ContextMenu'

interface RouteSegment {
  points: TrackPoint[]
  isRouted: boolean
}

interface ContextMenuState {
  isOpen: boolean
  point: TrackPoint | null
  pointIndex: number | null
  position: { x: number; y: number }
}

export default function DrawingController() {
  const map = useMap()
  const {
    editorState,
    tracks,
    addPointToCurrentTrace,
    setIsDrawing,
    updateTrack,
  } = useTracksStore()

  const [pulsingLine, setPulsingLine] = useState<L.Polyline | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    point: null,
    pointIndex: null,
    position: { x: 0, y: 0 },
  })
  const [showTimeDataWarning, setShowTimeDataWarning] = useState(false)
  const polylineRef = useRef<L.Polyline | null>(null)
  const previewLabelRef = useRef<L.Popup | null>(null)
  const pointMarkersRef = useRef<L.CircleMarker[]>([])
  const routingAbortRef = useRef<AbortController | null>(null)

  const currentTrace = editorState.currentTraceId
    ? tracks.find((t) => t.id === editorState.currentTraceId)
    : null

  // Create preview polyline and label on mount
  useEffect(() => {
    if (!map) return

    const line = L.polyline([], {
      color: '#666',
      weight: 2,
      opacity: 0.5,
      dashArray: '5,5',
    }).addTo(map)

    const popup = L.popup({
      closeButton: false,
      autoClose: false,
      className: 'editor-distance-label',
    })

    polylineRef.current = line
    previewLabelRef.current = popup

    return () => {
      line.remove()
      popup.remove()
    }
  }, [map])

  // Check for time/cardio data warning when starting to edit
  useEffect(() => {
    if (!editorState.isActive || editorState.currentTraceId === null) return

    const trace = tracks.find((t) => t.id === editorState.currentTraceId)
    if (!trace) return

    const hasTimeData = trace.points.some((p) => p.time !== undefined)
    const hasCardioData = trace.points.some(
      (p) => p.hr !== undefined || p.cadence !== undefined
    )

    if (
      (hasTimeData || hasCardioData) &&
      !sessionStorage.getItem(`time-warning-${trace.id}`)
    ) {
      setShowTimeDataWarning(true)
      sessionStorage.setItem(`time-warning-${trace.id}`, 'true')
    }
  }, [editorState.isActive, editorState.currentTraceId, tracks])

  // Create and update point markers when in editor mode
  useEffect(() => {
    if (!editorState.isActive || !currentTrace) return

    // Clear existing markers
    pointMarkersRef.current.forEach((m) => m.remove())

    // Recreate markers
    const markers: L.CircleMarker[] = []

    currentTrace.points.forEach((point, index) => {
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: 5,
        fillColor: '#3b82f6',
        color: '#1e40af',
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.6,
      })
        .addTo(map)
        .on('contextmenu', (e) => {
          L.DomEvent.stopPropagation(e)
          setContextMenu({
            isOpen: true,
            point,
            pointIndex: index,
            position: { x: e.originalEvent.pageX, y: e.originalEvent.pageY },
          })
        })

      markers.push(marker)
    })

    pointMarkersRef.current = markers

    return () => {
      markers.forEach((m) => m.remove())
    }
  }, [editorState.isActive, currentTrace?.points, currentTrace?.id, map])

  // Handle map mousemove for preview line
  const handleMouseMove = (e: L.LeafletMouseEvent) => {
    if (!editorState.isActive || !currentTrace || currentTrace.points.length === 0) {
      if (polylineRef.current) polylineRef.current.setLatLngs([])
      if (previewLabelRef.current) previewLabelRef.current.close()
      return
    }

    const lastPoint = currentTrace.points[currentTrace.points.length - 1]
    const lastLatLng = L.latLng(lastPoint.lat, lastPoint.lng)
    const clickLatLng = e.latlng

    const distance = haversineDistance(lastLatLng, clickLatLng)

    if (polylineRef.current) {
      polylineRef.current.setLatLngs([lastLatLng, clickLatLng])
    }

    if (previewLabelRef.current) {
      const color = getDistanceColor(distance)
      const label = document.createElement('div')
      label.style.background = 'white'
      label.style.color = 'black'
      label.style.padding = '2px 6px'
      label.style.borderRadius = '3px'
      label.style.fontSize = '11px'
      label.style.whiteSpace = 'nowrap'
      label.style.border = `2px solid ${color}`

      if (distance < 1000) {
        label.textContent = `${Math.round(distance)} m`
      } else {
        label.textContent = `${(distance / 1000).toFixed(2)} km`
      }

      previewLabelRef.current.setLatLng(clickLatLng)
      previewLabelRef.current.setContent(label)
      previewLabelRef.current.openOn(map)
    }
  }

  // Request elevations for segment (one point at a time)
  const fetchElevation = async (point: TrackPoint): Promise<TrackPoint> => {
    if (point.ele !== undefined) return point

    try {
      const locations = `${point.lat},${point.lng}`
      const res = await fetch(`/api/elevation?locations=${encodeURIComponent(locations)}`)
      if (!res.ok) return point

      const data = await res.json()
      const elevation = data.results?.[0]?.elevation

      return elevation !== undefined ? { ...point, ele: elevation } : point
    } catch {
      return point
    }
  }

  // Get routed segment from GraphHopper
  const getRoutedSegment = async (start: TrackPoint, end: L.LatLng): Promise<RouteSegment | null> => {
    routingAbortRef.current?.abort()
    routingAbortRef.current = new AbortController()

    try {
      const points = [
        `${start.lat},${start.lng}`,
        `${end.lat},${end.lng}`,
      ]

      const res = await fetch(
        `/api/routing?${points.map((p) => `point=${encodeURIComponent(p)}`).join('&')}&profile=hike`,
        { signal: routingAbortRef.current.signal }
      )

      if (!res.ok) return null

      const data = await res.json()
      const coords = data.paths?.[0]?.points?.coordinates

      if (!coords || coords.length === 0) return null

      const routePoints: TrackPoint[] = coords.map((coord: [number, number]) => ({
        lat: coord[1],
        lng: coord[0],
      }))

      // Fetch elevations for route points (sampling every 5th point to avoid too many API calls)
      const elevatedPoints = await Promise.all(
        routePoints.map(async (p, i) => {
          if (i % 5 === 0) return await fetchElevation(p)
          return p
        })
      )
      return { points: elevatedPoints, isRouted: true }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        console.error('Routing error:', e)
      }
      return null
    }
  }

  // Add pulsing line between current position and routing target
  const showPulsingLine = (from: L.LatLng, to: L.LatLng) => {
    if (pulsingLine) pulsingLine.remove()

    const line = L.polyline([from, to], {
      color: '#999',
      weight: 3,
      opacity: 0.3,
      dashArray: '5,5',
      className: 'pulsing-line',
    }).addTo(map)

    setPulsingLine(line)
  }

  // Handle map click
  const handleMapClick = async (e: L.LeafletMouseEvent) => {
    if (!editorState.isActive || !currentTrace) return

    const clickLatLng = e.latlng
    const currentPoints = currentTrace.points

    // If no points yet, start trace
    if (currentPoints.length === 0) {
      const newPoint: TrackPoint = {
        lat: clickLatLng.lat,
        lng: clickLatLng.lng,
      }
      addPointToCurrentTrace(newPoint)
      return
    }

    const lastPoint = currentPoints[currentPoints.length - 1]
    const lastLatLng = L.latLng(lastPoint.lat, lastPoint.lng)

    // Check for nearby points
    const ownTraceIndex = findNearbyPoint(clickLatLng, currentPoints, map)
    const otherTracesNearby = tracks.filter((t) => t.id !== currentTrace.id)

    let nearbyOtherIndex = -1
    for (const otherTrace of otherTracesNearby) {
      const index = findNearbyPoint(clickLatLng, otherTrace.points, map)
      if (index !== null) {
        nearbyOtherIndex = index
        break
      }
    }

    // Case 1: Close to own trace point - drag mode (not implemented in this phase)
    if (ownTraceIndex !== null) {
      // Placeholder for drag mode in phase 4
      return
    }

    // Case 2: Close to other trace point - trace following (not implemented in this phase)
    if (nearbyOtherIndex !== -1) {
      // Placeholder for trace following in phase 4
      return
    }

    // Case 3: Add new point (free or routed mode)
    setIsDrawing(true)

    if (editorState.drawingMode === 'free') {
      // Free mode: straight line
      const newPoint: TrackPoint = {
        lat: clickLatLng.lat,
        lng: clickLatLng.lng,
      }

      // Try to get elevation
      const elevatedPoint = await fetchElevation(newPoint)
      addPointToCurrentTrace(elevatedPoint)
      simplifyIfNeeded()
      setIsDrawing(false)
    } else {
      // Routed mode: call GraphHopper
      showPulsingLine(lastLatLng, clickLatLng)
      map.getContainer().style.cursor = 'wait'

      const routedSegment = await getRoutedSegment(lastPoint, clickLatLng)
      if (pulsingLine) {
        pulsingLine.remove()
        setPulsingLine(null)
      }
      map.getContainer().style.cursor = ''

      if (routedSegment && routedSegment.points.length > 0) {
        // Add all routed points to trace
        for (const point of routedSegment.points) {
          addPointToCurrentTrace(point)
        }
        simplifyIfNeeded()
      } else {
        // Fallback: add straight line and show error
        const newPoint: TrackPoint = {
          lat: clickLatLng.lat,
          lng: clickLatLng.lng,
        }
        const elevatedPoint = await fetchElevation(newPoint)
        addPointToCurrentTrace(elevatedPoint)
        simplifyIfNeeded()

        // Show error message
        setErrorMessage('Aucun chemin trouvé — tracé direct')
        setTimeout(() => setErrorMessage(null), 1000)
      }

      setIsDrawing(false)
    }
  }

  // Simplify trace if angle < 5°
  const simplifyIfNeeded = () => {
    if (!currentTrace || currentTrace.points.length < 3) return

    const pts = currentTrace.points
    const n = pts.length
    const p1 = L.latLng(pts[n - 3].lat, pts[n - 3].lng)
    const p2 = L.latLng(pts[n - 2].lat, pts[n - 2].lng)
    const p3 = L.latLng(pts[n - 1].lat, pts[n - 1].lng)

    if (shouldSimplify(p1, p2, p3)) {
      // Remove middle point and undo to previous state
      const simplified = [...pts.slice(0, -2), pts[n - 1]]
      updateTrack(currentTrace.id, {
        points: simplified,
        stats: computeTrackStats(simplified),
      })
    }
  }

  // Handle double-click to finish
  const handleDoubleClick = () => {
    if (editorState.isActive) {
      useTracksStore.getState().stopEditing()
    }
  }

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editorState.isActive) {
        useTracksStore.getState().stopEditing()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [editorState.isActive])

  // Set map cursor to crosshair when editor is active
  useEffect(() => {
    if (editorState.isActive) {
      map.getContainer().style.cursor = 'crosshair'
    } else {
      map.getContainer().style.cursor = ''
    }
  }, [editorState.isActive, map])

  // Handle right-click on map (contextmenu)
  const handleContextMenu = (e: L.LeafletMouseEvent) => {
    if (!editorState.isActive) return

    // Check if clicked on a point
    const clickLatLng = e.latlng
    const pointIndex = findNearbyPoint(clickLatLng, currentTrace?.points || [], map)

    if (pointIndex !== null && currentTrace) {
      L.DomEvent.stopPropagation(e)
      setContextMenu({
        isOpen: true,
        point: currentTrace.points[pointIndex],
        pointIndex,
        position: { x: e.originalEvent.pageX, y: e.originalEvent.pageY },
      })
    }
  }

  // Register map events
  useMapEvents({
    click: handleMapClick,
    mousemove: handleMouseMove,
    dblclick: handleDoubleClick,
    contextmenu: handleContextMenu,
  })

  // Error message and time data warning popups
  useEffect(() => {
    if (!errorMessage && !showTimeDataWarning) return

    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.bottom = '80px'
    container.style.left = '50%'
    container.style.transform = 'translateX(-50%)'
    container.style.background = 'white'
    container.style.color = 'black'
    container.style.padding = '8px 12px'
    container.style.borderRadius = '4px'
    container.style.fontSize = '12px'
    container.style.pointerEvents = 'auto'
    container.style.zIndex = '9999'
    container.style.border = showTimeDataWarning ? '1px solid #f59e0b' : 'none'
    container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
    container.textContent = showTimeDataWarning
      ? 'Modifier cette trace supprimera les données temporelles et physiologiques des points édités.'
      : errorMessage || ''

    if (showTimeDataWarning) {
      const closeBtn = document.createElement('button')
      closeBtn.textContent = '✕'
      closeBtn.style.marginLeft = '8px'
      closeBtn.style.background = 'none'
      closeBtn.style.border = 'none'
      closeBtn.style.cursor = 'pointer'
      closeBtn.style.fontSize = '16px'
      closeBtn.style.color = '#666'
      closeBtn.onclick = () => setShowTimeDataWarning(false)
      container.appendChild(closeBtn)
    }

    document.body.appendChild(container)

    let timer: NodeJS.Timeout
    if (!showTimeDataWarning && errorMessage) {
      timer = setTimeout(() => {
        container.remove()
        setErrorMessage(null)
      }, 1000)
    }

    return () => {
      if (timer) clearTimeout(timer)
      container.remove()
    }
  }, [errorMessage, showTimeDataWarning])

  return contextMenu.isOpen && contextMenu.point && contextMenu.pointIndex !== null ? (
    <ContextMenu
      point={contextMenu.point}
      pointIndex={contextMenu.pointIndex}
      position={contextMenu.position}
      onClose={() => setContextMenu({ isOpen: false, point: null, pointIndex: null, position: { x: 0, y: 0 } })}
    />
  ) : null
}
