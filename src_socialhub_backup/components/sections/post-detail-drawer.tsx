'use client'

import { useRef, useState } from 'react'
import { apiPost, apiDelete } from '@/lib/hooks'
import { cn, formatDateTime, formatNumber } from '@/lib/utils'
import { PlatformIcon } from '@/lib/platform-icons'
import {
  PLATFORM_META,
  POST_CATEGORIES,
  TONES,
  type Platform,
} from '@/lib/types'
import { StatusBadge } from '@/components/shared/ui'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
  Pencil,
  Copy,
  Trash2,
  Loader2,
  Clock,
  Calendar,
  Hash,
  Building2,
  Palette,
  Tag,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  BarChart3,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react'

function safeParseArray<T>(s: string | null | undefined, fallback: T[] = []): T[] {
  if (!s) return fallback
  try {
    const parsed = JSON.parse(s)
    return Array.isArray(parsed) ? (parsed as T[]) : fallback
  } catch {
    return fallback
  }
}

interface MetricProps {
  icon: typeof Heart
  value: number
  label: string
  color: string
}

function Metric({ icon: Icon, value, label, color }: MetricProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <Icon className={cn('w-3.5 h-3.5', color)} />
      <span className="text-xs font-semibold tabular-nums">{formatNumber(value)}</span>
      <span className="text-[9px] text-muted-foreground leading-tight">{label}</span>
    </div>
  )
}

