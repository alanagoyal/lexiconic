import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Playfair_Display } from "next/font/google"
import "./globals.css"
import { NuqsAdapter } from "nuqs/adapters/next/app"

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "block",
  variable: "--font-playfair",
  preload: true,
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'),
  title: "Lexiconic",
  description: "A digital exploration of linguistic untranslatability",
  openGraph: {
    title: "Lexiconic",
    description: "A digital exploration of linguistic untranslatability",
    images: [
      {
        url: "/lexiconic/images/og.png",
        width: 1200,
        height: 630,
        alt: "Lexiconic",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lexiconic",
    description: "A digital exploration of linguistic untranslatability",
    images: ["/lexiconic/images/og.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: "GT Standard", ${GeistSans.style.fontFamily};
  --font-sans: "GT Standard", ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
  --font-playfair: ${playfair.variable};
}
        `}</style>
      </head>
      <body className={`${playfair.variable}`}>
        <NuqsAdapter>
          {children}
        </NuqsAdapter>
      </body>
    </html>
  )
}
