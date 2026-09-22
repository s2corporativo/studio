import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  const limit = parseInt(searchParams.get('limit') || '30')

  const where: any = {}
  if (companyId) where.companyId = companyId

  const events = await db.activityEvent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { company: { select: { name: true, brandColor: true } } },
  })

  const unreadCount = await db.activityEvent.count({ where: { ...where, read: false } })

  return NextResponse.json({ events, unreadCount })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyId, type, title, description, icon, color, meta } = body
    if (!type || !title) {
      return NextResponse.json({ error: 'type e title obrigatórios' }, { status: 400 })
    }
    const event = await db.activityEvent.create({
      data: {
        companyId: companyId || null,
        type,
        title,
        description: description || null,
        icon: icon || null,
        color: color || null,
        meta: meta ? JSON.stringify(meta) : null,
      },
    })
    return NextResponse.json({ event }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao registrar evento' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  try {
    if (action === 'mark-all-read') {
      await db.activityEvent.updateMany({ data: { read: true } })
      return NextResponse.json({ success: true })
    }
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
    await db.activityEvent.update({ where: { id }, data: { read: true } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}
