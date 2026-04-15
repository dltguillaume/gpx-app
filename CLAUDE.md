# MapsGPS — Claude Code Reference

App web GPS local-first (Next.js + Leaflet). Aucun compte requis, tout dans le navigateur.

## Stack
Next.js App Router · TypeScript · Tailwind · Leaflet+React-Leaflet · Leaflet.pm · Zustand · Recharts · GraphHopper · OpenTopoData · Vercel

## Règle critique — Leaflet SSR
Toujours charger dynamiquement : `dynamic(() => import('...'), { ssr: false })`
Composants Leaflet = `'use client'` + `useEffect` pour lire localStorage (jamais en SSR)

## Architecture
```
src/
├── app/
│   ├── page.tsx              ← carte plein écran
│   └── parametres/page.tsx   ← page paramètres
├── components/
│   ├── map/                  ← MapContainer, TileLayerManager, TraceLayer
│   │                           DrawingController, RoutingMode, FreehandMode
│   │                           TraceFollowMode, ContextMenu, MapSearch
│   ├── sidebar/              ← Sidebar, TileSelector, TrackList, TrackItem
│   ├── chart/                ← ProfileChart, ChartViewSelector, ChartMapSync
│   ├── toolbar/              ← Toolbar, DrawingModeToggle, UndoRedoButtons
│   ├── dropzone/             ← FileDropZone (GPX/TCX/FIT)
│   └── settings/             ← ApiKeysPanel, SettingsPanel
├── store/tracks.ts           ← Zustand : traces[], activeTraceId, drawingMode, history[], mapSettings
├── hooks/                    ← useTracksStore, useMapSync, useHistory, useKeyboardShortcuts, useElevation, useSettings
└── lib/
    ├── tileLayers.ts         ← config fonds de carte + overlays (source de vérité)
    ├── apiKeys.ts            ← getApiKeys / saveApiKeys / exportApiKeys / importApiKeys
    ├── parsers/              ← gpx.ts, tcx.ts, fit.ts, index.ts
    ├── exporters/gpx.ts
    ├── elevation.ts          ← OpenTopoData (batch max 100 pts)
    ├── routing.ts            ← GraphHopper abstraction
    ├── proximity.ts          ← seuil 15-20px
    └── slope.ts              ← calcul pente
```

## Fonds de carte actifs
Config dans `src/lib/tileLayers.ts`. Clés API lues via `getApiKeys()` (env > localStorage).

Fonds : Plan IGN · IGN Satellite · IGN Carte Topo (clé IGN) · IGN SCAN25 (clé IGN) · Swiss Topo · Swiss Image · Swiss 25k · TF Locus (clé TF)
Overlays : IGN pentes montagne · IGN itinéraires ski · Swiss sentiers · Swiss pentes >30° · Swiss ski touring · Swiss véloland · Swiss VTT · Swiss zones faune

Cartes nécessitant clé absente → grisées avec cadenas dans le sélecteur.

## Gestion des clés API
Priorité : `process.env.NEXT_PUBLIC_*` → `localStorage('mapsgps-api-keys')` → absent
Clés : `ign` · `thunderforest` · `graphhopper`
UI : import/export fichier JSON dans page Paramètres

## Éditeur — comportement du clic
Mode par défaut : **manuel (ligne droite)**
```
Clic sur la carte
├── Proche point MA trace (<15-20px) → déplacement
├── Proche point AUTRE trace (<15-20px) → suivi de trace (2 clics = copie segment)
└── Ailleurs
    ├── Mode libre (défaut) → ligne droite
    └── Mode auto (A maintenu ou toggle ON) → GraphHopper hike
```
Indicateur distance : <30m vert · 30-50m orange · >50m rouge

## Outils éditeur V1
Undo/Redo · Inverser sens · Aller-retour auto · Déplacement points (drag) · Drag ligne · Clic droit contextuel

## Graphique profil
Overlay flottant bas de carte · Vue défaut : Altitude · Vues : Altitude / Vitesse / Vit.asc / FC · Axe X : distance ou temps (switch) · Sync curseur carte↔graphique

Palette pente : <5% #22c55e · 5-10% #84cc16 · 10-15% #eab308 · 15-20% #f97316 · >20% #ef4444

## Raccourcis clavier (`useKeyboardShortcuts.ts`)
`Ctrl+Z/Shift+Z` undo/redo · `A` maintenu = mode auto · `C` centrer · `P` toggle profil · `M` toggle trace · `F` plein écran · `Espace` carte nue · `Échap` fin tracé

## Traces
Import : GPX (principal) · TCX · FIT — pas de dialog à l'import, options après
Export : GPX uniquement, métadonnées dans `<extensions>`, `<wpt>` conservés
Max 20 traces · couleur auto cyclique + modifiable · coloration défaut : uniforme

## localStorage
`mapsgps-api-keys` · `mapsgps-units` · `mapsgps-map-settings` · `mapsgps-trace-settings`
Position carte mémorisée : dernière position

## Phases restantes
- **Phase 3** : éditeur de base (DrawingController, GraphHopper, export GPX, undo/redo)
- **Phase 4** : éditeur avancé (suivi de trace, drag ligne, clic droit, coloration pente)
- **Phase 5 V2** : partage 30j, bulles km, résumé surfaces, pace, pavage impression carte

## Interdits
- Importer Leaflet hors `dynamic(..., {ssr:false})`
- Clés API dans le code source (toujours localStorage ou env)
- Envoyer GPX sur un serveur
- Lire localStorage hors `useEffect` (hydratation error)
