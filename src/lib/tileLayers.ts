import type { ApiKeys } from './apiKeys'

export type TileLayerGroup = 'Monde' | 'IGN France' | 'Swisstopo' | 'Thunderforest'

export interface TileLayerConfig {
  id: string
  name: string
  url: string
  attribution: string
  group: TileLayerGroup
  maxZoom?: number
  requiresKey?: 'ign' | 'thunderforest'
  isOverlay?: boolean
  defaultOpacity?: number
}

export const TILE_LAYERS: TileLayerConfig[] = [
  // ── Monde ──────────────────────────────────────────────────────────────────
  {
    id: 'osm',
    name: 'OSM Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    group: 'Monde',
    maxZoom: 19,
  },
  {
    id: 'refuge',
    name: 'Refuge Info',
    url: 'https://maps.refuges.info/hiking/{z}/{x}/{y}.png',
    attribution: '© maps.refuges.info, © OSM contributors',
    group: 'Monde',
    maxZoom: 17,
  },

  // ── IGN France ─────────────────────────────────────────────────────────────
  {
    id: 'ign-plan',
    name: 'Plan IGN',
    url: 'https://data.geopf.fr/wmts?Service=WMTS&Request=GetTile&Version=1.0.0&Layer=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&Style=normal&Format=image/png&TileMatrixSet=PM&TileMatrix={z}&TileRow={y}&TileCol={x}',
    attribution: '© IGN Géoportail',
    group: 'IGN France',
    maxZoom: 18,
  },
  {
    id: 'ign-satellite',
    name: 'IGN Satellite',
    url: 'https://data.geopf.fr/wmts?Service=WMTS&Request=GetTile&Version=1.0.0&Layer=ORTHOIMAGERY.ORTHOPHOTOS&Style=normal&Format=image/jpeg&TileMatrixSet=PM&TileMatrix={z}&TileRow={y}&TileCol={x}',
    attribution: '© IGN Géoportail',
    group: 'IGN France',
    maxZoom: 19,
  },
  {
    id: 'ign-topo',
    name: 'IGN Carte Topo',
    url: 'https://data.geopf.fr/private/wmts?SERVICE=WMTS&VERSION=1.0.0&apikey={KEY}&layer=GEOGRAPHICALGRIDSYSTEMS.MAPS&style=normal&tilematrixset=PM&Request=GetTile&Format=image%2Fjpeg&TileMatrix={z}&TileCol={x}&TileRow={y}',
    attribution: '© IGN Géoportail',
    group: 'IGN France',
    requiresKey: 'ign',
    maxZoom: 16,
  },
  {
    id: 'ign-scan25',
    name: 'IGN SCAN25',
    url: 'https://data.geopf.fr/private/wmts?SERVICE=WMTS&VERSION=1.0.0&apikey={KEY}&layer=GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR&style=normal&tilematrixset=PM&Request=GetTile&Format=image%2Fjpeg&TileMatrix={z}&TileCol={x}&TileRow={y}',
    attribution: '© IGN Géoportail',
    group: 'IGN France',
    requiresKey: 'ign',
    maxZoom: 16,
  },
  {
    id: 'ign-scan100',
    name: 'IGN SCAN100',
    url: 'https://data.geopf.fr/private/wmts?SERVICE=WMTS&VERSION=1.0.0&apikey={KEY}&layer=SCAN100_PYR-JPEG_WLD_WM&style=normal&tilematrixset=PM&Request=GetTile&Format=image%2Fjpeg&TileMatrix={z}&TileCol={x}&TileRow={y}',
    attribution: '© IGN Géoportail',
    group: 'IGN France',
    requiresKey: 'ign',
    maxZoom: 14,
  },
  {
    id: 'ign-littoral',
    name: 'IGN Littoral',
    url: 'https://data.geopf.fr/wmts?layer=GEOGRAPHICALGRIDSYSTEMS.COASTALMAPS&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix={z}&TileCol={x}&TileRow={y}',
    attribution: '© IGN Géoportail',
    group: 'IGN France',
    maxZoom: 16,
  },

  // ── Swisstopo ──────────────────────────────────────────────────────────────
  {
    id: 'swiss-topo',
    name: 'Swiss Topo',
    url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg',
    attribution: '© swisstopo',
    group: 'Swisstopo',
    maxZoom: 18,
  },
  {
    id: 'swiss-image',
    name: 'Swiss Image',
    url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg',
    attribution: '© swisstopo',
    group: 'Swisstopo',
    maxZoom: 19,
  },
  {
    id: 'swiss-25k',
    name: 'Swiss 25k',
    url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe-pk25.noscale/default/current/3857/{z}/{x}/{y}.jpeg',
    attribution: '© swisstopo',
    group: 'Swisstopo',
    maxZoom: 17,
  },

  // ── Thunderforest ──────────────────────────────────────────────────────────
  {
    id: 'tf-outdoors',
    name: 'TF Outdoors',
    url: 'https://tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey={KEY}',
    attribution: '© Thunderforest, © OSM contributors',
    group: 'Thunderforest',
    requiresKey: 'thunderforest',
    maxZoom: 22,
  },
  {
    id: 'tf-locus',
    name: 'TF Locus',
    url: 'https://tile.thunderforest.com/locus-4za/{z}/{x}/{y}.png?apikey={KEY}',
    attribution: '© Thunderforest, © OSM contributors',
    group: 'Thunderforest',
    requiresKey: 'thunderforest',
    maxZoom: 22,
  },
]

