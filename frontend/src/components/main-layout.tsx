"use client"

import type React from "react"

import { useState } from "react"
import { Sidebar } from "./sidebar"
import { cn } from "@/lib/utils"

interface MainLayoutProps {
  children: React.ReactNode
  source?: "onedrive" | "blob" | "recycle" | "transfer"
  onFilterChange?: (filter: string | null) => void
}

export function MainLayout({ children, source = "onedrive", onFilterChange }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        currentSource={source}
        onFilterChange={onFilterChange}
      />

      <div className={cn("flex-1 flex flex-col transition-all duration-300", sidebarOpen ? "ml-64" : "ml-16")}>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
