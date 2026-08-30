'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Section =
  | 'dashboard'
  | 'companies'
  | 'posts'
  | 'creator'
  | 'media'
  | 'ideas'
  | 'hashtags'
  | 'social'
  | 'analytics'
  | 'seo'
  | 'settings'

interface AppState {
  activeSection: Section
  selectedCompanyId: string | null
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  creatorPrefill: { topic?: string; category?: string; tone?: string; platforms?: string[]; source?: string } | null
  setSection: (s: Section) => void
  setSelectedCompany: (id: string | null) => void
  toggleSidebar: () => void
  setSidebar: (v: boolean) => void
  toggleTheme: () => void
  setCreatorPrefill: (p: AppState['creatorPrefill']) => void
  clearCreatorPrefill: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeSection: 'dashboard',
      selectedCompanyId: null,
      sidebarOpen: true,
      theme: 'light',
      creatorPrefill: null,
      setSection: (s) => set({ activeSection: s }),
      setSelectedCompany: (id) => set({ selectedCompanyId: id }),
      toggleSidebar: () => set((st) => ({ sidebarOpen: !st.sidebarOpen })),
      setSidebar: (v) => set({ sidebarOpen: v }),
      toggleTheme: () => set((st) => ({ theme: st.theme === 'light' ? 'dark' : 'light' })),
      setCreatorPrefill: (p) => set({ creatorPrefill: p }),
      clearCreatorPrefill: () => set({ creatorPrefill: null }),
    }),
    { name: 'socialhub-store' }
  )
)
