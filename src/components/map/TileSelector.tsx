'use client'

import { TILE_LAYERS, OVERLAY_LAYERS, type TileLayerConfig, type TileLayerGroup } from '@/lib/tileLayers'
import { getApiKeys } from '@/lib/apiKeys'
import { useTracksStore } from '@/store/tracks'

const GROUP_ORDER: TileLayerGroup[] = ['Monde', 'IGN France', 'Swisstopo', 'Thunderforest']

function groupBy<T extends { group: TileLayerGroup }>(items: T[]): { group: TileLayerGroup; items: T[] }[] {
  return GROUP_ORDER
    .map((group) => ({ group, items: items.filter((l) => l.group === group) }))
    .filter((g) => g.items.length > 0)
}

function LockIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

interface TileButtonProps {
  layer: TileLayerConfig
  isActive: boolean
  locked: boolean
  onClick: () => void
}

function TileButton({ layer, isActive, locked, onClick }: TileButtonProps) {
  return (
    <button
      onClick={locked ? undefined : onClick}
      disabled={locked}
      title={locked ? 'Clé API requise — configurez vos clés dans Paramètres' : layer.name}
      className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 transition-colors ${
        locked
          ? 'text-gray-400 cursor-not-allowed'
          : isActive
          ? 'bg-blue-50 text-blue-700 font-medium'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span className="flex-1 truncate">{layer.name}</span>
      {locked && <LockIcon />}
    </button>
  )
}

export default function TileSelector() {
  const { activeTileLayerId, activeOverlayIds, overlayOpacities } = useTracksStore(
    (s) => s.mapSettings,
  )
  const setActiveTileLayer = useTracksStore((s) => s.setActiveTileLayer)
  const toggleOverlay = useTracksStore((s) => s.toggleOverlay)
  const setOverlayOpacity = useTracksStore((s) => s.setOverlayOpacity)

  const keys = getApiKeys()
  const hasKey = (provider: 'ign' | 'thunderforest') => !!keys[provider]

  const baseGroups = groupBy(TILE_LAYERS)
  const overlayGroups = groupBy(OVERLAY_LAYERS)

  return (
    <div className="p-3 border-b border-gray-100 space-y-3">
      {/* ── Fonds de carte ── */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Fond de carte
        </h3>
        {baseGroups.map(({ group, items }) => (
          <div key={group} className="mb-2">
            <p className="text-[11px] font-medium text-gray-400 px-2 mb-0.5">{group}</p>
            {items.map((layer) => {
              const locked = !!layer.requiresKey && !hasKey(layer.requiresKey)
              return (
                <TileButton
                  key={layer.id}
                  layer={layer}
                  isActive={activeTileLayerId === layer.id}
                  locked={locked}
                  onClick={() => setActiveTileLayer(layer.id)}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* ── Calques ── */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Calques
        </h3>
        {overlayGroups.map(({ group, items }) => (
          <div key={group} className="mb-2">
            <p className="text-[11px] font-medium text-gray-400 px-2 mb-0.5">{group}</p>
            {items.map((layer) => {
              const isActive = activeOverlayIds.includes(layer.id)
              const opacity = overlayOpacities[layer.id] ?? layer.defaultOpacity ?? 0.7
              return (
                <div key={layer.id}>
                  <label className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => toggleOverlay(layer.id, layer.defaultOpacity)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
                    />
                    <span className="flex-1 truncate">{layer.name}</span>
                  </label>
                  {isActive && (
                    <div className="flex items-center gap-2 px-2 pb-1.5">
                      <span className="text-[11px] text-gray-400 w-14 shrink-0">Opacité</span>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={opacity}
                        onChange={(e) =>
                          setOverlayOpacity(layer.id, parseFloat(e.target.value))
                        }
                        className="flex-1 h-1.5 accent-blue-600"
                      />
                      <span className="text-[11px] text-gray-500 w-8 text-right shrink-0">
                        {Math.round(opacity * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
