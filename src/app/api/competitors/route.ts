import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  if (!companyId) {
    return NextResponse.json({ competitors: [], insights: null })
  }

  const competitors = await db.competitor.findMany({
    where: { companyId },
    orderBy: { threatLevel: 'desc' },
    take: 50,
  })
  return NextResponse.json({ competitors })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      companyId,
      name,
      handle,
      website,
      niche,
      platform,
      followers,
      engagementRate,
      postingFrequency,
      strengths,
      weaknesses,
      contentThemes,
      avgLikes,
      avgComments,
      sentiment,
      threatLevel,
      notes,
    } = body
    if (!companyId || !name) {
      return NextResponse.json({ error: 'Empresa e nome obrigatórios' }, { status: 400 })
    }
    const competitor = await db.competitor.create({
      data: {
        companyId,
        name,
        handle: handle || null,
        website: website || null,
        niche: niche || null,
        platform: platform || null,
        followers: followers || 0,
        engagementRate: engagementRate || 0,
        postingFrequency: postingFrequency || null,
        strengths: strengths ? JSON.stringify(strengths) : null,
        weaknesses: weaknesses ? JSON.stringify(weaknesses) : null,
        contentThemes: contentThemes ? JSON.stringify(contentThemes) : null,
        avgLikes: avgLikes || 0,
        avgComments: avgComments || 0,
        sentiment: sentiment || 'neutral',
        threatLevel: threatLevel || 'medium',
        notes: notes || null,
      },
    })
    return NextResponse.json({ competitor }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao criar concorrente' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
  try {
    await db.competitor.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
  }
}
