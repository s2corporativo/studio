import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function escapeICal(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function formatICalDate(date: Date, end: boolean = false): string {
  const d = new Date(date)
  if (end) d.setMinutes(d.getMinutes() + 30) // 30-min events
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  const format = searchParams.get('format') || 'ical'

  const where: any = {
    scheduledAt: { not: null },
    status: { in: ['scheduled', 'published'] },
  }
  if (companyId) where.companyId = companyId

  const posts = await db.post.findMany({
    where,
    orderBy: { scheduledAt: 'asc' },
    include: {
      targets: true,
      company: { select: { name: true, brandColor: true } },
    },
    take: 500,
  })

  if (format === 'csv') {
    const rows = [
      ['Titulo', 'Empresa', 'Conteudo', 'Data', 'Status', 'Plataformas', 'Categoria'].join(','),
    ]
    for (const p of posts) {
      const platforms = (p.targets || []).map((t) => t.platform).join(' | ')
      const content = (p.content || '').replace(/"/g, '""').replace(/\n/g, ' ')
      const row = [
        `"${(p.title || '').replace(/"/g, '""')}"`,
        `"${p.company?.name || ''}"`,
        `"${content}"`,
        p.scheduledAt ? new Date(p.scheduledAt).toISOString() : '',
        p.status,
        `"${platforms}"`,
        p.category || '',
      ]
      rows.push(row.join(','))
    }
    const csv = rows.join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="socialhub-calendario-${Date.now()}.csv"`,
      },
    })
  }

  // iCal format
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SocialHub//Content Calendar//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:SocialHub - Calendario de Conteudo`,
    'X-WR-TIMEZONE:America/Sao_Paulo',
  ]

  for (const p of posts) {
    if (!p.scheduledAt) continue
    const start = formatICalDate(p.scheduledAt)
    const end = formatICalDate(p.scheduledAt, true)
    const platforms = (p.targets || []).map((t) => t.platform).join(', ')
    const desc = `${p.content || ''}\n\nPlataformas: ${platforms}\nCategoria: ${p.category || 'N/A'}`
    lines.push(
      'BEGIN:VEVENT',
      `UID:${p.id}@socialhub`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escapeICal(p.title || 'Post')}`,
      `DESCRIPTION:${escapeICal(desc)}`,
      `CATEGORIES:${escapeICal(p.company?.name || '')},${escapeICal(p.category || '')}`,
      `STATUS:${p.status === 'published' ? 'CONFIRMED' : 'TENTATIVE'}`,
      'END:VEVENT'
    )
  }
  lines.push('END:VCALENDAR')
  const ical = lines.join('\r\n')

  return new NextResponse(ical, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="socialhub-calendario-${Date.now()}.ics"`,
    },
  })
}
