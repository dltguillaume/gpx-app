import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const key = process.env.NEXT_PUBLIC_GRAPHHOPPER_API_KEY

  if (!key) {
    return NextResponse.json(
      { error: 'GraphHopper API key not configured' },
      { status: 500 }
    )
  }

  const points = searchParams.getAll('point')
  const profile = searchParams.get('profile') || 'hike'
  const locale = searchParams.get('locale') || 'fr'

  if (!points || points.length < 2) {
    return NextResponse.json(
      { error: 'At least 2 points required' },
      { status: 400 }
    )
  }

  try {
    const pointParams = points.map((p) => `point=${encodeURIComponent(p)}`).join('&')
    const url = `https://graphhopper.com/api/1/route?${pointParams}&profile=${profile}&locale=${locale}&key=${key}`

    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: 'GraphHopper request failed', details: errorData },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    console.error('Routing error:', e)
    return NextResponse.json(
      { error: 'routing failed', details: e instanceof Error ? e.message : 'unknown error' },
      { status: 502 }
    )
  }
}
