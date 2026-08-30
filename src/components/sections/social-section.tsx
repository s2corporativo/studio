'use client'

import { useMemo, useState } from 'react'
import { useFetch, apiPost, apiPatch, apiDelete } from '@/lib/hooks'
import { useAppStore } from '@/lib/store'
import { cn, formatNumber } from '@/lib/utils'
import { PlatformIcon } from '@/lib/platform-icons'
import { PLATFORMS, PLATFORM_META, type Platform, type SocialAccount, type Company } from '@/lib/types'
import {
  SectionHeader,
  EmptyState,
  StatCard,
  StatCardSkeleton,
} from '@/components/shared/ui'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Share2,
  Plus,
  Users,
  UserCheck,
  Link2,
  Trash2,
  BadgeCheck,
  Loader2,
  Globe,
  ExternalLink,
  Eye,
  Heart,
  MessageCircle,
  Info,
  Plug,
} from 'lucide-react'

interface ConnectForm {
  companyId: string
  handle: string
  displayName: string
  profileUrl: string
}

export function SocialSection() {
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId)
  const setSelectedCompany = useAppStore((s) => s.setSelectedCompany)

  const accountsUrl = selectedCompanyId
    ? `/api/social-accounts?companyId=${selectedCompanyId}`
    : '/api/social-accounts'
  const { data, loading, refresh } = useFetch<{ accounts: SocialAccount[] }>(accountsUrl, [
    selectedCompanyId,
  ])
  // Companies for the connect dialog selector (light fetch, no _count)
  const { data: companiesData } = useFetch<{ companies: Company[] }>('/api/companies', [])
  const companies = companiesData?.companies ?? []

  const accounts = data?.accounts ?? []

  // Group by platform
  const byPlatform = useMemo(() => {
    const map: Record<Platform, SocialAccount[]> = {
      instagram: [],
      facebook: [],
      linkedin: [],
      twitter: [],
      tiktok: [],
      youtube: [],
    }
    for (const a of accounts) {
      if (map[a.platform as Platform]) map[a.platform as Platform].push(a)
    }
    return map
  }, [accounts])

  // Aggregates
  const aggregates = useMemo(() => {
    let totalFollowers = 0
    let connected = 0
    const platforms = new Set<Platform>()
    for (const a of accounts) {
      totalFollowers += a.followers ?? 0
      if (a.connected) connected++
      platforms.add(a.platform as Platform)
    }
    return {
      totalAccounts: accounts.length,
      totalFollowers,
      connected,
      platforms: platforms.size,
    }
  }, [accounts])

  // Connect dialog
  const [connectOpen, setConnectOpen] = useState(false)
  const [connectPlatform, setConnectPlatform] = useState<Platform | null>(null)
  const [connectForm, setConnectForm] = useState<ConnectForm>({
    companyId: '',
    handle: '',
    displayName: '',
    profileUrl: '',
  })
  const [connecting, setConnecting] = useState(false)

  // Delete confirmation
  const [toDelete, setToDelete] = useState<SocialAccount | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Toggling set (to show spinner per row)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  function openConnect(p: Platform) {
    if (companies.length === 0) {
      toast.error('Nenhuma empresa cadastrada', {
        description: 'Crie uma empresa antes de conectar redes sociais.',
      })
      return
    }
    setConnectPlatform(p)
    setConnectForm({
      companyId: selectedCompanyId ?? companies[0]?.id ?? '',
      handle: '',
      displayName: '',
      profileUrl: '',
    })
    setConnectOpen(true)
  }

  async function submitConnect() {
    if (!connectPlatform) return
    if (!connectForm.companyId) {
      toast.error('Selecione uma empresa')
      return
    }
    if (!connectForm.handle.trim()) {
      toast.error('Informe o handle (usuário) da conta')
      return
    }
    setConnecting(true)
    try {
      await apiPost('/api/social-accounts', {
        companyId: connectForm.companyId,
        platform: connectPlatform,
        handle: connectForm.handle.trim(),
        displayName: connectForm.displayName.trim() || null,
        profileUrl: connectForm.profileUrl.trim() || null,
      })
      toast.success('Conta conectada', {
        description: `${PLATFORM_META[connectPlatform].label} · @${connectForm.handle}`,
      })
      setConnectOpen(false)
      setConnectForm({ companyId: '', handle: '', displayName: '', profileUrl: '' })
      setConnectPlatform(null)
      refresh()
    } catch (e: any) {
      toast.error('Erro ao conectar conta', { description: e?.message })
    } finally {
      setConnecting(false)
    }
  }

  async function toggleConnect(acc: SocialAccount) {
    setTogglingId(acc.id)
    try {
      const next = !acc.connected
      await apiPatch(`/api/social-accounts/${acc.id}`, { connected: next })
      toast.success(next ? 'Conta ativada' : 'Conta pausada', {
        description: `@${acc.handle}`,
      })
      refresh()
    } catch (e: any) {
      toast.error('Erro ao atualizar conta', { description: e?.message })
    } finally {
      setTogglingId(null)
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await apiDelete(`/api/social-accounts/${toDelete.id}`)
      toast.success('Conta removida', { description: `@${toDelete.handle}` })
      setToDelete(null)
      refresh()
    } catch (e: any) {
      toast.error('Erro ao remover conta', { description: e?.message })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Redes Sociais"
        description="Conecte e gerencie contas de redes sociais das suas empresas"
        icon={Share2}
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
              <Link2 className="w-3.5 h-3.5" />
              Contas conectadas
            </div>
            <p className="text-3xl font-bold tabular-nums">{aggregates.totalAccounts}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-white/70 text-xs mb-1">
              <UserCheck className="w-3.5 h-3.5" />
              Ativas
            </div>
            <p className="text-3xl font-bold tabular-nums">{aggregates.connected}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-white/70 text-xs mb-1">
              <Users className="w-3.5 h-3.5" />
              Total de seguidores
            </div>
            <p className="text-3xl font-bold tabular-nums">
              {formatNumber(aggregates.totalFollowers)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-white/70 text-xs mb-1">
              <Share2 className="w-3.5 h-3.5" />
              Plataformas
            </div>
            <p className="text-3xl font-bold tabular-nums">{aggregates.platforms}</p>
          </div>
        </div>
      </motion.div>

      {/* KPI row */}
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
              label="Contas totais"
              value={aggregates.totalAccounts}
              icon={Link2}
              accent="#7C3AED"
              hint={`${aggregates.connected} ativas`}
              delay={0}
            />
            <StatCard
              label="Seguidores somados"
              value={formatNumber(aggregates.totalFollowers)}
              icon={Users}
              accent="#EC4899"
              hint="Todas as plataformas"
              delay={0.05}
            />
            <StatCard
              label="Plataformas ativas"
              value={`${aggregates.platforms}/${PLATFORMS.length}`}
              icon={Share2}
              accent="#10B981"
              hint="Redes com contas"
              delay={0.1}
            />
          </>
        )}
      </div>

      {/* Company context banner */}
      {!selectedCompanyId && !loading && (
        <Card className="p-4 border-dashed bg-muted/30">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Mostrando contas de todas as empresas</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Para conectar uma nova conta, escolha a empresa no formulário. Você pode filtrar por
                uma empresa específica clicando nela na aba Empresas.
              </p>
            </div>
          </div>
        </Card>
      )}
      {selectedCompanyId && !loading && (
        <Card className="p-4 border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Plug className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Filtrando contas por empresa</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Novas contas serão vinculadas a esta empresa automaticamente.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                setSelectedCompany(null)
                toast.info('Filtro de empresa removido')
              }}
            >
              Ver todas
            </Button>
          </div>
        </Card>
      )}

      {/* Platform grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORMS.map((p) => (
            <Card key={p} className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-11 h-11 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
              <Separator className="mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={Share2}
            title="Nenhuma conta conectada"
            description="Conecte contas das redes sociais abaixo para começar a agendar posts e acompanhar métricas."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORMS.map((p, idx) => {
            const meta = PLATFORM_META[p]
            const list = byPlatform[p]
            const totalFollowers = list.reduce((s, a) => s + (a.followers ?? 0), 0)
            const connectedCount = list.filter((a) => a.connected).length
            return (
              <motion.div
                key={p}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
              >
                <Card className="overflow-hidden h-full flex flex-col">
                  {/* Platform header */}
                  <div
                    className="p-4 relative"
                    style={{
                      background: `linear-gradient(135deg, color-mix(in oklch, ${meta.color} 14%, transparent), color-mix(in oklch, ${meta.color} 4%, transparent))`,
                    }}
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1.5"
                      style={{ backgroundColor: meta.color }}
                    />
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                          style={{ backgroundColor: meta.color }}
                        >
                          <PlatformIcon platform={p} className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold leading-tight">{meta.label}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {list.length === 0
                              ? 'Nenhuma conta'
                              : `${connectedCount} de ${list.length} ativa${list.length > 1 ? 's' : ''}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 shrink-0 bg-background/70"
                        onClick={() => openConnect(p)}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Conectar
                      </Button>
                    </div>
                    {list.length > 0 && (
                      <div className="mt-3 flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span className="font-semibold text-foreground tabular-nums">
                            {formatNumber(totalFollowers)}
                          </span>
                          seguidores
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Eye className="w-3 h-3" />
                          <span className="font-semibold text-foreground tabular-nums">
                            {list.length}
                          </span>
                          contas
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Accounts list */}
                  <div className="flex-1 p-4 pt-3">
                    {list.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center py-6">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                          style={{
                            backgroundColor: `color-mix(in oklch, ${meta.color} 10%, transparent)`,
                            color: meta.color,
                          }}
                        >
                          <PlatformIcon platform={p} className="w-5 h-5" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Nenhuma conta conectada
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 h-7 text-xs"
                          onClick={() => openConnect(p)}
                        >
                          <Plus className="w-3 h-3" />
                          Conectar agora
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto scroll-fancy pr-1">
                        {list.map((acc) => (
                          <AccountRow
                            key={acc.id}
                            acc={acc}
                            platformColor={meta.color}
                            toggling={togglingId === acc.id}
                            onToggle={() => toggleConnect(acc)}
                            onDelete={() => setToDelete(acc)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Connect Dialog */}
      <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {connectPlatform && (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: PLATFORM_META[connectPlatform].color }}
                >
                  <PlatformIcon platform={connectPlatform} className="w-4 h-4" />
                </div>
              )}
              Conectar conta
              {connectPlatform && (
                <span className="text-muted-foreground font-normal">
                  · {PLATFORM_META[connectPlatform].label}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Vincule uma conta de rede social a uma das suas empresas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="s-company">Empresa</Label>
              <Select
                value={connectForm.companyId}
                onValueChange={(v) => setConnectForm({ ...connectForm, companyId: v })}
              >
                <SelectTrigger id="s-company">
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: c.brandColor ?? '#7C3AED' }}
                        />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="s-handle">
                Handle / usuário <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="s-handle"
                placeholder="@minhaempresa"
                value={connectForm.handle}
                onChange={(e) => setConnectForm({ ...connectForm, handle: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground">
                Identificador único da conta na plataforma.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="s-display">Nome de exibição</Label>
              <Input
                id="s-display"
                placeholder="Minha Empresa Oficial"
                value={connectForm.displayName}
                onChange={(e) => setConnectForm({ ...connectForm, displayName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="s-url">URL do perfil</Label>
              <Input
                id="s-url"
                placeholder="https://instagram.com/minhaempresa"
                value={connectForm.profileUrl}
                onChange={(e) => setConnectForm({ ...connectForm, profileUrl: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground">
                Opcional. Será gerado automaticamente se não informado.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={submitConnect} disabled={connecting} className="gap-2">
              {connecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              Conectar
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
              Remover conta
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>@{toDelete?.handle}</strong>? Esta ação não
              pode ser desfeita. Métricas históricas podem ser afetadas.
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
              Remover conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function AccountRow({
  acc,
  platformColor,
  toggling,
  onToggle,
  onDelete,
}: {
  acc: SocialAccount
  platformColor: string
  toggling: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group rounded-xl border border-border p-3 transition-all hover:border-primary/40 hover:bg-accent/30',
        !acc.connected && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ backgroundColor: platformColor }}
        >
          {(acc.displayName || acc.handle).charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-medium text-sm truncate">{acc.displayName || acc.handle}</span>
            {acc.verified && (
              <BadgeCheck
                className="w-3.5 h-3.5 text-sky-500 shrink-0"
                aria-label="Conta verificada"
              />
            )}
            <Badge
              variant={acc.connected ? 'default' : 'secondary'}
              className="ml-auto text-[9px] px-1.5 py-0 h-4 shrink-0"
            >
              {acc.connected ? 'Ativa' : 'Pausada'}
            </Badge>
          </div>
          <a
            href={acc.profileUrl ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-0.5 truncate w-fit max-w-full"
            onClick={(e) => !acc.profileUrl && e.preventDefault()}
          >
            <span className="truncate">@{acc.handle}</span>
            {acc.profileUrl && <ExternalLink className="w-2.5 h-2.5 shrink-0" />}
          </a>

          {/* Stats */}
          <div className="flex items-center gap-3 mt-2 text-[11px]">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-3 h-3" />
              <span className="font-semibold text-foreground tabular-nums">
                {formatNumber(acc.followers)}
              </span>
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <UserCheck className="w-3 h-3" />
              <span className="font-semibold text-foreground tabular-nums">
                {formatNumber(acc.following)}
              </span>
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <MessageCircle className="w-3 h-3" />
              <span className="font-semibold text-foreground tabular-nums">
                {formatNumber(acc.posts)}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-border/60">
        <div className="flex items-center gap-2">
          <Switch
            checked={acc.connected}
            onCheckedChange={onToggle}
            disabled={toggling}
            aria-label={acc.connected ? 'Pausar conta' : 'Ativar conta'}
          />
          <span className="text-[11px] text-muted-foreground">
            {toggling ? 'Atualizando...' : acc.connected ? 'Conectada' : 'Desconectada'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setConfirmOpen(true)}
          aria-label="Remover conta"
          title="Remover"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-500" />
              Remover conta
            </AlertDialogTitle>
            <AlertDialogDescription>
              Remover <strong>@{acc.handle}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                onDelete()
                setConfirmOpen(false)
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white gap-2"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
