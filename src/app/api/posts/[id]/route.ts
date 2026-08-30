import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity, ACTIVITY_TYPES, ACTIVITY_COLORS } from '@/lib/activity'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const post = await db.post.findUnique({
    where: { id },
    include: { targets: true, company: true },
  })
  if (!post) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json({ post })
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const action = body.action
  try {
    if (action === 'duplicate') {
      const original = await db.post.findUnique({
        where: { id },
        include: { targets: true },
      })
      if (!original) return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 })
      const dup = await db.post.create({
        data: {
          companyId: original.companyId,
          title: `${original.title} (cópia)`,
          content: original.content,
          hashtags: original.hashtags,
          mediaUrls: original.mediaUrls,
          scheduledAt: null,
          status: 'draft',
          category: original.category,
          tone: original.tone,
          targets: {
            create: original.targets.map((t) => ({
              platform: t.platform,
              content: t.content,
              status: 'pending',
            })),
          },
        },
        include: { targets: true },
      })
      await logActivity({
        companyId: original.companyId,
        type: ACTIVITY_TYPES.POST_CREATED,
        title: `Post duplicado: ${original.title}`,
        description: 'Cópia criada como rascunho',
        icon: 'plus',
        color: ACTIVITY_COLORS.post_created,
        meta: { originalId: id, newId: dup.id },
      })
      return NextResponse.json({ post: dup }, { status: 201 })
    }
    return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json()
  const {
    title,
    content,
    hashtags,
    mediaUrls,
    scheduledAt,
    status,
    category,
    tone,
    platforms,
    variations,
  } = body

  try {
    // Replace targets if platforms provided
    if (platforms) {
      await db.postTarget.deleteMany({ where: { postId: id } })
      await db.postTarget.createMany({
        data: platforms.map((p: string) => ({
          postId: id,
          platform: p,
          content: variations?.[p] || content,
          status: 'pending',
        })),
      })
    }

    const post = await db.post.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(hashtags !== undefined && { hashtags: JSON.stringify(hashtags) }),
        ...(mediaUrls !== undefined && { mediaUrls: JSON.stringify(mediaUrls) }),
        ...(scheduledAt !== undefined && {
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        }),
        ...(status !== undefined && { status }),
        ...(category !== undefined && { category }),
        ...(tone !== undefined && { tone }),
      },
      include: { targets: true },
    })
    return NextResponse.json({ post })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  try {
    await db.post.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
  }
}
