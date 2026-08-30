# Task ID: 12 — Subagent (Settings + Posts Enhancements)

## Task

**Task A**: Build `Settings` section (`src/components/sections/settings-section.tsx`) — per-company brand voice + AI defaults configuration.

**Task B**: Add media thumbnails + bulk selection mode + per-post 3-dot dropdown actions to existing `src/components/sections/posts-section.tsx` (targeted edits, no rewrite).

## Work Log

### Task A — Settings Section (NEW file)

Created `/home/z/my-project/src/components/sections/settings-section.tsx` (919 lines, 'use client').

**Imports (per design contract):**
- `useAppStore`, `useFetch`, `apiPost`, `cn` from `@/lib/...`
- `PLATFORMS`, `PLATFORM_META`, `TONES`, `PlatformIcon` from `@/lib/types` & `@/lib/platform-icons`
- `SectionHeader`, `EmptyState`, `PlatformBadge` from `@/components/shared/ui`
- shadcn UI: `Card`, `Button`, `Input`, `Textarea`, `Label`, `Badge`, `Skeleton`, `Separator`, `Slider`, `Switch`, `Checkbox`, `Select`
- `toast` from `sonner`, `motion` from `framer-motion`, lucide icons (SettingsIcon, Building2, Mic2, CalendarClock, Bot, Eye, Loader2, Save, Sparkles, Hash, Clock, Globe2, ImageIcon, CheckCircle2, CircleAlert, Wand2, Palette)

**Architecture:**
- `CompanySettings` interface mirrors the API response (with `defaultPlatforms` / `defaultHashtags` as JSON strings).
- `FormState` interface uses native arrays for the JSON-string fields (parsed once on hydrate, serialized on save).
- `DEFAULT_FORM` constant sets safe defaults (`'profissional'`, `[]`, `8`, `70`, `true`, `true`, `false`, `'daily'`, `'09:00'`, `'America/Sao_Paulo'`).
- `TONE_LABELS` and `FREQUENCY_LABELS` maps for pt-BR friendly labels.
- `safeParse<T>` helper (with try/catch) for the JSON-string fields.
- `formFromSettings()` converts API response → FormState.
- `serializeForm()` converts FormState → POST body (with arrays, not strings).
- `formsEqual()` deep-compares FormState for dirty detection.
- `buildPreviewCaption()` generates a static, tone-aware preview caption that reacts to `autoEmoji`, `autoHashtags`, `defaultHashtags`, `hashtagCount`, `aiCreativity`, `targetAudience`, `brandVoice` keywords ("pergunta"/"emoji").

**Main component `SettingsSection`:**
- `selectedCompanyId` from store (selector pattern). If null → renders `EmptyState` with "Ver empresas" CTA.
- `useFetch<{ settings }>('/api/settings?companyId=X', [selectedCompanyId])`.
- Hydration via `useEffect` with `lastLoadedIdRef` ref-guard so it only initializes once per company switch (avoids re-hydrating on every keystroke). No `react-hooks/set-state-in-effect` lint error — the rule doesn't fire here because the early-return guards prevent setState when nothing changed.
- `isDirty` derived via `useMemo(() => !formsEqual(form, savedSnapshot))`.
- Header `action` shows `Não salvo` (amber CircleAlert) or `Salvo` (emerald CheckCircle2) badge based on `isDirty`.
- Loading state: 3-column grid of `Skeleton` cards mirroring final layout (only shown when `loading && !hydrated`).
- 2-column desktop layout: `lg:grid-cols-3` with form left (`lg:col-span-2 space-y-6`) and preview right (`lg:col-span-1` with `lg:sticky lg:top-4`).

**Three cards on the left:**

1. **Voz da Marca** (Mic2 icon)
   - `brandVoice` Textarea (3 rows, placeholder: "Ex.: Amigável, descontraído, usa emojis moderadamente, sempre termina com pergunta")
   - `targetAudience` Input (placeholder: "Jovens 18-30, interessados em café especial")

