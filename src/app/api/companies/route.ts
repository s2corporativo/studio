import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const withDetails = searchParams.get('details') === 'true'

  const companies = await db.company.findMany({
    orderBy: { createdAt: 'desc' },
    include: withDetails
      ? {
          _count: { select: { posts: true, socialAccounts: true } },
          socialAccounts: true,
        }
      : { _count: { select: { posts: true, socialAccounts: true } } },
  })

  return NextResponse.json({ companies })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, niche, website, brandColor, city } = body
    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }
    const company = await db.company.create({
      data: {
        name,
        description: description || null,
        niche: niche || null,
        website: website || null,
        brandColor: brandColor || '#6366f1',
        city: city || null,
      },
    })
    return NextResponse.json({ company }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao criar empresa' }, { status: 500 })
  }
}
