import { db } from '../src/lib/db'

async function main() {
  // Clean
  await db.postTarget.deleteMany()
  await db.post.deleteMany()
  await db.socialAccount.deleteMany()
  await db.analyticsSnapshot.deleteMany()
  await db.seoKeyword.deleteMany()
  await db.contentTemplate.deleteMany()
  await db.company.deleteMany()

  const companies = [
    {
      name: 'Café Aurora',
      description: 'Cafeteria artesanal com grãos especiais selecionados direto do produtor.',
      niche: 'Gastronomia / Cafeteria',
      website: 'https://cafeaurora.com.br',
      brandColor: '#B45309',
      city: 'São Paulo, SP',
    },
    {
      name: 'Studio Vértice',
      description: 'Estúdio de arquitetura e design de interiores contemporâneo.',
      niche: 'Arquitetura / Design',
      website: 'https://studiovertice.com.br',
      brandColor: '#0F766E',
      city: 'Curitiba, PR',
    },
    {
      name: 'Loja Bem-Estar',
      description: 'Produtos naturais, suplementos e cosméticos sustentáveis.',
      niche: 'Saúde / Bem-estar',
      website: 'https://lojabemestar.com.br',
      brandColor: '#7C3AED',
      city: 'Rio de Janeiro, RJ',
    },
  ]

  const platforms = ['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok', 'youtube'] as const

  for (const c of companies) {
    const company = await db.company.create({ data: c })

    const accountSet = platforms.slice(0, 4)
    for (const p of accountSet) {
      const handle = `@${company.name.toLowerCase().replace(/[^a-z]/g, '')}_${p.slice(0, 2)}`
      await db.socialAccount.create({
        data: {
          companyId: company.id,
          platform: p,
          handle,
          displayName: company.name,
          profileUrl: `https://${p}.com/${handle}`,
          followers: Math.floor(Math.random() * 40000) + 800,
          following: Math.floor(Math.random() * 500) + 50,
          posts: Math.floor(Math.random() * 800) + 50,
          connected: true,
          verified: Math.random() > 0.6,
        },
      })
    }

    const nicheFirst = (c.niche || 'empresa').split(' ')[0].toLowerCase()
    const cityFirst = (c.city || 'Brasil').split(',')[0].toLowerCase()
    const kwSeed: { keyword: string; intent: string }[] = [
      { keyword: `${nicheFirst} perto de mim`, intent: 'transactional' },
      { keyword: `melhor ${nicheFirst} ${cityFirst}`, intent: 'commercial' },
      { keyword: `como escolher ${nicheFirst}`, intent: 'informational' },
      { keyword: `${company.name.toLowerCase()} avaliação`, intent: 'navigational' },
    ]
    for (const kw of kwSeed) {
      await db.seoKeyword.create({
        data: {
          companyId: company.id,
          keyword: kw.keyword,
          volume: Math.floor(Math.random() * 5000) + 200,
          difficulty: Math.floor(Math.random() * 80) + 10,
          rank: Math.floor(Math.random() * 50) + 1,
          trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as string,
          intent: kw.intent,
        },
      })
    }

    const now = new Date()
    for (const p of accountSet) {
      for (let i = 13; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        await db.analyticsSnapshot.create({
          data: {
            companyId: company.id,
            platform: p,
            date,
            followers: Math.floor(Math.random() * 3000) + 500 + (13 - i) * 30,
            reach: Math.floor(Math.random() * 20000) + 1000,
            engagement: Math.floor(Math.random() * 3000) + 200,
            clicks: Math.floor(Math.random() * 800) + 50,
            impressions: Math.floor(Math.random() * 50000) + 5000,
          },
        })
      }
    }

    const samplePosts = [
      {
        title: 'Lançamento de coleção',
        content: 'Estamos animados em apresentar nossa nova coleção exclusiva! Cada peça foi pensada para trazer conforto e estilo para o seu dia a dia. ✨ Venha conferir!',
        category: 'promocional',
        tone: 'profissional',
        status: 'published' as const,
        offset: -3,
      },
      {
        title: 'Dica do dia',
        content: 'Você sabia que pequenos hábitos podem transformar a sua rotina? Hoje compartilhamos 3 dicas práticas para você aplicar agora mesmo.',
        category: 'educacional',
        tone: 'casual',
        status: 'published' as const,
        offset: -1,
      },
      {
        title: 'Campanha de fim de semana',
        content: 'Aproveite nosso final de semana especial com condições únicas para nossos seguidores. Não perca!',
        category: 'anuncio',
        tone: 'vendas',
        status: 'scheduled' as const,
        offset: 2,
      },
      {
        title: 'História da marca',
        content: 'Tudo começou com um sonho e muita determinação. Hoje celebramos nossa jornada e agradecemos a cada um de vocês que faz parte dela.',
        category: 'storytelling',
        tone: 'inspirador',
        status: 'scheduled' as const,
        offset: 5,
      },
      {
        title: 'Bastidores',
        content: 'Que tal um olhar nos bastidores de como tudo acontece por aqui? Em breve compartilhamos tudo com vocês!',
        category: 'engajamento',
        tone: 'divertido',
        status: 'draft' as const,
        offset: 7,
      },
    ]

    for (const sp of samplePosts) {
      const sched = new Date(now)
      sched.setDate(sched.getDate() + sp.offset)
      sched.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60))
      const post = await db.post.create({
        data: {
          companyId: company.id,
          title: sp.title,
          content: sp.content,
          hashtags: JSON.stringify(['novidade', 'lifestyle', 'brasil', 'inspiracao']),
          scheduledAt: sp.status === 'draft' ? null : sched,
          status: sp.status,
          category: sp.category,
          tone: sp.tone,
        },
      })
      for (const p of accountSet) {
        await db.postTarget.create({
          data: {
            postId: post.id,
            platform: p,
            content: sp.content,
            status: sp.status === 'published' ? 'published' : 'pending',
            publishedAt: sp.status === 'published' ? sched : null,
            likes: sp.status === 'published' ? Math.floor(Math.random() * 500) + 20 : 0,
            comments: sp.status === 'published' ? Math.floor(Math.random() * 80) + 5 : 0,
            shares: sp.status === 'published' ? Math.floor(Math.random() * 50) + 2 : 0,
            saves: sp.status === 'published' ? Math.floor(Math.random() * 100) + 5 : 0,
            reach: sp.status === 'published' ? Math.floor(Math.random() * 8000) + 500 : 0,
            impressions: sp.status === 'published' ? Math.floor(Math.random() * 15000) + 1000 : 0,
          },
        })
      }
    }

    await db.contentTemplate.create({
      data: {
        companyId: company.id,
        name: 'Post de Produto',
        structure: 'Gancho + Benefício + Prova social + CTA',
        tone: 'vendas',
        category: 'promocional',
      },
    })
    await db.contentTemplate.create({
      data: {
        companyId: company.id,
        name: 'Dica Educativa',
        structure: 'Problema + Solução + Dica prática + Pergunta de engajamento',
        tone: 'autoridade',
        category: 'educacional',
      },
    })
  }

  console.log('Seed completed!')
  const counts = {
    companies: await db.company.count(),
    socialAccounts: await db.socialAccount.count(),
    posts: await db.post.count(),
    postTargets: await db.postTarget.count(),
    analytics: await db.analyticsSnapshot.count(),
    seoKeywords: await db.seoKeyword.count(),
    templates: await db.contentTemplate.count(),
  }
  console.log(counts)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
