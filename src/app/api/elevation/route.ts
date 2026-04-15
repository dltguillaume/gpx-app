import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const locations = req.nextUrl.searchParams.get('locations')
  if (!locations) return NextResponse.json({ error: 'missing locations' }, { status: 400 })

  const [lat, lng] = locations.split(',')

  // Tentative 1 : Open-Elevation
  try {
    const res = await fetch('https://api.open-elevation.com/api/v1/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locations: [{ latitude: parseFloat(lat), longitude: parseFloat(lng) }] }),
      signal: AbortSignal.timeout(5000)
    })
    if (res.ok) {
      const data = await res.json()
      const elevation = data.results?.[0]?.elevation
      if (elevation !== undefined) {
        return NextResponse.json({ results: [{ elevation }], status: 'OK' })
      }
    }
  } catch (e) { console.warn('Open-Elevation failed, trying fallback') }

  // Fallback : OpenTopoData
  try {
    const res = await fetch(
      `https://api.opentopodata.org/v1/srtm30m?locations=${locations}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (res.ok) return NextResponse.json(await res.json())
  } catch (e) { console.error('OpenTopoData also failed') }

  return NextResponse.json({ error: 'all elevation sources failed' }, { status: 502 })
}
