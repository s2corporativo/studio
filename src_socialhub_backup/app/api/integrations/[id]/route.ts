import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json()
  try {
    const integration = await db.integration.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.autoPublish !== undefined && { autoPublish: body.autoPublish }),
        ...(body.syncFrequency !== undefined && { syncFrequency: body.syncFrequency }),
        ...(body.lastSync !== undefined && { lastSync: body.lastSync }),
        ...(body.errorMessage !== undefined && { errorMessage: body.errorMessage }),
      },
    })
    return NextResponse.json({ integration })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  try {
    await db.integration.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
  }
}
