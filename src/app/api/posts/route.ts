import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  const status = searchParams.get('status')
  const range = searchParams.get('range') // upcoming, past, all

  const where: any = {}
  if (companyId) where.companyId = companyId
  if (status) where.status = status

  if (range === 'upcoming') {
    where.scheduledAt = { gte: new Date() }
    where.status = { in: ['scheduled', 'draft'] }
  } else if (range === 'past') {
    where.scheduledAt = { lt: new Date() }
  }

  const posts = await db.post.findMany({
    where,
    orderBy: { scheduledAt: 'asc' },
    include: {
      targets: true,
      company: { select: { id: true, name: true, brandColor: true } },
    },
    take: 200,
  })

  return NextResponse.json({ posts })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      companyId,
      title,
      content,
      hashtags,
      mediaUrls,
      scheduledAt,
      status,
      category,
      tone,
      platforms,
      variations,
    } = body

    if (!companyId || !title || !content) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    const post = await db.post.create({
      data: {
        companyId,
        title,
        content,
        hashtags: JSON.stringify(hashtags || []),
        mediaUrls: JSON.stringify(mediaUrls || []),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: status || 'draft',
        category: category || null,
        tone: tone || null,
        targets: {
          create: (platforms || []).map((p: string) => ({
            platform: p,
            content: variations?.[p] || content,
            status: 'pending',
          })),
        },
      },
      include: { targets: true },
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao criar post' }, { status: 500 })
  }
}
