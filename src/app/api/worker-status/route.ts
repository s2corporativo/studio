import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('http://127.0.0.1:3010/health', {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) {
      return NextResponse.json({ running: false, error: `HTTP ${res.status}` })
    }
    const data = await res.json()
    return NextResponse.json({ running: true, ...data })
  } catch (e: any) {
    return NextResponse.json({
      running: false,
      error: e?.message || 'Worker não responde',
    })
  }
}
