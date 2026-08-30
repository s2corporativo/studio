import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  const where: any = {}
  if (companyId) where.companyId = companyId

  const keywords = await db.seoKeyword.findMany({
    where,
    orderBy: { volume: 'desc' },
    include: { company: { select: { name: true } } },
  })
  return NextResponse.json({ keywords })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
  try {
    await db.seoKeyword.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}
