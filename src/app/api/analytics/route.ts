import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  const days = parseInt(searchParams.get('days') || '14')

  const where: any = {}
  if (companyId) where.companyId = companyId

  const since = new Date()
  since.setDate(since.getDate() - days)
  where.date = { gte: since }

  const snapshots = await db.analyticsSnapshot.findMany({
    where,
    orderBy: { date: 'asc' },
  })

  // Aggregate by date
  const byDate = new Map<string, any>()
  const byPlatform = new Map<string, any>()

  for (const s of snapshots) {
    const key = s.date.toISOString().slice(0, 10)
    if (!byDate.has(key)) {
      byDate.set(key, { date: key, followers: 0, reach: 0, engagement: 0, clicks: 0, impressions: 0 })
    }
    const d = byDate.get(key)!
    d.followers += s.followers
    d.reach += s.reach
    d.engagement += s.engagement
    d.clicks += s.clicks
    d.impressions += s.impressions

    if (!byPlatform.has(s.platform)) {
      byPlatform.set(s.platform, { platform: s.platform, followers: 0, reach: 0, engagement: 0, clicks: 0 })
    }
    const p = byPlatform.get(s.platform)!
    p.followers += s.followers
    p.reach += s.reach
    p.engagement += s.engagement
    p.clicks += s.clicks
  }

  return NextResponse.json({
    series: Array.from(byDate.values()),
    byPlatform: Array.from(byPlatform.values()),
    total: {
      followers: snapshots.reduce((a, s) => a + s.followers, 0),
      reach: snapshots.reduce((a, s) => a + s.reach, 0),
      engagement: snapshots.reduce((a, s) => a + s.engagement, 0),
      clicks: snapshots.reduce((a, s) => a + s.clicks, 0),
      impressions: snapshots.reduce((a, s) => a + s.impressions, 0),
    },
  })
}
