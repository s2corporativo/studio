import { NextRequest, NextResponse } from 'next/server'
import { generateHashtagGroups } from '@/lib/ai'
import { db } from '@/lib/db'
import { logActivity, ACTIVITY_TYPES, ACTIVITY_COLORS } from '@/lib/activity'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { company, niche, platform, companyId, save = true } = body
    if (!company || !niche) {
      return NextResponse.json({ error: 'Empresa e nicho são obrigatórios' }, { status: 400 })
    }

    const groups = await generateHashtagGroups({ company, niche, platform })

    let saved = []
    if (save && companyId) {
      const colorMap: Record<string, string> = {
        branded: '#7C3AED',
        nicho: '#0EA5E9',
        trending: '#EC4899',
        local: '#10B981',
        educacional: '#F59E0B',
        engajamento: '#06B6D4',
      }
      for (const g of groups) {
        const created = await db.hashtagGroup.create({
          data: {
            companyId,
            name: g.name,
            niche,
            platform: platform || null,
            tags: JSON.stringify(g.tags || []),
            description: g.description || null,
            color: colorMap[g.category] || '#7C3AED',
          },
        })
        saved.push(created)
      }
      await logActivity({
        companyId,
        type: 'post_created',
        title: `${groups.length} grupos de hashtags gerados`,
        description: `Banco de hashtags atualizado para ${niche}`,
        icon: 'hash',
        color: ACTIVITY_COLORS.post_created,
        meta: { count: groups.length },
      })
    }

    return NextResponse.json({
      groups: save && companyId ? saved : groups,
      count: groups.length,
    })
  } catch (e: any) {
    console.error('Hashtag generation error:', e)
    return NextResponse.json({ error: e?.message || 'Erro ao gerar hashtags' }, { status: 500 })
  }
}
