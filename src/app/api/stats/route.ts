import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')

  const where: any = {}
  if (companyId) where.companyId = companyId

  const [companies, accounts, posts, publishedPosts, scheduledPosts, drafts] = await Promise.all([
    db.company.count(),
    db.socialAccount.count({ where }),
    db.post.findMany({
      where,
      include: { targets: true },
      orderBy: { scheduledAt: 'desc' },
      take: 500,
    }),
    db.post.count({ where: { ...where, status: 'published' } }),
    db.post.count({ where: { ...where, status: 'scheduled' } }),
    db.post.count({ where: { ...where, status: 'draft' } }),
  ])

  // Calculate total engagement from published posts' targets
  let totalLikes = 0
  let totalComments = 0
  let totalShares = 0
  let totalReach = 0
  let totalImpressions = 0
  for (const p of posts) {
    for (const t of p.targets) {
      totalLikes += t.likes
      totalComments += t.comments
      totalShares += t.shares
      totalReach += t.reach
      totalImpressions += t.impressions
    }
  }

  // Recent upcoming posts
  const upcoming = await db.post.findMany({
    where: { ...where, scheduledAt: { gte: new Date() }, status: 'scheduled' },
    orderBy: { scheduledAt: 'asc' },
    take: 6,
    include: { company: { select: { name: true, brandColor: true } }, targets: true },
  })

  return NextResponse.json({
    totals: {
      companies,
      accounts,
      posts: posts.length,
      publishedPosts,
      scheduledPosts,
      drafts,
      totalLikes,
      totalComments,
      totalShares,
      totalReach,
      totalImpressions,
      engagementRate:
        totalImpressions > 0
          ? (((totalLikes + totalComments + totalShares) / totalImpressions) * 100).toFixed(2)
          : '0',
    },
    upcoming,
  })
}
