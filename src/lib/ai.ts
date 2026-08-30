import ZAI from 'z-ai-web-dev-sdk'

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

export async function getAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

export interface GeneratedContent {
  caption: string
  hashtags: string[]
  variations: { platform: string; content: string }[]
}

/** Generate social media content variations per platform */
export async function generateContent(opts: {
  topic: string
  company: string
  niche?: string
  tone?: string
  platforms: string[]
  keywords?: string[]
  brandVoice?: string
  targetAudience?: string
  hashtagCount?: number
  aiCreativity?: number
  autoEmoji?: boolean
  autoHashtags?: boolean
}): Promise<{ caption: string; hashtags: string[]; variations: Record<string, string> }> {
  const zai = await getAI()
  const platformList = opts.platforms.join(', ')
  const hashCount = opts.hashtagCount || 10
  const useEmojis = opts.autoEmoji !== false
  const useHashtags = opts.autoHashtags !== false

  const systemPrompt = `You are an elite social media strategist and copywriter for Brazilian companies. You craft engaging, platform-native content in Brazilian Portuguese. You understand each platform's best practices: Instagram (visual, hashtags, emojis), LinkedIn (professional, value-driven), Twitter/X (concise, punchy), Facebook (conversational, community), TikTok (trendy, casual), YouTube (descriptive, keyword-rich). Always respond with STRICT valid JSON only, no markdown, no code fences.`

  const brandVoiceLine = opts.brandVoice
    ? `\n- VOZ DA MARCA (siga estritamente): ${opts.brandVoice}`
    : ''
  const audienceLine = opts.targetAudience
    ? `\n- Público-alvo: ${opts.targetAudience}`
    : ''
  const creativityLine =
    opts.aiCreativity !== undefined
      ? `\n- Nível de criatividade: ${opts.aiCreativity}/100 (${opts.aiCreativity < 40 ? 'conservador, direto ao ponto' : opts.aiCreativity > 75 ? 'muito criativo, ousado, surpreendente' : 'equilibrado'})`
      : ''

  const userPrompt = `Gere conteúdo para redes sociais com estes parâmetros:
- Empresa: ${opts.company}
- Nicho: ${opts.niche || 'geral'}
- Tom de voz: ${opts.tone || 'profissional e amigável'}${brandVoiceLine}${audienceLine}${creativityLine}
- Tópico/Mensagem: ${opts.topic}
- Palavras-chave SEO: ${(opts.keywords || []).join(', ') || 'nenhuma'}
- Plataformas: ${platformList}

Responda SOMENTE com este JSON exato:
{
  "caption": "uma legenda principal envolvente em português (2-4 frases${useEmojis ? ', com emojis moderados' : ', sem emojis'}),
  "hashtags": ${useHashtags ? `["array", "de", "${hashCount}", "hashtags", "relevantes", "sem", "o", "simbolo"]` : '[]'},
  "variations": {
    "instagram": "legenda adaptada para instagram${useEmojis ? ' com emojis' : ''}",
    "linkedin": "versão profissional e orientada a valor",
    "twitter": "versão concisa <= 280 caracteres",
    "facebook": "versão conversacional",
    "tiktok": "versão casual e trend",
    "youtube": "descrição rica em palavras-chave"
  }
}
Inclua apenas as plataformas solicitadas (${platformList}) no objeto variations. ${useHashtags ? `Gere exatamente ${hashCount} hashtags.` : 'Não inclua hashtags.'} NÃO use crases nem markdown. Apenas JSON puro.`

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  })

  const raw = completion.choices[0]?.message?.content || ''
  return parseAIJSON(raw)
}

export interface SeoSuggestion {
  title: string
  metaDescription: string
  keywords: string[]
  googleTips: string[]
  aiEngineTips: string[]
  schema: string
}

/** Generate SEO + AI engine optimization suggestions */
export async function generateSeo(opts: {
  topic: string
  company: string
  website?: string
  niche?: string
  content?: string
}): Promise<SeoSuggestion> {
  const zai = await getAI()
  const systemPrompt = `You are a world-class SEO and AI-search (AEO/GEO) specialist. You optimize content for both Google Search AND AI engines (ChatGPT, Google AI Overviews, Perplexity). You know schema.org, E-E-A-T, semantic SEO, entity optimization, and how to get cited by LLMs. Respond with STRICT valid JSON only, no markdown.`

  const userPrompt = `Gere recomendações de SEO e otimização para motores de IA para:
- Empresa: ${opts.company}
- Website: ${opts.website || 'não informado'}
- Nicho: ${opts.niche || 'geral'}
- Tópico: ${opts.topic}
- Conteúdo existente: ${(opts.content || '').slice(0, 800) || 'nenhum'}

Responda SOMENTE com este JSON:
{
  "title": "title tag otimizado (50-60 caracteres)",
  "metaDescription": "meta description persuasiva (140-160 caracteres)",
  "keywords": ["8", "palavras", "chave", "principais"],
  "googleTips": ["5", "dicas", "praticas", "para", "Google"],
  "aiEngineTips": ["5", "estrategias", "para", "ser", "citado", "por", "IAs"],
  "schema": "JSON-LD schema.org valido para o conteudo"
}
NÃO use crases nem markdown. Apenas JSON puro.`

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  })

  const raw = completion.choices[0]?.message?.content || ''
  return parseAIJSON(raw)
}

