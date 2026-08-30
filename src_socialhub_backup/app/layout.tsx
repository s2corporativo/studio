import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SocialHub — Agendamento & Criação de Posts com IA",
  description:
    "Plataforma completa para agendar, criar e otimizar posts para redes sociais com IA. Sincronize Instagram, Facebook, LinkedIn, TikTok, YouTube e X. SEO para Google e motores de IA.",
  keywords: [
    "agendamento redes sociais",
    "criação de conteúdo IA",
    "marketing digital",
    "SEO Google",
    "otimização IA",
    "gestão redes sociais",
  ],
  authors: [{ name: "SocialHub" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "SocialHub — Gestão de Redes Sociais com IA",
    description: "Agende, crie e otimize posts para todas as suas empresas com IA.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = JSON.parse(localStorage.getItem('socialhub-store') || '{}');
                const theme = stored?.state?.theme || 'light';
                if (theme === 'dark') document.documentElement.classList.add('dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
