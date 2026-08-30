import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  const where: any = {}
  if (companyId) where.companyId = companyId

  const templates = await db.contentTemplate.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ templates })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyId, name, structure, tone, category } = body
    if (!name || !structure) {
      return NextResponse.json({ error: 'Nome e estrutura obrigatórios' }, { status: 400 })
    }
    const template = await db.contentTemplate.create({
      data: {
        companyId: companyId || null,
        name,
        structure,
        tone: tone || null,
        category: category || null,
      },
    })
    return NextResponse.json({ template }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar template' }, { status: 500 })
  }
}
