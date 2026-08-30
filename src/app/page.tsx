'use client'

import { useEffect } from 'react'
import { useAppStore, type Section } from '@/lib/store'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/topbar'
import { DashboardSection } from '@/components/sections/dashboard-section'
import { CompaniesSection } from '@/components/sections/companies-section'
import { PostsSection } from '@/components/sections/posts-section'
import { CreatorSection } from '@/components/sections/creator-section'
import { SocialSection } from '@/components/sections/social-section'
import { AnalyticsSection } from '@/components/sections/analytics-section'
import { SeoSection } from '@/components/sections/seo-section'

export default function Home() {
  const activeSection = useAppStore((s) => s.activeSection)
  const theme = useAppStore((s) => s.theme)

  // Sync theme class on <html>
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [theme])

  const sections: Record<Section, React.ReactNode> = {
    dashboard: <DashboardSection />,
    companies: <CompaniesSection />,
    posts: <PostsSection />,
    creator: <CreatorSection />,
    social: <SocialSection />,
    analytics: <AnalyticsSection />,
    seo: <SeoSection />,
  }

  return (
    <div className="min-h-screen flex flex-col bg-background bg-aurora">
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 overflow-y-auto scroll-fancy">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
              {sections[activeSection]}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