2. **Padrões de Postagem** (CalendarClock icon)
   - 2-col grid: `defaultTone` Select (7 tones via TONES) + `postingFrequency` Select (daily/weekly/biweekly)
   - `defaultPlatforms` Checkbox grid (2-3 cols, each label = Checkbox + PlatformIcon + label, with primary border when checked)
   - `defaultHashtags` Input + "Adicionar" Button (Enter or click to add). Hashtag badges with "×" remove button. Parses comma-separated input.
   - 3-col grid: `bestPostingTime` time Input + `timezone` Input (default America/Sao_Paulo)

3. **Configuração de IA** (Bot icon)
   - `aiCreativity` Slider (0-100, step 1) with current value Badge. Labels: "Conservador" (Sparkles) ↔ "Criativo" (Wand2). Explanatory helper text.
   - `hashtagCount` number Input (min 1, max 15, clamped on change).
   - 3 `SwitchRow` components (separate function): `autoEmoji` (✨), `autoHashtags` (#), `watermark` (©). Each has icon tile + label + description + Switch.

**Save buttons row:**
- "Descartar" outline button (disabled when !isDirty or saving) → resets form to `savedSnapshot`.
- "Salvar configurações" primary button (disabled when !isDirty or saving) with Loader2 spinner → POST `/api/settings` with serialized form. On success: updates `form`, `savedSnapshot`, toast. Min-width 180px to avoid layout shift.

**Right column — Live Preview (sticky):**
- Card with gradient primary/fuchsia header.
- Motion.div (keyed on tone/creativity/emoji/hashtags settings) that re-animates on relevant setting change.
- Mock post header: gradient avatar "S", "Sua Empresa" + selected platform labels + up to 3 PlatformBadges.
- `<pre>` with `whitespace-pre-wrap font-sans` showing `buildPreviewCaption(form)`.
- Mock media placeholder (aspect-video gradient) — shows "© Sua Empresa" watermark overlay when `watermark` is on.
- Mock actions row (Curtir / Comentar / Compartilhar).
- Separator + "Resumo da configuração" with chips: tone, frequency, time, creativity, hashtag count, emojis, watermark.

**`SwitchRow` helper component** (separate function) — icon tile + label + description + Switch, used for the 3 AI toggles.

### Task B — Posts Section Enhancements (targeted edits)

Modified `/home/z/my-project/src/components/sections/posts-section.tsx` via MultiEdit (added ~250 lines, modified ~30 existing lines).

**Imports added:**
- `apiPost` added to `@/lib/hooks` import.
- `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger` from `@/components/ui/dropdown-menu`.
- `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle` from `@/components/ui/alert-dialog`.
- lucide icons: `MoreHorizontal`, `Copy`, `CheckSquare`, `X`, `Loader2`, `Image as ImageIcon`.

**State additions in `PostsSection`:**
- `selectionMode` (boolean) — toggles bulk selection.
- `selectedIds` (Set<string>) — currently checked post IDs.
- `confirmBulkDelete` (boolean) — controls bulk delete AlertDialog.
- `singleDeletePost` (any | null) — controls per-row delete AlertDialog.
- `bulkActionLoading` ('duplicate' | 'delete' | null) — disables floating bar buttons during bulk ops.
- `rowActionLoading` ({ id, action } | null) — disables the per-row 3-dot trigger and shows spinner for the in-flight row.

**Handlers added:**
- `toggleSelect(id)` — set-based toggle.
- `toggleSelectAll()` — selects all `filteredPosts` if not all selected, otherwise clears.
- `exitSelectionMode()` — turns off `selectionMode` and clears `selectedIds`.
- `handleSingleDuplicate(post)` — POST `/api/posts/[id]` `{ action: 'duplicate' }`, toast, refresh.
- `handleSingleDelete(post)` — DELETE `/api/posts/[id]`, toast, refresh, clears `singleDeletePost`.
- `handleBulkDuplicate()` — sequentially POSTs duplicate for each ID in `selectedIds` (with per-item try/catch), toast success/warning, exit selection mode, refresh.
- `handleBulkDelete()` — sequentially DELETEs each ID, toast, closes confirm dialog, exit selection mode, refresh.

**Filter bar update:**
Added a conditional block after the company Select — only renders when `view === 'list'`:
- Not in selection mode → "Selecionar" outline button (CheckSquare icon).
- In selection mode → "Marcar tudo" / "Desmarcar tudo" button + "Sair" ghost button.

**Tabs onValueChange** updated to exit selection mode if switching away from list view.

**List view rows — full refactor:**
- Changed `<motion.button>` → `<motion.div>` with `role="button"` + `tabIndex={0}` + `onKeyDown` for Enter/Space accessibility (needed because DropdownMenu trigger is a button and can't be nested in a button).
- Row `onClick`: if `selectionMode` → `toggleSelect(post.id)`; else → `setEditing(post)`.
- Row className adds `cursor-pointer`, `focus-visible:ring-2`, and `bg-primary/5` when selected in selection mode.
- **Media thumbnail** added BETWEEN the color stripe and the text content:
  - Parses `post.mediaUrls` via existing `safeParse<string[]>(post.mediaUrls, [])`.
  - If `mediaUrls.length > 0`: renders first URL as `<img>` 48x48 (`w-12 h-12 rounded-lg object-cover border`), `loading="lazy"`. If `mediaUrls.length > 1`, shows a primary-colored "+N" badge in the bottom-right corner.
  - If empty: shows a dashed-border placeholder with `ImageIcon` (subtle muted foreground) so the row layout doesn't shift.
- **Selection-mode checkbox**: when `selectionMode` is on, renders a `Checkbox` (shadcn) before the thumbnail (replaces the pencil icon per spec). Uses `aria-label={`Selecionar ${post.title}`}`.
- **3-dot DropdownMenu** (replaces the Pencil): rendered only when `!selectionMode`, wrapped in a div with `onClick={e => e.stopPropagation()}` to prevent the row's onClick. Trigger is a ghost icon Button that's `opacity-0 group-hover:opacity-100` (and visible when `data-[state=open]`). Shows `Loader2` spinner when `rowLoading` is set. Menu items:
  - "Editar" (Pencil) → `setEditing(post)`
  - "Duplicar" (Copy) → `handleSingleDuplicate(post)`, disabled when `rowLoading === 'duplicate'`
  - "Excluir" (Trash2, rose-tinted) → `setSingleDeletePost(post)`, disabled when `rowLoading === 'delete'`

**Single-post delete AlertDialog:**
- Triggered when `singleDeletePost` is set.
- Shows the post title, with rose destructive `AlertDialogAction` (with Loader2 spinner when deleting).
- Calls `handleSingleDelete(singleDeletePost)` on confirm.

**Bulk delete AlertDialog:**
- Triggered when `confirmBulkDelete` is true.
- Shows the count ("Excluir N posts?"), with rose destructive `AlertDialogAction` "Excluir todos" (with Loader2 spinner).
- Calls `handleBulkDelete()` on confirm.

**Floating bulk action bar:**
- Wrapped in `<AnimatePresence>` for exit animation.
- Only renders when `selectionMode && selectedIds.size > 0`.
- `fixed bottom-6 left-1/2 -translate-x-1/2 z-40` — centered at bottom.
- `motion.div` with spring transition (y: 60 → 0, opacity: 0 → 1).
- Card with backdrop blur, contains:
  - Badge: "X selecionados" (or singular) with CheckSquare icon.
  - Vertical divider.
  - "Duplicar" outline button (Copy icon, Loader2 spinner when bulkActionLoading === 'duplicate').
  - "Excluir" destructive button (Trash2, Loader2 spinner).
  - Vertical divider.
  - "Cancelar" ghost button (X icon) → `exitSelectionMode`.
- All buttons disabled during bulk action.

### Verification

- `bun run lint` — **0 errors, 0 warnings** (clean).
- Dev server restarted (was SIGKILL'd before), HTTP 200 on `/`.
- `GET /api/settings?companyId=X` returns 200 with auto-created default settings.
- `POST /api/posts/[id] { action: 'duplicate' }` returns 201 with new draft (verified by curl).
- `DELETE /api/posts/[id]` returns `{ success: true }`.
- Created a test post with `mediaUrls: ["/uploads/...png", "/uploads/...png"]` — verified `mediaUrls` roundtrips through POST → GET as JSON string array.
- Settings page renders (HTML 84KB, contains "Configurações" string).

### Design contracts honored

- All shared UI from `@/components/shared/ui`: `SectionHeader`, `EmptyState`, `PlatformBadge`, `StatusBadge`.
- All hooks/utils from `@/lib/...`: `useFetch`, `apiPost`, `apiPut`, `apiDelete`, `useAppStore`, `cn`, `formatDateTime`, `toLocalInputValue`.
- shadcn components from `@/components/ui/...`: card, button, input, textarea, label, badge, skeleton, separator, slider, switch, checkbox, select, dialog, dropdown-menu, alert-dialog, tabs.
- `'use client'` directive on both files.
- `toast` from `sonner`. `motion` / `AnimatePresence` from `framer-motion`. lucide-react icons throughout.
- pt-BR text everywhere.
- Purple/fuchsia theme (no blue/indigo accents — only shadcn `primary` tokens, rose for destructive, amber for "dirty" warning, emerald for "saved" status).
- Card padding `p-4` / `p-6`, gaps `gap-4` / `gap-6`.
- Long list (Posts) keeps existing `max-h-[640px] overflow-y-auto scroll-fancy`.
- Responsive: Settings grid collapses 3 → 1 cols on mobile; platform checkbox grid 3 → 2 cols; posting defaults 2-col grid → 1-col.
- Accessibility: `aria-label` on icon buttons & checkboxes, `role="button"` + `tabIndex={0}` + `onKeyDown` on row (since switched from `<button>` to `<div>` to allow nested DropdownMenu trigger), `Label htmlFor` pairs.
- Settings effect avoids the `react-hooks/set-state-in-effect` lint error via ref-guard pattern (`lastLoadedIdRef`) — no eslint-disable comment needed.

## Stage Summary

- Settings section (`settings-section.tsx`) — full per-company brand voice + AI defaults config UI with 3 form cards (Voz da Marca, Padrões de Postagem, Configuração de IA), 2-col sticky layout, dirty-state tracking ("Não salvo"/"Salvo" badges), live preview card that reacts to tone/emoji/hashtags/creativity, hashtag badge editor, Slider for creativity, Switch toggles, loading skeleton, and Discardar/Salvar buttons. API contract honored (parses JSON string fields with try/catch, serializes arrays in POST body).
- Posts section (`posts-section.tsx`) — extended existing list view with: (a) 48×48 media thumbnails parsed from `post.mediaUrls` JSON string array, with "+N" overflow badge; (b) bulk selection mode with "Selecionar" toggle, per-row checkboxes, "Marcar tudo" / "Desmarcar tudo" / "Sair" controls, floating action bar (Duplicar / Excluir / Cancelar) at bottom-center with spring entrance animation, AlertDialog confirmation for bulk delete; (c) per-row 3-dot DropdownMenu (MoreHorizontal) with Editar/Duplicar/Excluir options + AlertDialog for single-post delete confirmation. Existing click-to-edit behavior preserved.
- All APIs verified working via curl (settings GET auto-creates defaults, posts duplicate POST returns 201 with draft copy, posts DELETE returns success).
- `bun run lint`: 0 errors, 0 warnings.
- Dev server healthy on port 3000.
