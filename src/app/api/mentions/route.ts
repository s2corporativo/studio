import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  const sentiment = searchParams.get('sentiment')
  const platform = searchParams.get('platform')
  const limit = parseInt(searchParams.get('limit') || '50')

  if (!companyId) {
    return NextResponse.json({ mentions: [], summary: null })
  }

  const where: any = { companyId }
  if (sentiment && sentiment !== 'all') where.sentiment = sentiment
  if (platform && platform !== 'all') where.platform = platform

  const mentions = await db.mention.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  // Compute summary
  const allMentions = await db.mention.findMany({ where: { companyId } })
  const total = allMentions.length
  const positive = allMentions.filter((m) => m.sentiment === 'positive').length
  const neutral = allMentions.filter((m) => m.sentiment === 'neutral').length
  const negative = allMentions.filter((m) => m.sentiment === 'negative').length
  const avgSentiment =
    total > 0 ? allMentions.reduce((a, m) => a + m.sentimentScore, 0) / total : 0
  const totalReach = allMentions.reduce((a, m) => a + m.reach, 0)
  const totalEngagement = allMentions.reduce((a, m) => a + m.engagement, 0)

  // Trending topics
  const topicMap = new Map<string, number>()
  for (const m of allMentions) {
    let tags: string[] = []
    try {
      tags = JSON.parse(m.tags || '[]')
    } catch {
      tags = []
    }
    for (const t of tags) {
      topicMap.set(t, (topicMap.get(t) || 0) + 1)
    }
  }
  const trendingTopics = Array.from(topicMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([topic, count]) => ({ topic, count }))

  return NextResponse.json({
    mentions,
    summary: {
      total,
      positive,
      neutral,
      negative,
      positivePct: total > 0 ? Math.round((positive / total) * 100) : 0,
      neutralPct: total > 0 ? Math.round((neutral / total) * 100) : 0,
      negativePct: total > 0 ? Math.round((negative / total) * 100) : 0,
      avgSentiment: avgSentiment.toFixed(2),
      totalReach,
      totalEngagement,
      trendingTopics,
    },
  })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
  try {
    await db.mention.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
  }
}
