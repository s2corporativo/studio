import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json()
  try {
    const mention = await db.mention.update({
      where: { id },
      data: { ...(body.replied !== undefined && { replied: body.replied }) },
    })
    return NextResponse.json({ mention })
  } catch {
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}
