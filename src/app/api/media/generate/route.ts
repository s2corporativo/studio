import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'
import { db } from '@/lib/db'
import { logActivity, ACTIVITY_TYPES, ACTIVITY_COLORS } from '@/lib/activity'

const SIZE_MAP: Record<string, string> = {
  square: '1024x1024',
  portrait: '768x1344',
  landscape: '1344x768',
  story: '720x1440',
  wide: '1440x720',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, orientation = 'square', companyId, title, save = true } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt é obrigatório' }, { status: 400 })
    }

    const size = SIZE_MAP[orientation] || '1024x1024'
    const zai = await ZAI.create()

    const response = await zai.images.generations.create({
      prompt,
      size: size as any,
    })

    const imageBase64 = response.data[0]?.base64
    if (!imageBase64) {
      return NextResponse.json({ error: 'Falha na geração de imagem' }, { status: 500 })
    }

    const buffer = Buffer.from(imageBase64, 'base64')
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
    const filename = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`
    const filePath = path.join(uploadsDir, filename)
    fs.writeFileSync(filePath, buffer)
    const url = `/uploads/${filename}`

    // Parse dimensions
    const [w, h] = size.split('x').map(Number)

    let asset = null
    if (save) {
      asset = await db.mediaAsset.create({
        data: {
          companyId: companyId || null,
          title: title || prompt.slice(0, 60),
          url,
          type: 'image',
          source: 'ai',
          prompt,
          width: w,
          height: h,
          tags: JSON.stringify([]),
        },
      })
      await logActivity({
        companyId: companyId || null,
        type: ACTIVITY_TYPES.MEDIA_GENERATED,
        title: `Imagem gerada: ${title || prompt.slice(0, 40)}`,
        description: `${size} · IA`,
        icon: 'image',
        color: ACTIVITY_COLORS.media_generated,
        meta: { assetId: asset.id, url },
      })
    }

    return NextResponse.json({
      url,
      asset,
      prompt,
      size,
      width: w,
      height: h,
    })
  } catch (e: any) {
    console.error('Image generation error:', e)
    return NextResponse.json(
      { error: e?.message || 'Erro na geração de imagem' },
      { status: 500 }
    )
  }
}
