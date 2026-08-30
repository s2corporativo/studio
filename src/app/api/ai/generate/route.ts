import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { topic, company, niche, tone, platforms, keywords } = body
    if (!topic || !company || !platforms?.length) {
      return NextResponse.json({ error: 'Tópico, empresa e plataformas são obrigatórios' }, { status: 400 })
    }
    const result = await generateContent({ topic, company, niche, tone, platforms, keywords })
    return NextResponse.json({ result })
  } catch (e: any) {
    console.error('AI generate error:', e)
    return NextResponse.json({ error: e?.message || 'Erro na geração de conteúdo' }, { status: 500 })
  }
}
