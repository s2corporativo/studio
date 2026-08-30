import { NextRequest, NextResponse } from 'next/server'
import { generateCompetitorAnalysis } from '@/lib/ai'
import { db } from '@/lib/db'
import { logActivity, ACTIVITY_TYPES, ACTIVITY_COLORS } from '@/lib/activity'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { company, niche, location, companyId, save = true } = body
    if (!company || !niche) {
      return NextResponse.json({ error: 'Empresa e nicho obrigatórios' }, { status: 400 })
    }

    const analysis = await generateCompetitorAnalysis({ company, niche, location })

    let savedCompetitors = []
    if (save && companyId) {
      const threatMap: Record<string, string> = { low: 'low', medium: 'medium', high: 'high' }
      for (const c of analysis.competitors) {
        const created = await db.competitor.create({
          data: {
            companyId,
            name: c.name,
            handle: c.handle || null,
            niche,
            platform: 'instagram',
            followers: Math.floor(Math.random() * 50000) + 1000,
            engagementRate: c.avgEngagement === 'alto' ? 5 + Math.random() * 3 : c.avgEngagement === 'médio' || c.avgEngagement === 'medio' ? 2 + Math.random() * 2 : 0.5 + Math.random(),
            postingFrequency: c.postingFrequency || null,
            strengths: JSON.stringify(c.strengths || []),
            weaknesses: JSON.stringify(c.weaknesses || []),
            contentThemes: JSON.stringify(c.contentThemes || []),
            avgLikes: Math.floor(Math.random() * 5000) + 100,
            avgComments: Math.floor(Math.random() * 300) + 10,
            sentiment: 'neutral',
            threatLevel: threatMap[c.threatLevel] || 'medium',
            notes: c.opportunity || null,
          },
        })
        savedCompetitors.push(created)
      }
      await logActivity({
        companyId,
        type: ACTIVITY_TYPES.POST_CREATED,
        title: `Análise de concorrentes gerada`,
        description: `${analysis.competitors.length} concorrentes analisados para ${niche}`,
        icon: 'search',
        color: ACTIVITY_COLORS.post_created,
        meta: { count: analysis.competitors.length },
      })
    }

    return NextResponse.json({
      competitors: save && companyId ? savedCompetitors : analysis.competitors,
      insights: analysis.insights,
      count: analysis.competitors.length,
    })
  } catch (e: any) {
    console.error('Competitor analysis error:', e)
    return NextResponse.json({ error: e?.message || 'Erro ao analisar concorrentes' }, { status: 500 })
  }
}
