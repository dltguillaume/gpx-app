import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Track } from '@/types'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/constants'

interface MapSettings {
  center: [number, number]
  zoom: number
  activeTileLayerId: string
  activeOverlayIds: string[]
  overlayOpacities: Record<string, number>
}

interface TracksState {
  tracks: Track[]
  activeTrackId: string | null
  mapSettings: MapSettings
  pendingFitBoundsId: string | null

  addTrack: (track: Track) => void
  removeTrack: (id: string) => void
  setActiveTrack: (id: string | null) => void
  updateTrack: (id: string, updates: Partial<Track>) => void
  /** Met à jour center/zoom depuis les événements carte. */
  setMapSettings: (settings: Partial<Pick<MapSettings, 'center' | 'zoom'>>) => void
  setActiveTileLayer: (id: string) => void
  toggleOverlay: (id: string, defaultOpacity?: number) => void
  setOverlayOpacity: (id: string, opacity: number) => void
  clearPendingFitBounds: () => void
}

const DEFAULT_MAP_SETTINGS: MapSettings = {
  center: DEFAULT_MAP_CENTER,
  zoom: DEFAULT_MAP_ZOOM,
  activeTileLayerId: 'osm',
  activeOverlayIds: [],
  overlayOpacities: {},
}

export const useTracksStore = create<TracksState>()(
  persist(
    (set) => ({
      tracks: [],
      activeTrackId: null,
      pendingFitBoundsId: null,
      mapSettings: DEFAULT_MAP_SETTINGS,

      addTrack: (track) =>
        set((state) => {
          if (state.tracks.length >= 20) return state
          return {
            tracks: [...state.tracks, track],
            activeTrackId: track.id,
            pendingFitBoundsId: track.id,
          }
        }),

      removeTrack: (id) =>
        set((state) => {
          const remaining = state.tracks.filter((t) => t.id !== id)
          return {
            tracks: remaining,
            activeTrackId:
              state.activeTrackId === id
                ? (remaining[0]?.id ?? null)
                : state.activeTrackId,
          }
        }),

      setActiveTrack: (id) => set({ activeTrackId: id }),

      updateTrack: (id, updates) =>
        set((state) => ({
          tracks: state.tracks.map((t) =>
            t.id === id ? { ...t, ...updates } : t,
          ),
        })),

      setMapSettings: (settings) =>
        set((state) => ({
          mapSettings: { ...state.mapSettings, ...settings },
        })),

      setActiveTileLayer: (id) =>
        set((state) => ({
          mapSettings: { ...state.mapSettings, activeTileLayerId: id },
        })),

      toggleOverlay: (id, defaultOpacity) =>
        set((state) => {
          const { activeOverlayIds, overlayOpacities } = state.mapSettings
          const isActive = activeOverlayIds.includes(id)
          if (isActive) {
            return {
              mapSettings: {
                ...state.mapSettings,
                activeOverlayIds: activeOverlayIds.filter((o) => o !== id),
              },
            }
          }
          return {
            mapSettings: {
              ...state.mapSettings,
              activeOverlayIds: [...activeOverlayIds, id],
              overlayOpacities: overlayOpacities[id]
                ? overlayOpacities
                : { ...overlayOpacities, [id]: defaultOpacity ?? 0.7 },
            },
          }
        }),

      setOverlayOpacity: (id, opacity) =>
        set((state) => ({
          mapSettings: {
            ...state.mapSettings,
            overlayOpacities: { ...state.mapSettings.overlayOpacities, [id]: opacity },
          },
        })),

      clearPendingFitBounds: () => set({ pendingFitBoundsId: null }),
    }),
    {
      name: 'mapsgps-settings',
      version: 1,
      partialize: (state) => ({ mapSettings: state.mapSettings }),
      migrate: (persisted, version) => {
        // v0 → v1 : renommage activeTileLayer → activeTileLayerId, activeOverlays → activeOverlayIds
        if (version === 0) {
          const old = persisted as {
            mapSettings?: {
              center?: [number, number]
              zoom?: number
              activeTileLayer?: string
              activeOverlays?: string[]
            }
          }
          return {
            mapSettings: {
              center: old.mapSettings?.center ?? DEFAULT_MAP_CENTER,
              zoom: old.mapSettings?.zoom ?? DEFAULT_MAP_ZOOM,
              activeTileLayerId: 'osm',
              activeOverlayIds: [],
              overlayOpacities: {},
            },
          }
        }
        return persisted
      },
    },
  ),
)
