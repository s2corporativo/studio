import { NextRequest, NextResponse } from 'next/server'
import { generateSeo } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { topic, company, website, niche, content } = body
    if (!topic || !company) {
      return NextResponse.json({ error: 'Tópico e empresa são obrigatórios' }, { status: 400 })
    }
    const result = await generateSeo({ topic, company, website, niche, content })
    return NextResponse.json({ result })
  } catch (e: any) {
    console.error('AI SEO error:', e)
    return NextResponse.json({ error: e?.message || 'Erro na análise SEO' }, { status: 500 })
  }
}
