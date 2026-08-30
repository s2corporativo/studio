import { NextRequest, NextResponse } from 'next/server'
import { generateMentions } from '@/lib/ai'
import { db } from '@/lib/db'
import { logActivity, ACTIVITY_TYPES, ACTIVITY_COLORS } from '@/lib/activity'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { company, niche, platforms, companyId, save = true } = body
    if (!company || !niche || !companyId) {
      return NextResponse.json({ error: 'Empresa, nicho e companyId são obrigatórios' }, { status: 400 })
    }

    const result = await generateMentions({
      company,
      niche,
      platforms: platforms || ['instagram', 'twitter', 'facebook'],
    })

    let savedMentions = []
    if (save && companyId) {
      for (const m of result.mentions) {
        const created = await db.mention.create({
          data: {
            companyId,
            platform: m.platform,
            author: m.author,
            authorHandle: m.authorHandle || null,
            content: m.content,
            sentiment: m.sentiment,
            sentimentScore: m.sentimentScore,
            reach: m.reach || 0,
            engagement: m.engagement || 0,
            isVerified: m.isVerified || false,
            tags: JSON.stringify(m.tags || []),
            // Stagger creation times for realism
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          },
        })
        savedMentions.push(created)
      }
      await logActivity({
        companyId,
        type: ACTIVITY_TYPES.POST_CREATED,
        title: `${result.mentions.length} menções encontradas`,
        description: `Social listening: ${result.summary.positivePct}% positivas, ${result.summary.negativePct}% negativas`,
        icon: 'search',
        color: ACTIVITY_COLORS.post_created,
        meta: { count: result.mentions.length },
      })
    }

    return NextResponse.json({
      mentions: save && companyId ? savedMentions : result.mentions,
      summary: result.summary,
      count: result.mentions.length,
    })
  } catch (e: any) {
    console.error('Mentions scan error:', e)
    return NextResponse.json({ error: e?.message || 'Erro ao escanear menções' }, { status: 500 })
  }
}
