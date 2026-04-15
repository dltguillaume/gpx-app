# MapsGPS — Guide pour Claude Code

Application web de visualisation et d'édition de traces GPS, inspirée de MyGPSFiles, VisuGPX, TraceDeTrail, AllTrails et Komoot. Projet local-first : aucun compte utilisateur requis, tout fonctionne dans le navigateur.

---

## Stack technique

- **Framework** : Next.js (App Router, TypeScript)
- **Styling** : Tailwind CSS
- **Carte** : Leaflet.js + React-Leaflet (chargement dynamique côté client uniquement — `ssr: false`)
- **Dessin/édition** : Leaflet.pm
- **Routage automatique** : Leaflet Routing Machine + GraphHopper API (clé fournie par l'utilisateur)
- **Parsing GPX/TCX/FIT** : gpxparser + fit-parser
- **Export GPX** : fonction maison (XML)
- **Graphiques** : Recharts
- **État global** : Zustand
- **Altimétrie** : OpenTopoData API (mondial, gratuit)
- **Déploiement** : Vercel

---

## Règle critique — Leaflet et SSR

Leaflet manipule le DOM directement. Ne jamais l'importer côté serveur.
Toujours utiliser le chargement dynamique :

```tsx
const MapContainer = dynamic(() => import('@/components/map/MapContainer'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" />
})
```

---

## Architecture des composants

```
src/
├── app/
│   ├── layout.tsx
│   └── page.tsx                    ← Layout principal (carte plein écran)
│
├── components/
│   ├── map/
│   │   ├── MapContainer.tsx        ← Init Leaflet, gestion layers
│   │   ├── TileLayerManager.tsx    ← Sélecteur fonds de carte + calques
│   │   ├── TraceLayer.tsx          ← Rendu polylines des traces
│   │   ├── DrawingController.tsx   ← Orchestrateur du clic contextuel
│   │   ├── RoutingMode.tsx         ← Appels GraphHopper
│   │   ├── FreehandMode.tsx        ← Tracé ligne droite (mode par défaut)
│   │   ├── TraceFollowMode.tsx     ← Suivi de trace existante
│   │   ├── ContextMenu.tsx         ← Clic droit sur point (inverser, aller-retour...)
│   │   ├── MapSearch.tsx           ← Geocoding Nominatim
│   │   └── ScaleControl.tsx        ← Échelle carte
│   │
│   ├── sidebar/
│   │   ├── Sidebar.tsx             ← Panneau latéral dédié (cartes + traces)
│   │   ├── TileSelector.tsx        ← Sélection fond de carte + calques
│   │   ├── TrackList.tsx           ← Liste des traces chargées
│   │   └── TrackItem.tsx           ← Ligne trace (couleur, stats, visibilité)
│   │
│   ├── chart/
│   │   ├── ProfileChart.tsx        ← Graphique Recharts (overlay flottant)
│   │   ├── ChartViewSelector.tsx   ← Switch Altitude / Vitesse / Vit.asc / FC
│   │   ├── AxisXSelector.tsx       ← Switch Distance / Temps
│   │   └── ChartMapSync.tsx        ← Synchronisation curseur carte ↔ graphique
│   │
│   ├── toolbar/
│   │   ├── Toolbar.tsx             ← Barre d'outils principale
│   │   ├── DrawingModeToggle.tsx   ← Bouton bascule mode auto (+ indicateur état)
│   │   ├── UndoRedoButtons.tsx     ← Boutons Annuler/Rétablir
│   │   └── EditTools.tsx           ← Inverser, Aller-retour
│   │
│   ├── dropzone/
│   │   └── FileDropZone.tsx        ← Drag & drop + input file (GPX/TCX/FIT)
│   │
│   └── settings/
│       └── SettingsPanel.tsx       ← Paramètres (clé GH, unités, etc.)
│
├── store/
│   └── tracks.ts                   ← Zustand store
│       # traces[]                  ← toutes les traces chargées
│       # activeTraceId             ← trace sélectionnée
│       # drawingMode               ← 'free' | 'routed'
│       # history[]                 ← pile undo/redo
│       # mapSettings               ← fond de carte actif, zoom, centre
│
├── hooks/
│   ├── useTracksStore.ts
│   ├── useMapSync.ts               ← Sync carte ↔ graphique
│   ├── useHistory.ts               ← Undo/Redo
│   ├── useKeyboardShortcuts.ts     ← Tous les raccourcis clavier
│   └── useElevation.ts             ← Appels OpenTopoData
│
└── lib/
    ├── parsers/
    │   ├── gpx.ts                  ← Parser GPX (gpxparser)
    │   ├── tcx.ts                  ← Parser TCX
    │   ├── fit.ts                  ← Parser FIT (fit-parser)
    │   └── index.ts                ← Détection format + dispatch
    ├── exporters/
    │   └── gpx.ts                  ← Export GPX propre (XML maison)
    ├── elevation.ts                ← OpenTopoData API
    ├── routing.ts                  ← GraphHopper abstraction
    ├── proximity.ts                ← Détection "proche de" en pixels (seuil 15-20px)
    └── slope.ts                    ← Calcul pente entre points
```

---

## Fonds de carte V1

Séparation stricte : **un seul fond actif à la fois** + **calques superposables** avec opacité.

### Fonds de carte disponibles

```typescript
const TILE_LAYERS = {
  'OSM Standard': {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    free: true,
  },
  'IGN Satellite': {
    url: 'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image%2Fjpeg&STYLE=normal',
    attribution: '© IGN Géoportail',
    free: true, // clé publique IGN
  },
  'IGN Scan 25': {
    url: 'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.MAPS&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image%2Fjpeg&STYLE=normal',
    attribution: '© IGN Géoportail',
    free: true,
  },
  'Swisstopo Carte': {
    url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg',
    attribution: '© Swisstopo',
    free: true,
  },
  'Swisstopo Satellite': {
    url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg',
    attribution: '© Swisstopo',
    free: true,
  },
}
```

### Calques superposables

```typescript
const OVERLAY_LAYERS = {
  'Courbes de niveau': {
    url: 'https://tiles.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap',
    opacity: 0.5,
  },
  // V2 : météo, neige, qualité de l'air
}
```

---

## Comportement de l'éditeur

### Mode tracé — logique contextuelle du clic

Le mode par défaut est **manuel (ligne droite)**. Lors d'un clic sur la carte pendant le tracé :

```
L'utilisateur clique
│
├── Proche d'un point de MA trace en cours (< 15-20px) ?
│       → Mode DÉPLACEMENT du point (drag)
│
├── Proche d'un point d'UNE AUTRE trace chargée (< 15-20px) ?
│       → Mode SUIVI DE TRACE
│               1er clic : mémorise le point de départ sur la trace source
│               2e clic sur la même trace : copie tous les points intermédiaires
│               Survol : prévisualisation du segment qui sera copié (highlight)
│
└── Loin de tout
        ├── Mode LIBRE actif (défaut) → ligne droite depuis le dernier point
        └── Mode AUTO actif (touche A maintenue OU bouton toggle ON)
                → appel GraphHopper depuis le dernier point
```

### Activation du mode routage automatique

- **Touche `A` maintenue** : mode auto temporaire (relâcher = retour manuel)
- **Bouton toggle** dans la barre d'outils : bascule persistante
- Profil GraphHopper par défaut : `hike`
- Profils disponibles : `foot`, `hike`, `bike`, `mtb`, `racingbike`

### Indicateur de distance en temps réel

Pendant le tracé point par point, afficher la distance depuis le dernier point en infobulle colorée :
- `< 30m` → vert ✓
- `30–50m` → orange ⚠
- `> 50m` → rouge ✗

### Outils d'édition disponibles en V1

- **Undo/Redo** (`Ctrl+Z` / `Ctrl+Shift+Z`) — historique complet
- **Inverser le sens** de la trace
- **Aller-retour automatique** — duplique la trace en sens inverse et la fusionne
- **Déplacement de points** — drag & drop natif Leaflet.pm
- **Drag de la ligne** — insérer un point en tirant le segment
- **Clic droit contextuel** sur un point : supprimer, insérer avant/après, "come here by hike/bike"

### Outils V2

- Court-circuiter une portion
- Rogner la trace
- Gomme
- Simplification (Ramer-Douglas-Peucker)
- Boucler automatiquement (close loop)

---

## Graphique de profil

- **Position** : overlay flottant sur la carte (coin bas, redimensionnable et masquable)
- **Vue par défaut** : Altitude
- **Vues disponibles** : Altitude | Vitesse | Vitesse ascensionnelle | Fréquence cardiaque
- **Coloration du graphique** : selon la vue active
  - Altitude → gradient de couleur selon l'altitude
  - Pente → vert (< 5%) → jaune → orange → rouge (> 20%)
  - Vitesse, FC → couleur uniforme de la trace
- **Axe X** : Distance ou Temps (switchable)
- **Zoom** : molette sur le graphique ou boutons +/-
- **Synchronisation** : survol graphique → marker sur la carte, et inversement

### Coloration des traces par pente (sur la carte et le graphique)

Palette standardisée :
```
< 5%   → #22c55e  (vert)
5–10%  → #84cc16  (vert-jaune)
10–15% → #eab308  (jaune)
15–20% → #f97316  (orange)
> 20%  → #ef4444  (rouge)
```

---

## Format des traces

### Import supporté
- **GPX** — format principal
- **TCX** — Garmin (lecture seule)
- **FIT** — Garmin (lecture seule)

### Export
- **GPX uniquement** — format de sortie standard
- Les métadonnées (couleur, nom) sont stockées dans les balises `<extensions>`
- Les waypoints `<wpt>` du GPX source sont lus et conservés à l'export (affichage V2)

### Comportement à l'import
- Import direct sans dialog (pas de popup)
- Altitudes conservées telles quelles par défaut
- Options d'altitude accessibles dans le panneau de la trace après import :
  - Conserver les altitudes du fichier
  - Combler les altitudes manquantes (OpenTopoData)
  - Remplacer toutes les altitudes (OpenTopoData)

### Gestion multi-traces
- Maximum 20 traces simultanées
- Couleur automatique assignée (palette cyclique) + modifiable via color picker
- Chaque trace a : nom, couleur, opacité, épaisseur, visibilité (toggle)
- Coloration par défaut : couleur uniforme (pas de coloration par pente par défaut)

---

## Altimétrie — OpenTopoData

```typescript
// Endpoint principal
const OPENTOPODATA_URL = 'https://api.opentopodata.org/v1/srtm30m'

// Appel batch (max 100 points par requête)
async function fetchElevations(points: LatLng[]): Promise<number[]> {
  const locations = points.map(p => `${p.lat},${p.lng}`).join('|')
  const res = await fetch(`${OPENTOPODATA_URL}?locations=${locations}`)
  const data = await res.json()
  return data.results.map((r: any) => r.elevation)
}
```

Note V2 : détecter la zone géographique de la trace pour basculer sur IGN altimétrie (France) ou Swisstopo (Suisse) si dans leur emprise.

---

## Raccourcis clavier

Implémentés dans `useKeyboardShortcuts.ts`, actifs globalement sauf si focus sur un champ texte.

| Touche | Action |
|--------|--------|
| `Ctrl+Z` | Annuler |
| `Ctrl+Shift+Z` | Rétablir |
| `A` (maintenu) | Mode routage automatique temporaire |
| `C` | Centrer la carte sur la trace active |
| `P` | Masquer/afficher le profil altimétrique |
| `M` | Masquer/afficher la trace (voir le fond de carte dessous) |
| `F` | Plein écran |
| `Espace` | Mode "carte nue" — masque toutes les traces, affiche uniquement le fond de carte courant + le panneau de sélection de cartes |
| `Échap` | Terminer le tracé en cours / fermer le menu contextuel |

---

## Interface générale

- **Langue** : Français
- **Layout par défaut** : Carte plein écran (le graphique est un overlay flottant)
- **Thème** : Clair uniquement (dark mode V2)
- **Nom de l'application** : MapsGPS
- **Unités** : km / m par défaut (configurable dans les paramètres)
- **Position de départ** : Dernière position mémorisée (localStorage)
- **Panneau latéral** : dédié à la sélection des fonds de carte + liste des traces

---

## Paramètres utilisateur (localStorage)

```typescript
interface UserSettings {
  graphhopperApiKey: string      // Clé API GraphHopper
  defaultProfile: string         // 'hike' | 'foot' | 'bike' | 'mtb'
  units: 'metric' | 'imperial'   // 'metric' par défaut
  lastMapCenter: [number, number] // Dernière position carte
  lastMapZoom: number
  defaultTileLayer: string       // Fond de carte actif
  activeOverlays: string[]       // Calques actifs
}
```

---

## Phases de développement

### Phase 1 — Socle cartographique (PRIORITÉ)
- Next.js + Tailwind + Leaflet (SSR-safe)
- Panneau latéral avec sélecteur de fonds de carte (OSM + IGN + Swisstopo)
- Calque courbes de niveau
- Drag & drop + parsing GPX/TCX/FIT
- Affichage multi-traces colorées
- Mémorisation dernière position carte

### Phase 2 — Statistiques
- Panneau de stats par trace (distance, durée, D+/D-)
- Graphique Recharts en overlay flottant (altitude)
- Vues : Altitude / Vitesse / Vit. ascensionnelle / FC
- Synchronisation curseur carte ↔ graphique
- Switch axe X : distance / temps

### Phase 3 — Éditeur de base
- Barre d'outils (mode libre / auto)
- DrawingController (clic contextuel)
- Mode libre : ligne droite point à point
- Mode auto : GraphHopper (clé dans paramètres)
- Indicateur distance vert/orange/rouge
- Récupération altitude OpenTopoData
- Undo/Redo
- Export GPX

### Phase 4 — Éditeur avancé
- Mode suivi de trace (clic contextuel sur trace existante)
- Prévisualisation du segment à copier
- Drag de points et de la ligne
- Clic droit contextuel
- Inverser le sens
- Aller-retour automatique
- Coloration par pente (carte + graphique)

### Phase 5 — Finitions & V2
- Partage temporaire 30 jours (Supabase ou serveur minimal)
- Mode "carte nue" (touche Espace)
- Bulles kilométriques
- Résumé surfaces (pavé/non-pavé)
- Curseur de pace / estimation de durée
- Impression de cartes par pavage de zone (inspiré de jgn.superheros.fr)
- Thème sombre

---

## À ne jamais faire

- Ne jamais importer Leaflet en dehors d'un composant `dynamic` avec `ssr: false`
- Ne jamais stocker de données sensibles (clés API) dans le code — toujours `localStorage`
- Ne jamais envoyer les fichiers GPX sur un serveur — tout le traitement est local (côté navigateur)
- Ne jamais utiliser `useEffect` pour manipuler la carte Leaflet directement — passer par les hooks React-Leaflet
