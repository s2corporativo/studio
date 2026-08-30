/**
 * SocialHub Posting Worker
 *
 * A mini-service that automatically "publishes" scheduled posts when their
 * scheduledAt time arrives. It polls the database every 60 seconds for posts
 * with status 'scheduled' whose scheduledAt is in the past, marks them as
 * 'publishing', simulates the platform publishing (updates PostTarget status
 * to 'published', sets publishedAt, generates random engagement metrics),
 * then marks the post as 'published' and logs an activity event.
 *
 * This runs on port 3010 (no HTTP server needed — just a polling loop, but
 * we expose a tiny status endpoint for observability).
 *
 * Port: 3010
 */

// Import PrismaClient from the main project's generated client
import { PrismaClient } from '/home/z/my-project/node_modules/@prisma/client'

const PORT = 3010
const POLL_INTERVAL_MS = 60_000 // 1 minute

const db = new PrismaClient({
  log: ['error', 'warn'],
})

const STATS = {
  checked: 0,
  published: 0,
  failed: 0,
  lastRun: null as Date | null,
  lastPublishedIds: [] as string[],
}

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`)
}

/** Simulate publishing a post target to a social platform */
async function publishPostTarget(post: any, target: any) {
  // Simulate per-platform engagement based on platform and followers
  const account = await db.socialAccount.findFirst({
    where: { companyId: post.companyId, platform: target.platform },
  })
  const followerBase = account?.followers || 1000

  // Engagement rates vary by platform
  const engagementRates: Record<string, number> = {
    instagram: 0.045,
    facebook: 0.025,
    linkedin: 0.035,
    twitter: 0.015,
    tiktok: 0.08,
    youtube: 0.03,
  }
  const rate = engagementRates[target.platform] || 0.03
  const reach = Math.floor(followerBase * (0.3 + Math.random() * 0.5))
  const impressions = Math.floor(reach * (1.5 + Math.random()))
  const likes = Math.floor(impressions * rate * (0.5 + Math.random()))
  const comments = Math.floor(likes * (0.05 + Math.random() * 0.1))
  const shares = Math.floor(likes * (0.03 + Math.random() * 0.05))
  const saves = Math.floor(likes * (0.08 + Math.random() * 0.05))

  await db.postTarget.update({
    where: { id: target.id },
    data: {
      status: 'published',
      publishedAt: new Date(),
      likes,
      comments,
      shares,
      saves,
      reach,
      impressions,
    },
  })

  return { reach, impressions, likes, comments, shares, saves }
}

/** Process a single scheduled post due for publishing */
async function processPost(post: any) {
  log(`📢 Publicando post: "${post.title}" (${post.company?.name || '—'})`)

  try {
    // Mark as publishing
    await db.post.update({
      where: { id: post.id },
      data: { status: 'publishing' },
    })

    // Publish each target
    const results = []
    for (const target of post.targets) {
      const result = await publishPostTarget(post, target)
      results.push({ platform: target.platform, ...result })
      log(`  ✓ ${target.platform}: ${result.likes} likes, ${result.reach} reach`)
      // Small delay between platforms
      await new Promise((r) => setTimeout(r, 200))
    }

    // Mark post as published
    await db.post.update({
      where: { id: post.id },
      data: { status: 'published' },
    })

    // Log activity event
    await db.activityEvent.create({
      data: {
        companyId: post.companyId,
        type: 'post_published',
        title: `Post publicado: ${post.title}`,
        description: `${results.length} plataforma(s) • ${results.reduce((a, r) => a + r.likes, 0)} curtidas totais`,
        icon: 'check',
        color: '#10B981',
        meta: JSON.stringify({ postId: post.id, results }),
      },
    })

    // Create an analytics snapshot for today
    const today = new Date()
    for (const r of results) {
      const existing = await db.analyticsSnapshot.findFirst({
        where: {
          companyId: post.companyId,
          platform: r.platform,
          date: { gte: new Date(today.setHours(0, 0, 0, 0)) },
        },
      })
      if (existing) {
        await db.analyticsSnapshot.update({
          where: { id: existing.id },
          data: {
            reach: existing.reach + r.reach,
            engagement: existing.engagement + r.likes + r.comments + r.shares,
            impressions: existing.impressions + r.impressions,
            clicks: existing.clicks + Math.floor(r.likes * 0.1),
          },
        })
      } else {
        await db.analyticsSnapshot.create({
          data: {
            companyId: post.companyId,
            platform: r.platform,
            date: new Date(),
            followers: 0,
            reach: r.reach,
            engagement: r.likes + r.comments + r.shares,
            clicks: Math.floor(r.likes * 0.1),
            impressions: r.impressions,
          },
        })
      }
    }

    STATS.published++
    STATS.lastPublishedIds.push(post.id)
    if (STATS.lastPublishedIds.length > 20) STATS.lastPublishedIds.shift()
    log(`✅ Post "${post.title}" publicado com sucesso!`)
  } catch (e: any) {
    log(`❌ Erro ao publicar post ${post.id}: ${e.message}`)
    STATS.failed++
    // Mark as failed
    await db.post.update({
      where: { id: post.id },
      data: { status: 'failed' },
    }).catch(() => {})
  }
}

/** Poll for due scheduled posts */
async function poll() {
  STATS.checked++
  STATS.lastRun = new Date()
  try {
    const duePosts = await db.post.findMany({
      where: {
        status: 'scheduled',
        scheduledAt: { lte: new Date() },
      },
      include: {
        targets: true,
        company: { select: { name: true, brandColor: true } },
      },
    })

    if (duePosts.length > 0) {
      log(`🔍 Encontrados ${duePosts.length} post(s) agendado(s) para publicação`)
      for (const post of duePosts) {
        await processPost(post)
      }
    }
  } catch (e: any) {
    log(`❌ Erro no polling: ${e.message}`)
  }
}

// Minimal HTTP status server (for observability via gateway)
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)
    if (url.pathname === '/health' || url.pathname === '/') {
      return Response.json({
        status: 'running',
        service: 'socialhub-posting-worker',
        port: PORT,
        pollIntervalMs: POLL_INTERVAL_MS,
        stats: STATS,
        uptime: process.uptime(),
      })
    }
    if (url.pathname === '/trigger') {
      log('📍 Trigger manual recebido')
      await poll()
      return Response.json({ triggered: true, stats: STATS })
    }
    return new Response('Not Found', { status: 404 })
  },
})

log(`🚀 SocialHub Posting Worker iniciado na porta ${PORT}`)
log(`📋 Polling a cada ${POLL_INTERVAL_MS / 1000}s por posts agendados`)

// Initial poll
await poll()

// Start polling interval
setInterval(poll, POLL_INTERVAL_MS)