/** Generate SEO keyword research */
export async function generateKeywords(opts: {
  company: string
  niche: string
  location?: string
}): Promise<{ keyword: string; volume: number; difficulty: number; intent: string }[]> {
  const zai = await getAI()
  const systemPrompt = `You are an SEO keyword research expert. You analyze search volume, difficulty and intent. Respond with STRICT valid JSON only.`

  const userPrompt = `Pesquise 12 palavras-chave de cauda longa para SEO para:
- Empresa: ${opts.company}
- Nicho: ${opts.niche}
- Local: ${opts.location || 'Brasil'}

Responda SOMENTE com:
{
  "keywords": [
    {"keyword": "palavra chave", "volume": 1200, "difficulty": 35, "intent": "informational"}
  ]
}
Use volumes realistas (100-10000), difficulty (1-100), intent entre: informational, commercial, transactional, navigational. Apenas JSON puro, sem markdown.`

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  })

  const raw = completion.choices[0]?.message?.content || ''
  const parsed = parseAIJSON(raw)
  return parsed.keywords || []
}

/** Generate best posting time recommendations */
export async function generateBestTimes(opts: {
  niche: string
  platforms: string[]
}): Promise<Record<string, { day: string; time: string; reason: string }[]>> {
  const zai = await getAI()
  const systemPrompt = `You are a social media analytics expert who knows optimal posting times by platform and niche. Respond with STRICT valid JSON only.`

  const userPrompt = `Para o nicho "${opts.niche}", recomende os melhores horários para postar em: ${opts.platforms.join(', ')}.
Responda SOMENTE com:
{
  "instagram": [{"day": "segunda", "time": "12:00", "reason": "motivo"}],
  "linkedin": [{"day": "...", "time": "...", "reason": "..."}]
}
Cada plataforma com 3 horários. Dias em português. Apenas JSON puro.`

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  })

  const raw = completion.choices[0]?.message?.content || ''
  return parseAIJSON(raw)
}

function parseAIJSON(raw: string): any {
  let text = raw.trim()
  // Strip code fences if present
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
  }
  // Find first { and last }
  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  if (first !== -1 && last !== -1) {
    text = text.slice(first, last + 1)
  }
  try {
    return JSON.parse(text)
  } catch {
    return { caption: raw, hashtags: [], variations: {} }
  }
}

/** Generate hashtag groups for a niche via AI */
export async function generateHashtagGroups(opts: {
  company: string
  niche: string
  platform?: string
}): Promise<{ name: string; tags: string[]; description: string; category: string }[]> {
  const zai = await getAI()
  const systemPrompt = `You are a social media hashtag strategist for Brazilian companies. You know trending hashtags, niche-specific tags, and how to build hashtag sets that maximize reach without looking spammy. Respond with STRICT valid JSON only, no markdown.`

  const userPrompt = `Gere 6 grupos de hashtags para:
- Empresa: ${opts.company}
- Nicho: ${opts.niche}
${opts.platform ? `- Plataforma foco: ${opts.platform}` : ''}

Crie grupos variados cobrindo: branded (marca), niche-specific, trending/populares, local/community, educational/informative, engagement/community.

Responda SOMENTE com:
{
  "groups": [
    {
      "name": "nome do grupo (ex: Hashtags da Marca)",
      "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"],
      "description": "quando usar este grupo",
      "category": "branded|nicho|trending|local|educacional|engajamento"
    }
  ]
}
Cada grupo com 6-10 hashtags SEM o símbolo #. Tags em português quando relevante. NÃO use crases nem markdown. Apenas JSON puro.`

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  })

  const raw = completion.choices[0]?.message?.content || ''
  const parsed = parseAIJSON(raw)
  return parsed.groups || []
}

/** Generate competitor analysis via AI */
export async function generateCompetitorAnalysis(opts: {
  company: string
  niche: string
  location?: string
}): Promise<{
  competitors: {
    name: string
    handle: string
    strengths: string[]
    weaknesses: string[]
    contentThemes: string[]
    postingFrequency: string
    avgEngagement: string
    threatLevel: string
    opportunity: string
  }[]
  insights: {
    marketGaps: string[]
    contentOpportunities: string[]
    differentiationTips: string[]
  }
}> {
  const zai = await getAI()
  const systemPrompt = `You are a senior competitive intelligence analyst for Brazilian companies. You analyze social media competitors, identify market gaps, and recommend differentiation strategies. You respond with STRICT valid JSON only, no markdown, no code fences.`

  const userPrompt = `Analise os concorrentes para:
- Empresa: ${opts.company}
- Nicho: ${opts.niche}
- Local: ${opts.location || 'Brasil'}

Identifique 4 concorrentes reais ou realistas neste nicho (use marcas conhecidas se aplicável, ou perfis plausíveis). Para cada um, analise presença em redes sociais.

Responda SOMENTE com este JSON:
{
  "competitors": [
    {
      "name": "nome do concorrente",
      "handle": "@handle_principal",
      "strengths": ["3", "pontos", "fortes"],
      "weaknesses": ["3", "pontos", "fracos"],
      "contentThemes": ["3-4", "temas", "de", "conteudo"],
      "postingFrequency": "diário|semanal|3x semana",
      "avgEngagement": "alto|médio|baixo",
      "threatLevel": "low|medium|high",
      "opportunity": "como sua empresa pode se diferenciar deste concorrente"
    }
  ],
  "insights": {
    "marketGaps": ["3", "lacunas", "de", "mercado", "identificadas"],
    "contentOpportunities": ["3", "oportunidades", "de", "conteudo"],
    "differentiationTips": ["3", "dicas", "de", "diferenciação"]
  }
}
NÃO use crases nem markdown. Apenas JSON puro.`

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  })

  const raw = completion.choices[0]?.message?.content || ''
  const parsed = parseAIJSON(raw)
  return {
    competitors: parsed.competitors || [],
    insights: parsed.insights || { marketGaps: [], contentOpportunities: [], differentiationTips: [] },
  }
}
