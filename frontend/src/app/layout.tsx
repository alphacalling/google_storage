import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth-provider"
import { ReactQueryProvider } from "@/components/react-query-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "UniDrive - Azure Blob File Management",
  description: "Access your Azure Blob Storage files in one place",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>

      <head>
        <meta httpEquiv="permissions-policy" content="fullscreen=(self)" />
      </head>
      <body suppressHydrationWarning className={inter.className}>

        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ReactQueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </ReactQueryProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