export const OVERLAY_LAYERS: TileLayerConfig[] = [
  // ── IGN France ─────────────────────────────────────────────────────────────
  {
    id: 'ign-pentes',
    name: 'Pentes montagne',
    url: 'https://data.geopf.fr/wmts?Service=WMTS&Request=GetTile&Version=1.0.0&Layer=GEOGRAPHICALGRIDSYSTEMS.SLOPES.MOUNTAIN&Style=normal&Format=image/png&TileMatrixSet=PM&TileMatrix={z}&TileRow={y}&TileCol={x}',
    attribution: '© IGN Géoportail',
    group: 'IGN France',
    isOverlay: true,
    defaultOpacity: 0.5,
  },
  {
    id: 'ign-ski',
    name: 'Itinéraires ski',
    url: 'https://data.geopf.fr/wmts?Service=WMTS&Request=GetTile&Version=1.0.0&Layer=TRACES.RANDO.HIVERNALE&Style=normal&Format=image/png&TileMatrixSet=PM&TileMatrix={z}&TileRow={y}&TileCol={x}',
    attribution: '© IGN Géoportail',
    group: 'IGN France',
    isOverlay: true,
    defaultOpacity: 0.8,
  },

  // ── Swisstopo ──────────────────────────────────────────────────────────────
  {
    id: 'swiss-trails',
    name: 'Sentiers rando',
    url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swisstlm3d-wanderwege/default/current/3857/{z}/{x}/{y}.png',
    attribution: '© swisstopo',
    group: 'Swisstopo',
    isOverlay: true,
    defaultOpacity: 0.9,
  },
  {
    id: 'swiss-pentes30',
    name: 'Pentes > 30°',
    url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.hangneigung-ueber_30/default/current/3857/{z}/{x}/{y}.png',
    attribution: '© swisstopo',
    group: 'Swisstopo',
    isOverlay: true,
    defaultOpacity: 0.6,
  },
  {
    id: 'swiss-ski',
    name: 'Ski touring',
    url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo-karto.skitouren/default/current/3857/{z}/{x}/{y}.png',
    attribution: '© swisstopo',
    group: 'Swisstopo',
    isOverlay: true,
    defaultOpacity: 0.8,
  },
  {
    id: 'swiss-velo',
    name: 'Véloland Suisse',
    url: 'https://wmts.geo.admin.ch/1.0.0/ch.astra.veloland/default/current/3857/{z}/{x}/{y}.png',
    attribution: '© swisstopo',
    group: 'Swisstopo',
    isOverlay: true,
    defaultOpacity: 0.8,
  },
  {
    id: 'swiss-mtb',
    name: 'VTT Suisse',
    url: 'https://wmts.geo.admin.ch/1.0.0/ch.astra.mountainbikeland/default/current/3857/{z}/{x}/{y}.png',
    attribution: '© swisstopo',
    group: 'Swisstopo',
    isOverlay: true,
    defaultOpacity: 0.8,
  },
  {
    id: 'swiss-faune',
    name: 'Zones tranquillité faune',
    url: 'https://wmts.geo.admin.ch/1.0.0/ch.bafu.wrz-wildruhezonen_portal/default/current/3857/{z}/{x}/{y}.png',
    attribution: '© swisstopo',
    group: 'Swisstopo',
    isOverlay: true,
    defaultOpacity: 0.5,
  },

  // ── Monde ──────────────────────────────────────────────────────────────────
  {
    id: 'courbes-niveau',
    name: 'Courbes de niveau',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap, © OSM contributors',
    group: 'Monde',
    isOverlay: true,
    defaultOpacity: 0.5,
    maxZoom: 17,
  },
]

/** Remplace {KEY} dans l'URL par la clé appropriée. */
export function resolveUrl(layer: TileLayerConfig, keys: ApiKeys): string {
  if (!layer.requiresKey) return layer.url
  const key = keys[layer.requiresKey]
  if (!key) return layer.url
  return layer.url.replace('{KEY}', key)
}

/** Lookup rapide par id. */
export function getTileLayerById(id: string): TileLayerConfig | undefined {
  return TILE_LAYERS.find((l) => l.id === id)
}

export function getOverlayById(id: string): TileLayerConfig | undefined {
  return OVERLAY_LAYERS.find((l) => l.id === id)
}
