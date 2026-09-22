import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  const status = searchParams.get('status')

  const where: any = {}
  if (companyId) where.companyId = companyId
  if (status) where.status = status

  const ideas = await db.contentIdea.findMany({
    where,
    orderBy: { score: 'desc' },
    take: 200,
    include: { company: { select: { name: true, brandColor: true } } },
  })
  return NextResponse.json({ ideas })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyId, title, description, category, platform, angle, hashtags, bestDay, bestTime, score } = body
    if (!title || !description) {
      return NextResponse.json({ error: 'Título e descrição obrigatórios' }, { status: 400 })
    }
    const idea = await db.contentIdea.create({
      data: {
        companyId: companyId || null,
        title,
        description,
        category: category || 'educacional',
        platform: platform || 'instagram',
        angle: angle || null,
        hashtags: JSON.stringify(hashtags || []),
        bestDay: bestDay || null,
        bestTime: bestTime || null,
        score: typeof score === 'number' ? score : 50,
      },
    })
    return NextResponse.json({ idea }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar ideia' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
  const body = await req.json()
  try {
    const idea = await db.contentIdea.update({
      where: { id },
      data: { ...(body.status !== undefined && { status: body.status }) },
    })
    return NextResponse.json({ idea })
  } catch {
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
  try {
    await db.contentIdea.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}
