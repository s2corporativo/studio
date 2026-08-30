'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { useFetch, apiPost, apiDelete } from '@/lib/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { SectionHeader, EmptyState } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  ImagePlus,
  Wand2,
  Download,
  Trash2,
  Copy,
  Check,
  ImageIcon,
  Loader2,
  LayoutGrid,
  Rows3,
  Link2,
  Eye,
  Lightbulb,
} from 'lucide-react'

const ORIENTATIONS = [
  { value: 'square', label: 'Quadrado', ratio: '1:1', size: '1024×1024', use: 'Feed' },
  { value: 'portrait', label: 'Retrato', ratio: '4:3', size: '768×1344', use: 'Stories/Reels' },
  { value: 'landscape', label: 'Paisagem', ratio: '3:4', size: '1344×768', use: 'Capa/Banner' },
  { value: 'story', label: 'Story', ratio: '9:16', size: '720×1440', use: 'Story vertical' },
  { value: 'wide', label: 'Wide', ratio: '2:1', size: '1440×720', use: 'Capa larga' },
] as const

const STYLE_PRESETS = [
  'Fotografia profissional, iluminação estúdio, alta qualidade',
  'Ilustração vetorial moderna, cores vibrantes, flat design',
  'Foto lifestyle autêntica, luz natural, ambiente real',
  'Design minimalista, muito espaço negativo, elegante',
  'Estilo cinematográfico, dramatic lighting, cores quentes',
  'Aquarela artística, textura manual, suave',
]

