import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')

  const where: any = {}
  if (companyId) where.companyId = companyId

  const groups = await db.hashtagGroup.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  return NextResponse.json({ groups })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyId, name, niche, platform, tags, description, color } = body
    if (!name || !tags?.length) {
      return NextResponse.json({ error: 'Nome e tags são obrigatórios' }, { status: 400 })
    }
    const group = await db.hashtagGroup.create({
      data: {
        companyId: companyId || null,
        name,
        niche: niche || null,
        platform: platform || null,
        tags: JSON.stringify(tags),
        description: description || null,
        color: color || null,
      },
    })
    return NextResponse.json({ group }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar grupo' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
  try {
    await db.hashtagGroup.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
  }
}