export function PostDetailDrawer({
  post,
  open,
  onOpenChange,
  onEdit,
  onRefresh,
}: {
  post: any | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onEdit: () => void
  onRefresh: () => void
}) {
  const [duplicating, setDuplicating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Keep last non-null post so the drawer body can render with valid data
  // during exit animation (when `post` becomes null after onOpenChange(false)).
  const lastPostRef = useRef<any | null>(null)
  if (post) lastPostRef.current = post
  const effectivePost = post || lastPostRef.current

  if (!effectivePost) {
    return (
      <Sheet open={false} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="sm:max-w-xl w-full" />
      </Sheet>
    )
  }

  const mediaUrls = safeParseArray<string>(effectivePost.mediaUrls)
  const hashtags = safeParseArray<string>(effectivePost.hashtags)
  const targets: any[] = effectivePost.targets || []
  const category = POST_CATEGORIES.find((c) => c.value === effectivePost.category)
  const toneLabel = effectivePost.tone
    ? TONES.find((t) => t === effectivePost.tone)
    : null

  const copyText = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${label} copiado!`))
      .catch(() => toast.error('Não foi possível copiar'))
  }

  const handleDuplicate = async () => {
    setDuplicating(true)
    try {
      await apiPost(`/api/posts/${effectivePost.id}`, { action: 'duplicate' })
      toast.success('Post duplicado com sucesso!')
      onRefresh()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao duplicar post')
    } finally {
      setDuplicating(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await apiDelete(`/api/posts/${effectivePost.id}`)
      toast.success('Post excluído')
      onRefresh()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao excluir post')
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-xl w-full p-0 flex flex-col gap-0"
      >
        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b gap-2">
          <SheetTitle className="text-xl font-bold leading-tight pr-8">
            {effectivePost.title}
          </SheetTitle>
          <SheetDescription asChild>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={effectivePost.status} />
              {category && (
                <Badge variant="secondary" className="text-[10px]">
                  {category.label}
                </Badge>
              )}
              {effectivePost.tone && (
                <Badge variant="outline" className="text-[10px] capitalize">
                  {effectivePost.tone}
                </Badge>
              )}
            </div>
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto scroll-fancy p-6 space-y-6">
          {/* Media gallery */}
          {mediaUrls.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                Mídia ({mediaUrls.length})
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {mediaUrls.slice(0, 4).map((url, i) => (
                  <a
                    key={`${url}-${i}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block group overflow-hidden rounded-lg border border-border"
                  >
                    <img
                      src={url}
                      alt={`Mídia ${i + 1}`}
                      className="w-full aspect-square object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <ExternalLink className="w-4 h-4 text-white" />
                    </div>
                    {i === 3 && mediaUrls.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          +{mediaUrls.length - 4}
                        </span>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Content section */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Conteúdo
              </h3>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 h-7 text-xs"
                      onClick={() => copyText(effectivePost.content, 'Conteúdo')}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copiar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copiar conteúdo do post</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Card className="p-4 bg-muted/30 border-dashed">
              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                {effectivePost.content}
              </p>
            </Card>
          </section>

          {/* Hashtags */}
          {hashtags.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" />
                  Hashtags ({hashtags.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 h-7 text-xs"
                  onClick={() =>
                    copyText(
                      hashtags.map((h) => `#${h}`).join(' '),
                      'Hashtags'
                    )
                  }
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar todas
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {hashtags.map((h, i) => (
                  <Badge
                    key={`${h}-${i}`}
                    variant="secondary"
                    className="text-xs gap-1"
                  >
                    <Hash className="w-2.5 h-2.5 text-muted-foreground" />
                    {h}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Platforms breakdown */}
          {targets.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Plataformas ({targets.length})
              </h3>
              <div className="space-y-3">
                {targets.map((t, i) => {
                  const meta = PLATFORM_META[t.platform as Platform]
                  return (
                    <motion.div
                      key={t.id || `${t.platform}-${i}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.2) }}
                    >
                      <Card className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-7 h-7 rounded-md flex items-center justify-center text-white shrink-0"
                              style={{
                                backgroundColor: meta?.color || '#888',
                              }}
                            >
                              <PlatformIcon
                                platform={t.platform}
                                className="w-4 h-4"
                              />
                            </span>
                            <span className="font-medium text-sm">
                              {meta?.label || t.platform}
                            </span>
                          </div>
                          <StatusBadge status={t.status || 'pending'} />
                        </div>

                        <div className="relative">
                          <p className="text-xs text-muted-foreground line-clamp-3 pr-8 leading-relaxed">
                            {t.content || effectivePost.content}
                          </p>
                          {t.content && (
                            <button
                              onClick={() =>
                                copyText(t.content, `Conteúdo ${meta?.label || t.platform}`)
                              }
                              className="absolute top-0 right-0 p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                              aria-label="Copiar conteúdo da plataforma"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {t.status === 'published' ? (
                          <div className="grid grid-cols-5 gap-2 mt-3 pt-3 border-t border-dashed">
                            <Metric
                              icon={Heart}
                              value={t.likes || 0}
                              label="Curtidas"
                              color="text-rose-500"
                            />
                            <Metric
                              icon={MessageCircle}
                              value={t.comments || 0}
                              label="Coment."
                              color="text-sky-500"
                            />
                            <Metric
                              icon={Share2}
                              value={t.shares || 0}
                              label="Compart."
                              color="text-emerald-500"
                            />
                            <Metric
                              icon={Eye}
                              value={t.reach || 0}
                              label="Alcance"
                              color="text-amber-500"
                            />
                            <Metric
                              icon={BarChart3}
                              value={t.impressions || 0}
                              label="Impr."
                              color="text-violet-500"
                            />
                          </div>
                        ) : (
                          <div className="mt-3 pt-3 border-t border-dashed flex items-center justify-center">
                            <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Pendente de publicação
                            </span>
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Meta footer */}
          <section className="pt-2">
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      effectivePost.company?.brandColor || '#7C3AED',
                  }}
                />
                <span className="font-medium truncate">
                  {effectivePost.company?.name || 'Sem empresa'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Agendado:</span>
                <span className="font-medium">
                  {formatDateTime(effectivePost.scheduledAt)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Criado em:</span>
                <span className="font-medium">
                  {formatDateTime(effectivePost.createdAt)}
                </span>
              </div>
              {effectivePost.tone && (
                <div className="flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Tom:</span>
                  <span className="font-medium capitalize">
                    {toneLabel || effectivePost.tone}
                  </span>
                </div>
              )}
              {category && (
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Categoria:</span>
                  <span className="font-medium">{category.label}</span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sticky action bar */}
        <div className="border-t p-3 flex items-center gap-2 bg-background">
          <Button
            variant="outline"
            className="gap-1.5 flex-1"
            onClick={onEdit}
          >
            <Pencil className="w-4 h-4" />
            Editar
          </Button>
          <Button
            variant="outline"
            className="gap-1.5 flex-1"
            onClick={handleDuplicate}
            disabled={duplicating || deleting}
          >
            {duplicating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            Duplicar
          </Button>
          <Button
            variant="destructive"
            className="gap-1.5 flex-1"
            onClick={() => setConfirmDelete(true)}
            disabled={duplicating || deleting}
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </Button>
        </div>
      </SheetContent>

      {/* Delete confirmation */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-500" />
              Excluir post
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{' '}
              <strong className="text-foreground">{effectivePost.title}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={deleting}
              className="bg-rose-600 hover:bg-rose-700 text-white gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  )
}