export function MediaSection() {
  const companyId = useAppStore((s) => s.selectedCompanyId)
  const setSection = useAppStore((s) => s.setSection)
  const [prompt, setPrompt] = useState('')
  const [orientation, setOrientation] = useState<string>('square')
  const [title, setTitle] = useState('')
  const [generating, setGenerating] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [previewAsset, setPreviewAsset] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const url = companyId ? `/api/media?companyId=${companyId}` : '/api/media'
  const { data, loading, refresh } = useFetch<any>(url, [companyId])

  const assets = data?.assets || []

  async function handleGenerate() {
    if (!prompt.trim()) {
      toast.error('Descreva a imagem que deseja gerar')
      return
    }
    if (!companyId) {
      toast.error('Selecione uma empresa no topo para associar a imagem')
      return
    }
    setGenerating(true)
    setLastResult(null)
    try {
      const res = await apiPost<any>('/api/media/generate', {
        prompt: prompt.trim(),
        orientation,
        companyId,
        title: title.trim() || prompt.slice(0, 60),
        save: true,
      })
      setLastResult(res)
      toast.success('Imagem gerada com IA! 🎨')
      refresh()
      setTitle('')
    } catch (e: any) {
      toast.error(e.message || 'Falha ao gerar imagem')
    } finally {
      setGenerating(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiDelete(`/api/media?id=${id}`)
      toast.success('Mídia excluída')
      refresh()
    } catch {
      toast.error('Erro ao excluir')
    } finally {
      setDeleteId(null)
    }
  }

  async function copyUrl(u: string) {
    try {
      await navigator.clipboard.writeText(window.location.origin + u)
      setCopiedUrl(u)
      toast.success('URL copiada')
      setTimeout(() => setCopiedUrl(null), 1500)
    } catch {
      toast.error('Falha ao copiar')
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Mídia & Imagens"
        description="Gere imagens com IA para seus posts e mantenha uma biblioteca de mídia"
        icon={ImageIcon}
        action={
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              className="gap-1.5 h-8"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Grade
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              className="gap-1.5 h-8"
              onClick={() => setViewMode('list')}
            >
              <Rows3 className="w-3.5 h-3.5" />
              Lista
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Generator */}
        <Card className="lg:col-span-2 lg:sticky lg:top-4 h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center">
                <Wand2 className="w-4 h-4 text-white" />
              </div>
              Gerar com IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="prompt" className="text-xs font-medium">
                Descrição da imagem
              </Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Xícara de café fumegante sobre mesa de madeira rústica, manhã ensolarada, estilo fotografia profissional..."
                rows={4}
                className="resize-none"
              />
              <p className="text-[11px] text-muted-foreground">
                {prompt.length} caracteres · seja específico para melhores resultados
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Estilo rápido</Label>
              <div className="flex flex-wrap gap-1.5">
                {STYLE_PRESETS.slice(0, 4).map((s) => (
                  <button
                    key={s}
                    onClick={() => setPrompt((p) => (p ? `${p}, ${s.toLowerCase()}` : s))}
                    className="text-[10px] px-2 py-1 rounded-md bg-muted hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground"
                  >
                    + {s.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Título (opcional)</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nome para identificar na biblioteca"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Formato</Label>
              <div className="grid grid-cols-5 gap-1.5">
                {ORIENTATIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setOrientation(o.value)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all',
                      orientation === o.value
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                        : 'border-border hover:border-primary/40'
                    )}
                    title={`${o.label} — ${o.size} (${o.use})`}
                  >
                    <div
                      className={cn(
                        'rounded-sm bg-current',
                        orientation === o.value ? 'text-primary' : 'text-muted-foreground'
                      )}
                      style={{
                        width: o.value === 'square' ? 16 : o.value === 'portrait' || o.value === 'story' ? 12 : 20,
                        height: o.value === 'square' ? 16 : o.value === 'portrait' || o.value === 'story' ? 20 : 12,
                      }}
                    />
                    <span className="text-[9px] font-medium">{o.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {ORIENTATIONS.find((o) => o.value === orientation)?.size} —{' '}
                {ORIENTATIONS.find((o) => o.value === orientation)?.use}
              </p>
            </div>

            <Button
              className="w-full gap-2 h-10 bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90"
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando imagem...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar imagem
                </>
              )}
            </Button>

            {lastResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-primary/30 bg-primary/5 p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold">Imagem gerada!</span>
                </div>
                <div className="relative rounded-lg overflow-hidden bg-muted aspect-square">
                  <img src={lastResult.url} alt={lastResult.prompt} className="w-full h-full object-cover" />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 gap-1.5 h-8"
                  onClick={() => copyUrl(lastResult.url)}
                >
                  {copiedUrl === lastResult.url ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  Copiar URL
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Library */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Biblioteca de mídia</h3>
              <p className="text-xs text-muted-foreground">
                {assets.length} {assets.length === 1 ? 'item' : 'itens'}
                {companyId ? ' · empresa filtrada' : ' · todas empresas'}
              </p>
            </div>
            {!companyId && (
              <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                <Lightbulb className="w-3 h-3" />
                Selecione uma empresa
              </Badge>
            )}
          </div>

          {loading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 gap-3' : 'space-y-2'}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className={viewMode === 'grid' ? 'aspect-square rounded-xl' : 'h-20 rounded-xl'} />
              ))}
            </div>
          ) : assets.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={ImagePlus}
                  title="Nenhuma imagem na biblioteca"
                  description="Gere sua primeira imagem com IA usando o painel ao lado. As imagens ficam salvas aqui para reutilizar em seus posts."
                  action={
                    <Button variant="outline" className="gap-2" onClick={() => setSection('creator')}>
                      <Sparkles className="w-4 h-4" />
                      Ir para Criador
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <AnimatePresence>
                {assets.map((a: any, i: number) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.03 }}
                    className="group relative rounded-xl overflow-hidden border border-border bg-card cursor-pointer"
                    onClick={() => setPreviewAsset(a)}
                  >
                    <div className="aspect-square bg-muted relative">
                      <img
                        src={a.url}
                        alt={a.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="w-7 h-7"
                            onClick={(e) => {
                              e.stopPropagation()
                              copyUrl(a.url)
                            }}
                          >
                            {copiedUrl === a.url ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Link2 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="w-7 h-7"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(a.url, '_blank')
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="w-7 h-7 hover:bg-rose-500 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteId(a.id)
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      {a.source === 'ai' && (
                        <Badge className="absolute top-1.5 left-1.5 h-5 gap-0.5 text-[9px] bg-primary/90 backdrop-blur">
                          <Sparkles className="w-2.5 h-2.5" />
                          IA
                        </Badge>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{a.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {a.width}×{a.height}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-2 max-h-[700px] overflow-y-auto scroll-fancy pr-1">
              {assets.map((a: any, i: number) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="group flex items-center gap-3 p-2 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/40 transition-colors cursor-pointer"
                  onClick={() => setPreviewAsset(a)}
                >
                  <img
                    src={a.url}
                    alt={a.title}
                    className="w-16 h-16 rounded-lg object-cover bg-muted shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {a.prompt || a.description || '—'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="secondary" className="text-[9px] h-4">
                        {a.width}×{a.height}
                      </Badge>
                      {a.source === 'ai' && (
                        <Badge className="text-[9px] h-4 gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" /> IA
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyUrl(a.url)
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7 hover:text-rose-500"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteId(a.id)
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview dialog */}
      <Dialog open={!!previewAsset} onOpenChange={(v) => !v && setPreviewAsset(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary" />
              {previewAsset?.title}
            </DialogTitle>
          </DialogHeader>
          {previewAsset && (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden bg-muted max-h-[60vh] flex items-center justify-center">
                <img src={previewAsset.url} alt={previewAsset.title} className="max-h-[60vh] w-auto object-contain" />
              </div>
              {previewAsset.prompt && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Prompt</p>
                  <p className="text-sm">{previewAsset.prompt}</p>
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{previewAsset.width}×{previewAsset.height}</Badge>
                <Badge className="gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  {previewAsset.source === 'ai' ? 'Gerada por IA' : 'Upload'}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => previewAsset && copyUrl(previewAsset.url)}
            >
              <Copy className="w-4 h-4" />
              Copiar URL
            </Button>
            <a href={previewAsset?.url} download>
              <Button className="gap-2 w-full">
                <Download className="w-4 h-4" />
                Baixar imagem
              </Button>
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta mídia?</AlertDialogTitle>
            <AlertDialogDescription>
              A imagem será removida permanentemente da biblioteca. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 hover:bg-rose-600 text-white"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
