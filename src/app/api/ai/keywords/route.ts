import { NextRequest, NextResponse } from 'next/server'
import { generateKeywords } from '@/lib/ai'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { company, niche, location, companyId, save } = body
    if (!company || !niche) {
      return NextResponse.json({ error: 'Empresa e nicho são obrigatórios' }, { status: 400 })
    }
    const keywords = await generateKeywords({ company, niche, location })

    if (save && companyId) {
      for (const kw of keywords) {
        await db.seoKeyword.create({
          data: {
            companyId,
            keyword: kw.keyword,
            volume: kw.volume,
            difficulty: kw.difficulty,
            rank: Math.floor(Math.random() * 30) + 1,
            trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as string,
            intent: kw.intent,
          },
        })
      }
    }

    return NextResponse.json({ keywords })
  } catch (e: any) {
    console.error('AI keywords error:', e)
    return NextResponse.json({ error: e?.message || 'Erro na pesquisa de palavras-chave' }, { status: 500 })
  }
}
