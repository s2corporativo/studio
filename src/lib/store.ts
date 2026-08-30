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
  | 'social'
  | 'analytics'
  | 'seo'

interface AppState {
  activeSection: Section
  selectedCompanyId: string | null
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  setSection: (s: Section) => void
  setSelectedCompany: (id: string | null) => void
  toggleSidebar: () => void
  setSidebar: (v: boolean) => void
  toggleTheme: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeSection: 'dashboard',
      selectedCompanyId: null,
      sidebarOpen: true,
      theme: 'light',
      setSection: (s) => set({ activeSection: s }),
      setSelectedCompany: (id) => set({ selectedCompanyId: id }),
      toggleSidebar: () => set((st) => ({ sidebarOpen: !st.sidebarOpen })),
      setSidebar: (v) => set({ sidebarOpen: v }),
      toggleTheme: () => set((st) => ({ theme: st.theme === 'light' ? 'dark' : 'light' })),
    }),
    { name: 'socialhub-store' }
  )
)
