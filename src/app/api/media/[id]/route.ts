import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json()
  try {
    const asset = await db.mediaAsset.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.tags !== undefined && { tags: JSON.stringify(body.tags) }),
        ...(body.attachedTo !== undefined && { attachedTo: body.attachedTo }),
      },
    })
    return NextResponse.json({ asset })
  } catch {
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}
