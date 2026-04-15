'use client'

import { TileLayer } from 'react-leaflet'
import { useTracksStore } from '@/store/tracks'
import { TILE_LAYERS, OVERLAY_LAYERS, resolveUrl, getTileLayerById } from '@/lib/tileLayers'
import { getApiKeys } from '@/lib/apiKeys'

export default function TileLayerManager() {
  const { activeTileLayerId, activeOverlayIds, overlayOpacities } = useTracksStore(
    (s) => s.mapSettings,
  )

  const keys = getApiKeys()

  const activeTile =
    getTileLayerById(activeTileLayerId) ?? TILE_LAYERS.find((l) => l.id === 'osm')!

  return (
    <>
      <TileLayer
        key={activeTile.id}
        url={resolveUrl(activeTile, keys)}
        attribution={activeTile.attribution}
        maxZoom={activeTile.maxZoom ?? 19}
      />
      {activeOverlayIds.map((id) => {
        const layer = OVERLAY_LAYERS.find((l) => l.id === id)
        if (!layer) return null
        const opacity = overlayOpacities[id] ?? layer.defaultOpacity ?? 0.7
        return (
          <TileLayer
            key={id}
            url={resolveUrl(layer, keys)}
            attribution={layer.attribution}
            opacity={opacity}
            maxZoom={layer.maxZoom ?? 19}
          />
        )
      })}
    </>
  )
}
