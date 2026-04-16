import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Track, TrackPoint } from '@/types'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/constants'

interface MapSettings {
  center: [number, number]
  zoom: number
  activeTileLayerId: string
  activeOverlayIds: string[]
  overlayOpacities: Record<string, number>
}

interface EditorState {
  isActive: boolean
  currentTraceId: string | null
  drawingMode: 'free' | 'routed'
  isDrawing: boolean
}

interface TraceSnapshot {
  points: Track['points']
}

interface TracksState {
  tracks: Track[]
  activeTrackId: string | null
  mapSettings: MapSettings
  pendingFitBoundsId: string | null
  editorState: EditorState
  history: TraceSnapshot[]
  historyIndex: number

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

  // Editor actions
  startEditing: (traceId: string) => void
  startNewTrace: () => void
  stopEditing: () => void
  setDrawingMode: (mode: 'free' | 'routed') => void
  setIsDrawing: (isDrawing: boolean) => void
  addPointToCurrentTrace: (point: TrackPoint) => void
  undoLastSegment: () => void
  redoSegment: () => void
}

const DEFAULT_MAP_SETTINGS: MapSettings = {
  center: DEFAULT_MAP_CENTER,
  zoom: DEFAULT_MAP_ZOOM,
  activeTileLayerId: 'tf-locus',
  activeOverlayIds: [],
  overlayOpacities: {},
}

const DEFAULT_EDITOR_STATE: EditorState = {
  isActive: false,
  currentTraceId: null,
  drawingMode: 'free',
  isDrawing: false,
}

export const useTracksStore = create<TracksState>()(
  persist(
    (set) => ({
      tracks: [],
      activeTrackId: null,
      pendingFitBoundsId: null,
      mapSettings: DEFAULT_MAP_SETTINGS,
      editorState: DEFAULT_EDITOR_STATE,
      history: [],
      historyIndex: -1,

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

      startEditing: (traceId) =>
        set((state) => {
          const trace = state.tracks.find((t) => t.id === traceId)
          if (!trace) return state
          return {
            editorState: {
              isActive: true,
              currentTraceId: traceId,
              drawingMode: 'free',
              isDrawing: false,
            },
            history: [{ points: [...trace.points] }],
            historyIndex: 0,
          }
        }),

      startNewTrace: () =>
        set((state) => {
          const newId = Math.random().toString(36).slice(2, 11)
          const now = new Date()
          const dateStr = now.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
          const timeStr = now.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })

          const newTrace: Track = {
            id: newId,
            name: `Trace du ${dateStr} ${timeStr}`,
            color: '#ef4444',
            points: [],
            visible: true,
            opacity: 0.8,
            weight: 3,
            stats: { distance: 0, elevationGain: 0, elevationLoss: 0, maxElevation: 0, minElevation: 0 },
          }

          if (state.tracks.length >= 20) return state

          return {
            tracks: [...state.tracks, newTrace],
            activeTrackId: newId,
            editorState: {
              isActive: true,
              currentTraceId: newId,
              drawingMode: 'free',
              isDrawing: false,
            },
            history: [{ points: [] }],
            historyIndex: 0,
          }
        }),

      stopEditing: () =>
        set({
          editorState: DEFAULT_EDITOR_STATE,
          history: [],
          historyIndex: -1,
        }),

      setDrawingMode: (mode) =>
        set((state) => ({
          editorState: { ...state.editorState, drawingMode: mode },
        })),

      setIsDrawing: (isDrawing) =>
        set((state) => ({
          editorState: { ...state.editorState, isDrawing },
        })),

      addPointToCurrentTrace: (point) =>
        set((state) => {
          const { currentTraceId, isActive } = state.editorState
          if (!isActive || !currentTraceId) return state

          const traceIndex = state.tracks.findIndex((t) => t.id === currentTraceId)
          if (traceIndex === -1) return state

          const updatedTracks = [...state.tracks]
          const updatedTrace = { ...updatedTracks[traceIndex] }
          updatedTrace.points = [...updatedTrace.points, point]
          updatedTracks[traceIndex] = updatedTrace

          // Save snapshot to history
          const newHistory = state.history.slice(0, state.historyIndex + 1)
          newHistory.push({ points: [...updatedTrace.points] })

          return {
            tracks: updatedTracks,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          }
        }),

      undoLastSegment: () =>
        set((state) => {
          if (state.historyIndex <= 0) return state

          const newIndex = state.historyIndex - 1
          const snapshot = state.history[newIndex]
          const { currentTraceId } = state.editorState

          if (!currentTraceId) return state

          const traceIndex = state.tracks.findIndex((t) => t.id === currentTraceId)
          if (traceIndex === -1) return state

          const updatedTracks = [...state.tracks]
          updatedTracks[traceIndex] = {
            ...updatedTracks[traceIndex],
            points: [...snapshot.points],
          }

          return {
            tracks: updatedTracks,
            historyIndex: newIndex,
          }
        }),

      redoSegment: () =>
        set((state) => {
          if (state.historyIndex >= state.history.length - 1) return state

          const newIndex = state.historyIndex + 1
          const snapshot = state.history[newIndex]
          const { currentTraceId } = state.editorState

          if (!currentTraceId) return state

          const traceIndex = state.tracks.findIndex((t) => t.id === currentTraceId)
          if (traceIndex === -1) return state

          const updatedTracks = [...state.tracks]
          updatedTracks[traceIndex] = {
            ...updatedTracks[traceIndex],
            points: [...snapshot.points],
          }

          return {
            tracks: updatedTracks,
            historyIndex: newIndex,
          }
        }),
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
              activeTileLayerId: 'tf-locus',
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
