import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  if (!companyId) {
    return NextResponse.json({ error: 'companyId obrigatório' }, { status: 400 })
  }

  let settings = await db.companySettings.findUnique({ where: { companyId } })
  if (!settings) {
    // Auto-create default settings
    settings = await db.companySettings.create({ data: { companyId } })
  }
  return NextResponse.json({ settings })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      companyId,
      brandVoice,
      targetAudience,
      defaultTone,
      defaultPlatforms,
      defaultHashtags,
      hashtagCount,
      aiCreativity,
      autoEmoji,
      autoHashtags,
      watermark,
      postingFrequency,
      bestPostingTime,
      timezone,
    } = body

    if (!companyId) {
      return NextResponse.json({ error: 'companyId obrigatório' }, { status: 400 })
    }

    const data: any = {}
    if (brandVoice !== undefined) data.brandVoice = brandVoice || null
    if (targetAudience !== undefined) data.targetAudience = targetAudience || null
    if (defaultTone !== undefined) data.defaultTone = defaultTone
    if (defaultPlatforms !== undefined) data.defaultPlatforms = JSON.stringify(defaultPlatforms || [])
    if (defaultHashtags !== undefined) data.defaultHashtags = JSON.stringify(defaultHashtags || [])
    if (hashtagCount !== undefined) data.hashtagCount = hashtagCount
    if (aiCreativity !== undefined) data.aiCreativity = aiCreativity
    if (autoEmoji !== undefined) data.autoEmoji = autoEmoji
    if (autoHashtags !== undefined) data.autoHashtags = autoHashtags
    if (watermark !== undefined) data.watermark = watermark
    if (postingFrequency !== undefined) data.postingFrequency = postingFrequency
    if (bestPostingTime !== undefined) data.bestPostingTime = bestPostingTime || null
    if (timezone !== undefined) data.timezone = timezone

    const settings = await db.companySettings.upsert({
      where: { companyId },
      create: { companyId, ...data },
      update: data,
    })

    return NextResponse.json({ settings })
  } catch (e: any) {
    console.error('Settings save error:', e)
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
  }
}
