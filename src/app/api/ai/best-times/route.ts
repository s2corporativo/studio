import { NextRequest, NextResponse } from 'next/server'
import { generateBestTimes } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { niche, platforms } = body
    if (!niche || !platforms?.length) {
      return NextResponse.json({ error: 'Nicho e plataformas são obrigatórios' }, { status: 400 })
    }
    const result = await generateBestTimes({ niche, platforms })
    return NextResponse.json({ result })
  } catch (e: any) {
    console.error('AI best times error:', e)
    return NextResponse.json({ error: e?.message || 'Erro' }, { status: 500 })
  }
}
