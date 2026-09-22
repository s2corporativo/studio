'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { useFetch, apiPost, apiDelete, apiPatch } from '@/lib/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { SectionHeader, EmptyState, PlatformBadge } from '@/components/shared/ui'
import { cn, formatNumber } from '@/lib/utils'
import { PLATFORM_INTEGRATIONS, CAPABILITY_LABELS, type PlatformIntegration } from '@/lib/integrations'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plug,
  Check,
  X,
  ExternalLink,
  Shield,
  Zap,
  Clock,
  Settings2,
  Key,
  Globe,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Star,
  Lock,
} from 'lucide-react'

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  connected: { label: 'Conectado', color: '#10B981', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', icon: CheckCircle2 },
  pending: { label: 'Pendente', color: '#F59E0B', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', icon: Clock },
  error: { label: 'Erro', color: '#EF4444', bg: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300', icon: AlertCircle },
  disconnected: { label: 'Desconectado', color: '#6B7280', bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: X },
}

export function IntegrationsSection() {
  const companyId = useAppStore((s) => s.selectedCompanyId)
  const [connectDialog, setConnectDialog] = useState<PlatformIntegration | null>(null)
  const [disconnectId, setDisconnectId] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')

  const url = companyId ? `/api/integrations?companyId=${companyId}` : null
  const { data, loading, refresh } = useFetch<any>(url, [companyId])
  const integrations = data?.integrations || []

  const connectedCount = integrations.filter((i: any) => i.status === 'connected').length
  const totalCapabilities = integrations
    .filter((i: any) => i.status === 'connected')
    .reduce((acc: number, i: any) => {
      const plat = PLATFORM_INTEGRATIONS.find((p) => p.platform === i.platform)
      if (!plat) return acc
      return acc + Object.values(plat.capabilities).filter(Boolean).length
    }, 0)

  async function handleConnect(integration: PlatformIntegration) {
    if (!companyId) {
      toast.error('Selecione uma empresa no topo')
      return
    }
    setConnecting(true)
    try {
      await apiPost('/api/integrations', {
        companyId,
        platform: integration.platform,
        status: 'connected',
        accountName: `${integration.label} Account`,
        apiKey: apiKey || null,
        apiSecret: apiSecret || null,
        autoPublish: true,
        syncFrequency: 'hourly',
        features: Object.entries(integration.capabilities)
          .filter(([_, v]) => v)
          .map(([k]) => k),
      })
      toast.success(`${integration.label} conectado com sucesso!`)
      setConnectDialog(null)
      setApiKey('')
      setApiSecret('')
      refresh()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao conectar')
    } finally {
      setConnecting(false)
    }
  }

  async function handleSync(id: string) {
    try {
      await apiPatch(`/api/integrations/${id}`, { lastSync: new Date().toISOString(), status: 'connected' })
      toast.success('Sincronização concluída')
      refresh()
    } catch {
      toast.error('Erro na sincronização')
    }
  }

  async function handleDisconnect(id: string) {
    try {
      await apiDelete(`/api/integrations/${id}`)
      toast.success('Integração desconectada')
      refresh()
    } catch {
      toast.error('Erro ao desconectar')
    } finally {
      setDisconnectId(null)
    }
  }

  if (!companyId) {
    return (
      <div className="space-y-6">
        <SectionHeader
          icon={Plug}
          title="Integrações de API"
          description="Conecte redes sociais e ferramentas externas"
        />
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Plug}
              title="Selecione uma empresa"
              description="Escolha uma empresa no topo da tela para gerenciar integrações de API."
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Plug}
        title="Integrações de API"
        description="Conecte suas redes sociais e ferramentas para publicação automática"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums">{connectedCount}</p>
            <p className="text-xs text-muted-foreground">Conectadas</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Plug className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums">{PLATFORM_INTEGRATIONS.length}</p>
            <p className="text-xs text-muted-foreground">Disponíveis</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-fuchsia-500/10 text-fuchsia-500 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums">{totalCapabilities}</p>
            <p className="text-xs text-muted-foreground">Funcionalidades</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums">{connectedCount > 0 ? 'Ativo' : '—'}</p>
            <p className="text-xs text-muted-foreground">Auto-publish</p>
          </div>
        </Card>
      </div>

      {/* Info banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold mb-1">Como funciona a integração real?</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cada rede social possui uma API oficial que permite publicação automática, leitura de
                métricas e monitoramento de menções. Para conectar, você precisa criar um App no
                portal de desenvolvedores de cada plataforma, obter credenciais OAuth e aprovar o app.
                Nós guiamos você por todo o processo. As credenciais são armazenadas com criptografia.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {PLATFORM_INTEGRATIONS.map((plat, i) => {
              const integration = integrations.find((it: any) => it.platform === plat.platform)
              const status = integration?.status || 'disconnected'
              const sm = STATUS_META[status] || STATUS_META.disconnected
              const StatusIcon = sm.icon
              return (
                <motion.div
                  key={plat.platform}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                >
                  <Card className="group h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-5 space-y-3">
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${plat.color}20`, color: plat.color }}
                        >
                          <PlatformBadge platform={plat.platform} size="md" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{plat.label}</h3>
                            {plat.status === 'beta' && (
                              <Badge variant="secondary" className="text-[9px] gap-0.5">
                                <Star className="w-2.5 h-2.5" />
                                Beta
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{plat.apiName}</p>
                        </div>
                        <Badge className={cn('text-[10px] gap-0.5 shrink-0', sm.bg)}>
                          <StatusIcon className="w-2.5 h-2.5" />
                          {sm.label}
                        </Badge>
                      </div>

                      {/* Capabilities */}
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(plat.capabilities)
                          .filter(([_, v]) => v)
                          .map(([cap]) => (
                            <span
                              key={cap}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                            >
                              {CAPABILITY_LABELS[cap] || cap}
                            </span>
                          ))}
                      </div>

                      {/* Pricing */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Preço:</span>
                        <span className="font-medium">{plat.pricing}</span>
                      </div>

                      {/* Last sync */}
                      {integration?.lastSync && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          Última sync: {new Date(integration.lastSync).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        {status === 'connected' ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 h-8 text-xs"
                              onClick={() => handleSync(integration.id)}
                            >
                              <RefreshCw className="w-3 h-3" />
                              Sincronizar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs gap-1.5 hover:text-rose-500"
                              onClick={() => setDisconnectId(integration.id)}
                            >
                              <X className="w-3 h-3" />
                              Desconectar
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            className="gap-1.5 h-8 text-xs bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90"
                            onClick={() => setConnectDialog(plat)}
                          >
                            <Plug className="w-3 h-3" />
                            Conectar
                          </Button>
                        )}
                        <a
                          href={plat.apiDocsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Docs
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Setup guide */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="w-4 h-4 text-primary" />
            Guia de configuração detalhado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {PLATFORM_INTEGRATIONS.map((plat) => (
              <AccordionItem key={plat.platform} value={plat.platform}>
                <AccordionTrigger className="text-sm hover:no-underline">
                  <div className="flex items-center gap-2">
                    <PlatformBadge platform={plat.platform} />
                    <span className="font-medium">{plat.label}</span>
                    <span className="text-xs text-muted-foreground">— {plat.apiName}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  {/* Requirements */}
                  <div>
                    <p className="text-xs font-semibold mb-1.5 flex items-center gap-1">
                      <Key className="w-3 h-3" />
                      Requisitos
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {Object.entries(plat.requirements).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-2 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span className="text-muted-foreground">{typeof val === 'string' ? val : key}:</span>
                          <span className="font-medium capitalize">{typeof val === 'string' ? 'Necessário' : val ? 'Sim' : 'Não'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Scopes */}
                  <div>
                    <p className="text-xs font-semibold mb-1.5 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Permissões (Scopes)
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {plat.scopes.map((scope) => (
                        <code key={scope} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {scope}
                        </code>
                      ))}
                    </div>
                  </div>

                  {/* Steps */}
                  <div>
                    <p className="text-xs font-semibold mb-1.5">Passo a passo</p>
                    <ol className="space-y-1">
                      {plat.setupSteps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs">
                          <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[9px] font-bold mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-muted-foreground">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Rate limits + premium */}
                  <div className="flex items-center gap-4 text-xs pt-1 border-t">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Zap className="w-3 h-3" />
                      {plat.rateLimits}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {plat.premium.map((p) => (
                      <Badge key={p} variant="outline" className="text-[9px] gap-0.5">
                        <Star className="w-2.5 h-2.5 text-amber-500" />
                        {p}
                      </Badge>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Connect dialog */}
      <Dialog open={!!connectDialog} onOpenChange={(v) => !v && setConnectDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {connectDialog && (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${connectDialog.color}20`, color: connectDialog.color }}
                >
                  <PlatformBadge platform={connectDialog.platform} size="md" />
                </div>
              )}
              Conectar {connectDialog?.label}
            </DialogTitle>
            <DialogDescription>
              Configure a integração com {connectDialog?.apiName}. Você precisará das credenciais obtidas no portal de desenvolvedores.
            </DialogDescription>
          </DialogHeader>
          {connectDialog && (
            <div className="space-y-3 py-2">
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 text-xs text-amber-700 dark:text-amber-300">
                <p className="font-semibold mb-1">⚠️ Antes de conectar:</p>
                <p>1. Crie um App no portal de desenvolvedores do {connectDialog.label}</p>
                <p>2. Obtenha as credenciais (API Key e Secret)</p>
                <p>3. Configure OAuth com os scopes necessários</p>
                <a
                  href={connectDialog.apiDocsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline mt-1"
                >
                  Ver documentação oficial
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">API Key / Client ID</label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Cole sua API Key aqui"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">API Secret / Client Secret</label>
                <input
                  type="password"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="Cole seu Secret aqui"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                <Shield className="w-3 h-3 inline mr-1" />
                As credenciais são armazenadas com criptografia e nunca exibidas novamente.
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialog(null)}>
              Cancelar
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90"
              onClick={() => connectDialog && handleConnect(connectDialog)}
              disabled={connecting}
            >
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Plug className="w-4 h-4" />
                  Conectar agora
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect confirmation */}
      <AlertDialog open={!!disconnectId} onOpenChange={(v) => !v && setDisconnectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar esta integração?</AlertDialogTitle>
            <AlertDialogDescription>
              A publicação automática e sincronização de métricas para esta plataforma serão interrompidas.
              Você pode reconectar a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 hover:bg-rose-600 text-white"
              onClick={() => disconnectId && handleDisconnect(disconnectId)}
            >
              Desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
