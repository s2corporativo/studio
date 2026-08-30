import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity, ACTIVITY_TYPES, ACTIVITY_COLORS } from '@/lib/activity'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  const where: any = {}
  if (companyId) where.companyId = companyId

  const accounts = await db.socialAccount.findMany({
    where,
    orderBy: { platform: 'asc' },
    include: { company: { select: { id: true, name: true, brandColor: true } } },
  })
  return NextResponse.json({ accounts })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyId, platform, handle, displayName, profileUrl } = body
    if (!companyId || !platform || !handle) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }
    const account = await db.socialAccount.create({
      data: {
        companyId,
        platform,
        handle,
        displayName: displayName || null,
        profileUrl: profileUrl || `https://${platform}.com/${handle.replace('@', '')}`,
        followers: Math.floor(Math.random() * 2000) + 100,
        following: Math.floor(Math.random() * 300) + 10,
        posts: Math.floor(Math.random() * 200) + 10,
        connected: true,
      },
    })
    await logActivity({
      companyId,
      type: ACTIVITY_TYPES.ACCOUNT_CONNECTED,
      title: `Conta conectada: ${platform} · ${handle}`,
      description: `Nova conta em ${platform}`,
      icon: 'share',
      color: ACTIVITY_COLORS.account_connected,
      meta: { accountId: account.id, platform },
    })
    return NextResponse.json({ account }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao conectar conta' }, { status: 500 })
  }
}
