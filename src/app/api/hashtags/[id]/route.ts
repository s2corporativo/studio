import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json()
  try {
    const group = await db.hashtagGroup.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.tags !== undefined && { tags: JSON.stringify(body.tags) }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.usageCount !== undefined && { usageCount: body.usageCount }),
      },
    })
    return NextResponse.json({ group })
  } catch {
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}
