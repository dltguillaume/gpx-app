'use client'

import { useEffect, useRef } from 'react'
import { MapContainer as LeafletMap, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTracksStore } from '@/store/tracks'
import TileLayerManager from './TileLayerManager'
import TraceLayer from './TraceLayer'
import SearchBar from './SearchBar'
import GeolocationButton from './GeolocationButton'
import MeasureTool from './MeasureTool'
import TileLayerControl from './TileLayerControl'

// Corrige l'icône par défaut de Leaflet avec les bundlers
function fixLeafletIcons() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

function MapFitBounds() {
  const map = useMap()
  const pendingFitBoundsId = useTracksStore((s) => s.pendingFitBoundsId)
  const clearPendingFitBounds = useTracksStore((s) => s.clearPendingFitBounds)
  const tracks = useTracksStore((s) => s.tracks)

  useEffect(() => {
    if (!pendingFitBoundsId) return
    const track = tracks.find((t) => t.id === pendingFitBoundsId)
    if (!track || track.points.length === 0) return

    const latLngs = track.points.map((p) => L.latLng(p.lat, p.lng))
    const bounds = L.latLngBounds(latLngs)
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16, animate: true })
    clearPendingFitBounds()
  }, [pendingFitBoundsId, tracks, map, clearPendingFitBounds])

  return null
}

function MapEventHandler() {
  const setMapSettings = useTracksStore((s) => s.setMapSettings)

  useMapEvents({
    moveend: (e) => {
      const map = e.target as L.Map
      const c = map.getCenter()
      setMapSettings({ center: [c.lat, c.lng], zoom: map.getZoom() })
    },
  })

  return null
}

function ControlsContainer() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      L.DomEvent.disableClickPropagation(containerRef.current)
      L.DomEvent.disableScrollPropagation(containerRef.current)
    }
  }, [])

  return (
    <div ref={containerRef} className="absolute bottom-6 left-3 z-[1000] flex flex-col gap-2">
      <TileLayerControl />
      <MeasureTool />
      <GeolocationButton />
    </div>
  )
}

export default function MapContainer() {
  const { mapSettings } = useTracksStore()

  useEffect(() => {
    fixLeafletIcons()
  }, [])

  return (
    <LeafletMap
      center={mapSettings.center}
      zoom={mapSettings.zoom}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayerManager />
      <TraceLayer />
      <MapFitBounds />
      <MapEventHandler />
      <SearchBar />
      <ControlsContainer />
    </LeafletMap>
  )
}
