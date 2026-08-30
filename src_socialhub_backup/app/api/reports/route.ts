import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  if (!companyId) {
    return NextResponse.json({ reports: [] })
  }

  const reports = await db.report.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ reports })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyId, type, title, period, summary, data, insights, format } = body
    if (!companyId || !type || !title) {
      return NextResponse.json({ error: 'companyId, type e title são obrigatórios' }, { status: 400 })
    }

    const report = await db.report.create({
      data: {
        companyId,
        type,
        title,
        period: period || new Date().toISOString().slice(0, 7),
        summary: summary || null,
        data: data ? JSON.stringify(data) : null,
        insights: insights ? JSON.stringify(insights) : null,
        format: format || 'pdf',
        status: 'ready',
        url: `/api/reports/${''}/download`, // será gerado
      },
    })

    return NextResponse.json({ report }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao criar relatório' }, { status: 500 })
  }
}
