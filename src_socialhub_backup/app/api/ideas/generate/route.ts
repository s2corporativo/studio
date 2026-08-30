import { NextRequest, NextResponse } from 'next/server'
import { getAI } from '@/lib/ai'
import { db } from '@/lib/db'
import { logActivity, ACTIVITY_TYPES, ACTIVITY_COLORS } from '@/lib/activity'

interface GeneratedIdea {
  title: string
  description: string
  category: string
  platform: string
  angle: string
  hashtags: string[]
  bestDay: string
  bestTime: string
  score: number
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { company, niche, platforms, count = 8, companyId, save = true } = body

    if (!company || !niche) {
      return NextResponse.json({ error: 'Empresa e nicho são obrigatórios' }, { status: 400 })
    }

    const zai = await getAI()
    const systemPrompt = `You are a senior social media content strategist for Brazilian companies. You design high-performing content ideas that drive engagement and conversions. You understand each platform's algorithm and audience. Respond with STRICT valid JSON only, no markdown, no code fences.`

    const userPrompt = `Gere ${count} ideias de conteúdo para redes sociais para:
- Empresa: ${company}
- Nicho: ${niche}
- Plataformas-alvo: ${platforms?.join(', ') || 'instagram, facebook, linkedin'}

Crie ideias diversificadas cobrindo: educacional, engajamento, bastidores, promoção, storytelling, dicas, tendências, provação social.

Responda SOMENTE com este JSON:
{
  "ideas": [
    {
      "title": "titulo curto e atrativo (max 60 chars)",
      "description": "descricao detalhada do post e como executa-lo (2-3 frases)",
      "category": "educacional|engajamento|promocional|storytelling|produto|anuncio",
      "platform": "instagram|facebook|linkedin|twitter|tiktok|youtube",
      "angle": "angulo/gancho principal da ideia",
      "hashtags": ["5", "hashtags", "relevantes"],
      "bestDay": "segunda|terca|quarta|quinta|sexta|sabado|domingo",
      "bestTime": "HH:MM",
      "score": 70
    }
  ]
}
Varie os scores entre 60-95 baseado no potencial de engajamento. NÃO use crases nem markdown. Apenas JSON puro.`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const raw = completion.choices[0]?.message?.content || ''
    const parsed = parseAIJSON(raw)
    const ideas: GeneratedIdea[] = parsed.ideas || []

    let saved = []
    if (save && companyId) {
      for (const idea of ideas) {
        const created = await db.contentIdea.create({
          data: {
            companyId,
            title: idea.title,
            description: idea.description,
            category: idea.category || 'educacional',
            platform: idea.platform || 'instagram',
            angle: idea.angle || null,
            hashtags: JSON.stringify(idea.hashtags || []),
            bestDay: idea.bestDay || null,
            bestTime: idea.bestTime || null,
            score: typeof idea.score === 'number' ? idea.score : 50,
          },
        })
        saved.push(created)
      }
      await logActivity({
        companyId,
        type: ACTIVITY_TYPES.IDEA_GENERATED,
        title: `${ideas.length} ideias geradas`,
        description: `Banco de ideias atualizado via IA`,
        icon: 'lightbulb',
        color: ACTIVITY_COLORS.idea_generated,
        meta: { count: ideas.length },
      })
    }

    return NextResponse.json({
      ideas: save && companyId ? saved : ideas,
      count: ideas.length,
    })
  } catch (e: any) {
    console.error('Ideas generation error:', e)
    return NextResponse.json({ error: e?.message || 'Erro ao gerar ideias' }, { status: 500 })
  }
}

function parseAIJSON(raw: string): any {
  let text = raw.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
  }
  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  if (first !== -1 && last !== -1) {
    text = text.slice(first, last + 1)
  }
  try {
    return JSON.parse(text)
  } catch {
    return { ideas: [] }
  }
}
