import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const company = await db.company.findUnique({
    where: { id },
    include: {
      socialAccounts: true,
      _count: { select: { posts: true } },
    },
  })
  if (!company) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })
  return NextResponse.json({ company })
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json()
  const { name, description, niche, website, brandColor, city, logo } = body
  try {
    const company = await db.company.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(niche !== undefined && { niche }),
        ...(website !== undefined && { website }),
        ...(brandColor !== undefined && { brandColor }),
        ...(city !== undefined && { city }),
        ...(logo !== undefined && { logo }),
      },
    })
    return NextResponse.json({ company })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  try {
    await db.company.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
  }
}
