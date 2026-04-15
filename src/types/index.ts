export interface TrackPoint {
  lat: number
  lng: number
  ele?: number
  time?: Date
  hr?: number
  cadence?: number
  speed?: number
}

export interface TrackStats {
  distance: number // mètres
  elevationGain: number // mètres
  elevationLoss: number // mètres
  maxElevation: number
  minElevation: number
  duration?: number // secondes
  avgSpeed?: number // km/h
}

export interface Track {
  id: string
  name: string
  color: string
  points: TrackPoint[]
  visible: boolean
  opacity: number
  weight: number
  stats: TrackStats
}

