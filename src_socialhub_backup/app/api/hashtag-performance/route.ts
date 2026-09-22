import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  const limit = parseInt(searchParams.get('limit') || '20')

  // Fetch all published posts with their targets (engagement metrics)
  const where: any = { status: 'published' }
  if (companyId) where.companyId = companyId

  const posts = await db.post.findMany({
    where,
    include: {
      targets: true,
      company: { select: { name: true, brandColor: true } },
    },
    take: 500,
  })

  // Aggregate hashtag performance
  const hashtagMap = new Map<
    string,
    {
      tag: string
      uses: number
      likes: number
      comments: number
      shares: number
      reach: number
      impressions: number
      posts: number
      companies: Set<string>
    }
  >()

  for (const post of posts) {
    let tags: string[] = []
    try {
      tags = JSON.parse(post.hashtags || '[]')
    } catch {
      tags = []
    }
    if (!Array.isArray(tags)) tags = []

    // Sum engagement across all targets of this post
    const postLikes = post.targets.reduce((a, t) => a + t.likes, 0)
    const postComments = post.targets.reduce((a, t) => a + t.comments, 0)
    const postShares = post.targets.reduce((a, t) => a + t.shares, 0)
    const postReach = post.targets.reduce((a, t) => a + t.reach, 0)
    const postImpressions = post.targets.reduce((a, t) => a + t.impressions, 0)

    for (const tag of tags) {
      const cleanTag = tag.toLowerCase().replace(/^#/, '').trim()
      if (!cleanTag) continue
      if (!hashtagMap.has(cleanTag)) {
        hashtagMap.set(cleanTag, {
          tag: cleanTag,
          uses: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          reach: 0,
          impressions: 0,
          posts: 0,
          companies: new Set(),
        })
      }
      const h = hashtagMap.get(cleanTag)!
      h.uses++
      h.likes += postLikes
      h.comments += postComments
      h.shares += postShares
      h.reach += postReach
      h.impressions += postImpressions
      h.posts++
      if (post.company?.name) h.companies.add(post.company.name)
    }
  }

  // Convert to array and compute engagement rate
  const hashtags = Array.from(hashtagMap.values())
    .map((h) => ({
      tag: h.tag,
      uses: h.uses,
      posts: h.posts,
      likes: h.likes,
      comments: h.comments,
      shares: h.shares,
      reach: h.reach,
      impressions: h.impressions,
      engagement: h.likes + h.comments + h.shares,
      engagementRate: h.impressions > 0 ? ((h.likes + h.comments + h.shares) / h.impressions) * 100 : 0,
      avgReach: h.uses > 0 ? Math.round(h.reach / h.uses) : 0,
      avgEngagement: h.uses > 0 ? Math.round((h.likes + h.comments + h.shares) / h.uses) : 0,
      companies: Array.from(h.companies),
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, limit)

  // Compute summary stats
  const totalEngagement = hashtags.reduce((a, h) => a + h.engagement, 0)
  const totalReach = hashtags.reduce((a, h) => a + h.reach, 0)
  const avgRate =
    hashtags.length > 0
      ? (hashtags.reduce((a, h) => a + h.engagementRate, 0) / hashtags.length).toFixed(2)
      : '0'

  return NextResponse.json({
    hashtags,
    summary: {
      totalTags: hashtagMap.size,
      totalEngagement,
      totalReach,
      avgEngagementRate: avgRate,
    },
  })
}
