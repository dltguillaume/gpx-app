'use client'

import { useEffect, useState } from 'react'
import { TileLayer, useMap } from 'react-leaflet'
import { useTracksStore } from '@/store/tracks'
import { TILE_LAYERS, OVERLAY_LAYERS, resolveUrl, getTileLayerById } from '@/lib/tileLayers'
import { getApiKeys } from '@/lib/apiKeys'

export default function TileLayerManager() {
  const { activeTileLayerId, activeOverlayIds, overlayOpacities } = useTracksStore(
    (s) => s.mapSettings,
  )

  const map = useMap()
  const keys = getApiKeys()
  const [paneReady, setPaneReady] = useState(false)

  useEffect(() => {
    if (!map || !map.getContainer()) return
    try {
      if (!map.getPane('multiplyPane')) {
        map.createPane('multiplyPane')
        const pane = map.getPane('multiplyPane')
        if (pane) {
          pane.style.mixBlendMode = 'multiply'
          pane.style.zIndex = '450'
        }
      }
    } catch (e) { console.warn('pane creation failed', e) }
    setPaneReady(true)
  }, [map])

  const activeTile = getTileLayerById(activeTileLayerId) ?? TILE_LAYERS[0]

  return (
    <>
      {activeTile && (
        <TileLayer
          key={activeTile.id}
          url={activeTile ? resolveUrl(activeTile, keys) : ''}
          attribution={activeTile.attribution}
          maxZoom={activeTile.maxZoom ?? 19}
        />
      )}
      {paneReady && activeOverlayIds.map((id) => {
        const layer = OVERLAY_LAYERS.find((l) => l.id === id)
        if (!layer) return null
        const opacity = overlayOpacities[id] ?? layer.defaultOpacity ?? 0.7
        const pane = layer.blendMode === 'multiply' ? 'multiplyPane' : 'overlayPane'
        return (
          <TileLayer
            key={id}
            url={resolveUrl(layer, keys)}
            attribution={layer.attribution}
            opacity={opacity}
            maxZoom={layer.maxZoom ?? 19}
            pane={pane}
          />
        )
      })}
    </>
  )
}
