import type { Track } from '@/types'
import { parseGPX } from './gpx'
import { parseTCX } from './tcx'
import { parseFIT } from './fit'

export async function parseFile(file: File, colorIndexOffset = 0): Promise<Track[]> {
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ext === 'gpx') {
    const text = await file.text()
    return parseGPX(text, colorIndexOffset)
  }

  if (ext === 'tcx') {
    const text = await file.text()
    return parseTCX(text, colorIndexOffset)
  }

  if (ext === 'fit') {
    const buffer = await file.arrayBuffer()
    return parseFIT(buffer, colorIndexOffset)
  }

  throw new Error(`Format non supporté : .${ext ?? '?'}`)
}
