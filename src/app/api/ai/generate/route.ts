import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      topic,
      company,
      niche,
      tone,
      platforms,
      keywords,
      companyId,
      brandVoice,
      targetAudience,
      hashtagCount,
      aiCreativity,
      autoEmoji,
      autoHashtags,
    } = body
    if (!topic || !company || !platforms?.length) {
      return NextResponse.json({ error: 'Tópico, empresa e plataformas são obrigatórios' }, { status: 400 })
    }

    // Load company settings if companyId provided (explicit body values take precedence)
    let settingsBrandVoice = brandVoice
    let settingsAudience = targetAudience
    let settingsHashCount = hashtagCount
    let settingsCreativity = aiCreativity
    let settingsAutoEmoji = autoEmoji
    let settingsAutoHashtags = autoHashtags
    let settingsTone = tone

    if (companyId) {
      const settings = await db.companySettings.findUnique({ where: { companyId } })
      if (settings) {
        settingsBrandVoice = settingsBrandVoice ?? (settings.brandVoice || undefined)
        settingsAudience = settingsAudience ?? (settings.targetAudience || undefined)
        settingsHashCount = settingsHashCount ?? settings.hashtagCount
        settingsCreativity = settingsCreativity ?? settings.aiCreativity
        settingsAutoEmoji = settingsAutoEmoji ?? settings.autoEmoji
        settingsAutoHashtags = settingsAutoHashtags ?? settings.autoHashtags
        if (!settingsTone) settingsTone = settings.defaultTone
      }
    }

    const result = await generateContent({
      topic,
      company,
      niche,
      tone: settingsTone,
      platforms,
      keywords,
      brandVoice: settingsBrandVoice,
      targetAudience: settingsAudience,
      hashtagCount: settingsHashCount,
      aiCreativity: settingsCreativity,
      autoEmoji: settingsAutoEmoji,
      autoHashtags: settingsAutoHashtags,
    })
    return NextResponse.json({ result })
  } catch (e: any) {
    console.error('AI generate error:', e)
    return NextResponse.json({ error: e?.message || 'Erro na geração de conteúdo' }, { status: 500 })
  }
}
