import type { Track } from '@/types'

export function exportGpxFile(trace: Track): void {
  const gpxContent = generateGpxXml(trace)
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${trace.name || 'trace'}.gpx`
  link.draggable = true

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

function generateGpxXml(trace: Track): string {
  const now = new Date().toISOString()

  // Escape XML special characters
  const escapeXml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')

  const trkpts = trace.points
    .map(
      (point) => `
    <trkpt lat="${point.lat}" lon="${point.lng}">
      ${point.ele !== undefined ? `<ele>${point.ele.toFixed(2)}</ele>` : ''}
      ${point.time ? `<time>${new Date(point.time).toISOString()}</time>` : ''}
      ${point.hr !== undefined ? `<extensions><hr>${point.hr}</hr></extensions>` : ''}
    </trkpt>`
    )
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="MapsGPS" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(trace.name)}</name>
    <time>${now}</time>
  </metadata>
  <trk>
    <name>${escapeXml(trace.name)}</name>
    <extensions>
      <color>${trace.color}</color>
    </extensions>
    <trkseg>${trkpts}
    </trkseg>
  </trk>
</gpx>`.trim()
}
