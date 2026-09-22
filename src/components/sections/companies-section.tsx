'use client'

import { useMemo, useState } from 'react'
import { useFetch, apiPost, apiPut, apiDelete } from '@/lib/hooks'
import { useAppStore } from '@/lib/store'
import { cn, formatNumber, formatDate } from '@/lib/utils'
import {
  StatCard,
  StatCardSkeleton,
  SectionHeader,
  EmptyState,
  PlatformBadge,
} from '@/components/shared/ui'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Globe,
  FileText,
  Users,
  Eye,
  Loader2,
  Search,
  LayoutGrid,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import type { Company } from '@/lib/types'

interface CompanyFormState {
  name: string
  description: string
  niche: string
  website: string
  city: string
  brandColor: string
}

const EMPTY_FORM: CompanyFormState = {
  name: '',
  description: '',
  niche: '',
  website: '',
  city: '',
  brandColor: '#7C3AED',
}

const BRAND_PRESETS = [
  '#7C3AED', // violet
  '#C026D3', // fuchsia
  '#EC4899', // pink
  '#F59E0B', // amber
  '#10B981', // emerald
  '#0EA5E9', // sky
  '#EF4444', // red
  '#8B5CF6', // purple
]

export function CompaniesSection() {
  const { data, loading, refresh } = useFetch<{ companies: Company[] }>(
    '/api/companies?details=true',
    []
  )
  const setSelectedCompany = useAppStore((s) => s.setSelectedCompany)
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId)

  const companies = data?.companies ?? []

  // Aggregate stats
  const aggregates = useMemo(() => {
    let totalPosts = 0
    let totalAccounts = 0
    let totalFollowers = 0
    for (const c of companies) {
      totalPosts += c._count?.posts ?? 0
      totalAccounts += c._count?.socialAccounts ?? 0
      for (const acc of c.socialAccounts ?? []) {
        totalFollowers += acc.followers ?? 0
      }
    }
    return { totalCompanies: companies.length, totalPosts, totalAccounts, totalFollowers }
  }, [companies])

  // Search filter
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return companies
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.niche ?? '').toLowerCase().includes(q) ||
        (c.city ?? '').toLowerCase().includes(q)
    )
  }, [companies, query])

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Company | null>(null)
  const [form, setForm] = useState<CompanyFormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  // Delete confirmation
  const [toDelete, setToDelete] = useState<Company | null>(null)
  const [deleting, setDeleting] = useState(false)

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(c: Company) {
    setEditing(c)
    setForm({
      name: c.name ?? '',
      description: c.description ?? '',
      niche: c.niche ?? '',
      website: c.website ?? '',
      city: c.city ?? '',
      brandColor: c.brandColor ?? '#7C3AED',
    })
    setDialogOpen(true)
  }

  async function submitForm() {
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        niche: form.niche.trim() || null,
        website: form.website.trim() || null,
        city: form.city.trim() || null,
        brandColor: form.brandColor,
      }
      if (editing) {
        await apiPut(`/api/companies/${editing.id}`, payload)
        toast.success('Empresa atualizada', { description: form.name })
      } else {
        await apiPost('/api/companies', payload)
        toast.success('Empresa criada', { description: form.name })
      }
      setDialogOpen(false)
      setForm(EMPTY_FORM)
      setEditing(null)
      refresh()
    } catch (e: any) {
      toast.error('Erro ao salvar empresa', { description: e?.message })
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await apiDelete(`/api/companies/${toDelete.id}`)
      // If we were filtering by this company, clear it
      if (selectedCompanyId === toDelete.id) {
        setSelectedCompany(null)
      }
      toast.success('Empresa excluída', { description: toDelete.name })
      setToDelete(null)
      refresh()
    } catch (e: any) {
      toast.error('Erro ao excluir empresa', { description: e?.message })
    } finally {
      setDeleting(false)
    }
  }

  function handleCardClick(c: Company) {
    setSelectedCompany(c.id)
    toast.success('Filtro aplicado', {
      description: `As demais seções usarão ${c.name}.`,
    })
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Empresas"
        description="Gerencie suas empresas, marcas e perfis conectados"
        icon={Building2}
        action={
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Nova Empresa
          </Button>
        }
      />

      {/* Summary banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-fuchsia-600 text-white p-6"
      >
        <div className="absolute inset-0 bg-aurora opacity-30" />
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="flex items-center gap-2 text-white/70 text-xs mb-1">
              <Building2 className="w-3.5 h-3.5" />
              Empresas
            </div>
            <p className="text-3xl font-bold tabular-nums">{aggregates.totalCompanies}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-white/70 text-xs mb-1">
              <FileText className="w-3.5 h-3.5" />
              Total de posts
            </div>
            <p className="text-3xl font-bold tabular-nums">{formatNumber(aggregates.totalPosts)}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-white/70 text-xs mb-1">
              <Users className="w-3.5 h-3.5" />
              Contas conectadas
            </div>
            <p className="text-3xl font-bold tabular-nums">{aggregates.totalAccounts}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-white/70 text-xs mb-1">
              <Eye className="w-3.5 h-3.5" />
              Alcance total
            </div>
            <p className="text-3xl font-bold tabular-nums">{formatNumber(aggregates.totalFollowers)}</p>
          </div>
        </div>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Empresas cadastradas"
              value={aggregates.totalCompanies}
              icon={Building2}
              accent="#7C3AED"
              hint="Marcas em gestão"
              delay={0}
            />
            <StatCard
              label="Posts totais"
              value={formatNumber(aggregates.totalPosts)}
              icon={FileText}
              accent="#F59E0B"
              hint={`${aggregates.totalAccounts} contas conectadas`}
              delay={0.05}
            />
            <StatCard
              label="Alcance agregado"
              value={formatNumber(aggregates.totalFollowers)}
              icon={Eye}
              accent="#10B981"
              hint="Soma de seguidores"
              delay={0.1}
            />
          </>
        )}
      </div>

      {/* Search bar */}
      {!loading && companies.length > 0 && (
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, nicho ou cidade..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </Card>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-2/3 mb-4" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </Card>
          ))}
        </div>
      ) : companies.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={Building2}
            title="Nenhuma empresa cadastrada"
            description="Comece criando sua primeira empresa para gerenciar posts, redes sociais e métricas em um só lugar."
            action={
              <Button className="gap-2" onClick={openCreate}>
                <Plus className="w-4 h-4" />
                Criar primeira empresa
              </Button>
            }
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={Search}
            title="Nenhum resultado"
            description={`Nenhuma empresa encontrada para "${query}".`}
            action={
              <Button variant="outline" onClick={() => setQuery('')}>
                Limpar busca
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c, idx) => {
            const followers = (c.socialAccounts ?? []).reduce(
              (s, a) => s + (a.followers ?? 0),
              0
            )
            const isFiltered = selectedCompanyId === c.id
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                whileHover={{ y: -2 }}
              >
                <Card
                  className={cn(
                    'group relative overflow-hidden p-5 cursor-pointer transition-all hover:shadow-lg',
                    isFiltered ? 'ring-2 ring-primary' : 'hover:border-primary/40'
                  )}
                  onClick={() => handleCardClick(c)}
                >
                  {/* Brand color stripe */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5"
                    style={{ backgroundColor: c.brandColor ?? '#7C3AED' }}
                  />
                  {/* Tint background */}
                  <div
                    className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-[0.07] pointer-events-none"
                    style={{ backgroundColor: c.brandColor ?? '#7C3AED' }}
                  />

                  <div className="relative">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm"
                          style={{ backgroundColor: c.brandColor ?? '#7C3AED' }}
                        >
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{c.name}</h3>
                            {isFiltered && (
                              <Badge
                                variant="secondary"
                                className="text-[9px] px-1.5 py-0 h-4 bg-primary/15 text-primary"
                              >
                                Ativa
                              </Badge>
                            )}
                          </div>
                          {c.niche && (
                            <p className="text-xs text-muted-foreground truncate">{c.niche}</p>
                          )}
                        </div>
                      </div>
                      {/* Hover actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEdit(c)
                          }}
                          aria-label="Editar empresa"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            setToDelete(c)
                          }}
                          aria-label="Excluir empresa"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Description */}
                    {c.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {c.description}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground mb-3">
                      {c.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {c.city}
                        </span>
                      )}
                      {c.website && (
                        <a
                          href={c.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          <Globe className="w-3 h-3" />
                          Site
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {formatDate(c.createdAt)}
                      </span>
                    </div>

                    <Separator className="mb-3" />

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <p className="text-base font-bold tabular-nums">
                          {c._count?.posts ?? 0}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          Posts
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-base font-bold tabular-nums">
                          {c._count?.socialAccounts ?? 0}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          Contas
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-base font-bold tabular-nums">
                          {formatNumber(followers)}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          Seguidores
                        </p>
                      </div>
                    </div>

                    {/* Platform badges row */}
                    {c.socialAccounts && c.socialAccounts.length > 0 && (
                      <div className="flex items-center gap-1 mt-3 flex-wrap">
                        {c.socialAccounts.slice(0, 6).map((acc) => (
                          <PlatformBadge key={acc.id} platform={acc.platform} />
                        ))}
                        {c.socialAccounts.length > 6 && (
                          <span className="text-[10px] text-muted-foreground ml-1">
                            +{c.socialAccounts.length - 6}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Tip when filtering */}
      {!loading && selectedCompanyId && companies.length > 0 && (
        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => {
              setSelectedCompany(null)
              toast.info('Filtro removido')
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Remover filtro de empresa ativa
          </Button>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto scroll-fancy">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editing ? (
                <>
                  <Pencil className="w-4 h-4 text-primary" />
                  Editar empresa
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-primary" />
                  Nova empresa
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Atualize as informações da empresa abaixo.'
                : 'Preencha os dados para cadastrar uma nova empresa.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="c-name">
                Nome <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="c-name"
                placeholder="Ex: Café Aurora"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-desc">Descrição</Label>
              <Textarea
                id="c-desc"
                placeholder="Breve descrição sobre a empresa..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="c-niche">Nicho</Label>
                <Input
                  id="c-niche"
                  placeholder="Ex: Cafeteria"
                  value={form.niche}
                  onChange={(e) => setForm({ ...form, niche: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-city">Cidade</Label>
                <Input
                  id="c-city"
                  placeholder="Ex: São Paulo, SP"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-site">Website</Label>
              <Input
                id="c-site"
                placeholder="https://..."
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Cor da marca</Label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={form.brandColor}
                    onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
                    className="w-12 h-10 rounded-lg border border-input cursor-pointer bg-transparent p-1"
                    aria-label="Seletor de cor"
                  />
                </div>
                <Input
                  value={form.brandColor}
                  onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
                  className="flex-1 font-mono text-sm"
                  placeholder="#7C3AED"
                />
                <div
                  className="w-10 h-10 rounded-lg shrink-0 border border-input"
                  style={{ backgroundColor: form.brandColor }}
                />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {BRAND_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, brandColor: color })}
                    className={cn(
                      'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                      form.brandColor.toLowerCase() === color.toLowerCase()
                        ? 'border-foreground ring-2 ring-offset-1 ring-foreground/30'
                        : 'border-white/40'
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={`Selecionar cor ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={submitForm} disabled={submitting} className="gap-2">
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editing ? (
                <Pencil className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {editing ? 'Salvar alterações' : 'Criar empresa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-500" />
              Excluir empresa
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{toDelete?.name}</strong>? Esta ação não pode
              ser desfeita e removerá todos os posts, contas e métricas vinculadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
              disabled={deleting}
              className="bg-rose-600 hover:bg-rose-700 text-white gap-2"
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Excluir definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
