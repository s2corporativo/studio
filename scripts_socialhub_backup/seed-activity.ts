import { db } from '../src/lib/db'

async function main() {
  // Get some existing data
  const companies = await db.company.findMany({ take: 3 })
  const posts = await db.post.findMany({ take: 5, orderBy: { createdAt: 'desc' } })
  const accounts = await db.socialAccount.findMany({ take: 4 })

  if (companies.length === 0) {
    console.log('No companies found, skipping activity seed')
    return
  }

  const now = new Date()
  const events: any[] = []

  for (const c of companies) {
    events.push({
      companyId: c.id,
      type: 'company_added',
      title: `Empresa criada: ${c.name}`,
      description: c.niche ? `Nicho: ${c.niche}` : undefined,
      icon: 'building',
      color: '#0EA5E9',
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      read: true,
    })
  }

  for (const acc of accounts) {
    events.push({
      companyId: acc.companyId,
      type: 'account_connected',
      title: `Conta conectada: ${acc.platform} · ${acc.handle}`,
      description: `Nova conta em ${acc.platform}`,
      icon: 'share',
      color: '#06B6D4',
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      read: true,
    })
  }

  for (const p of posts.slice(0, 4)) {
    const isScheduled = p.status === 'scheduled'
    events.push({
      companyId: p.companyId,
      type: isScheduled ? 'post_scheduled' : 'post_created',
      title: `${isScheduled ? 'Post agendado' : 'Post criado'}: ${p.title}`,
      description: p.content?.slice(0, 80),
      icon: isScheduled ? 'calendar-clock' : 'plus',
      color: isScheduled ? '#F59E0B' : '#7C3AED',
      createdAt: p.createdAt,
      read: p.status === 'published',
    })
  }

  events.push({
    companyId: companies[0].id,
    type: 'media_generated',
    title: 'Imagem gerada: Café especial',
    description: '1024x1024 · IA',
    icon: 'image',
    color: '#EC4899',
    createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    read: false,
  })

  events.push({
    companyId: companies[0].id,
    type: 'idea_generated',
    title: '8 ideias geradas',
    description: 'Banco de ideias atualizado via IA',
    icon: 'lightbulb',
    color: '#F59E0B',
    createdAt: new Date(now.getTime() - 60 * 60 * 1000),
    read: false,
  })

  events.push({
    companyId: companies[0].id,
    type: 'post_scheduled',
    title: 'Post agendado: Black Friday: todos os produtos com 30% de desconto por 24 horas apenas',
    description: 'Para 2 plataforma(s)',
    icon: 'calendar-clock',
    color: '#F59E0B',
    createdAt: new Date(now.getTime() - 30 * 60 * 1000),
    read: false,
  })

  for (const e of events) {
    await db.activityEvent.create({ data: e })
  }

  console.log(`Seeded ${events.length} activity events`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
