import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  const source = searchParams.get('source') // ai, upload, stock

  const where: any = {}
  if (companyId) where.companyId = companyId
  if (source) where.source = source

  const assets = await db.mediaAsset.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  return NextResponse.json({ assets })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyId, title, description, url, type, source, prompt, tags } = body
    if (!title || !url) {
      return NextResponse.json({ error: 'Título e URL obrigatórios' }, { status: 400 })
    }
    const asset = await db.mediaAsset.create({
      data: {
        companyId: companyId || null,
        title,
        description: description || null,
        url,
        type: type || 'image',
        source: source || 'upload',
        prompt: prompt || null,
        tags: JSON.stringify(tags || []),
      },
    })
    return NextResponse.json({ asset }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao criar mídia' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
  try {
    const asset = await db.mediaAsset.findUnique({ where: { id } })
    if (asset?.url?.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', asset.url)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }
    await db.mediaAsset.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
  }
}
