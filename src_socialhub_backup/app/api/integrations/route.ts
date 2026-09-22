import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  if (!companyId) {
    return NextResponse.json({ integrations: [] })
  }

  const integrations = await db.integration.findMany({
    where: { companyId },
    orderBy: { platform: 'asc' },
  })
  return NextResponse.json({ integrations })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      companyId,
      platform,
      status,
      accountId,
      accountName,
      apiKey,
      apiSecret,
      autoPublish,
      syncFrequency,
      features,
    } = body

    if (!companyId || !platform) {
      return NextResponse.json({ error: 'companyId e platform são obrigatórios' }, { status: 400 })
    }

    const integration = await db.integration.upsert({
      where: {
        companyId_platform: { companyId, platform },
      },
      create: {
        companyId,
        platform,
        status: status || 'connected',
        accountId: accountId || null,
        accountName: accountName || null,
        apiKey: apiKey || null,
        apiSecret: apiSecret || null,
        autoPublish: autoPublish ?? true,
        syncFrequency: syncFrequency || 'hourly',
        features: JSON.stringify(features || []),
        tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 dias
        lastSync: new Date(),
      },
      update: {
        status: status || 'connected',
        accountId: accountId || undefined,
        accountName: accountName || undefined,
        apiKey: apiKey || undefined,
        apiSecret: apiSecret || undefined,
        autoPublish: autoPublish ?? undefined,
        syncFrequency: syncFrequency || undefined,
        features: JSON.stringify(features || []),
        lastSync: new Date(),
        errorMessage: null,
      },
    })

    return NextResponse.json({ integration }, { status: 201 })
  } catch (e: any) {
    console.error('Integration create error:', e)
    return NextResponse.json({ error: 'Erro ao criar integração' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
  try {
    await db.integration.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao desconectar' }, { status: 500 })
  }
}
