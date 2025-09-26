"use client"
import { devLog } from "@/lib/utils/dev-log"


import type React from "react"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Upload, Plus, Search, Grid3X3, List, MoreHorizontal, Home, FolderPlus, Loader2 } from "lucide-react"
import { useAuth } from "./auth-provider"
import { useToast } from "@/hooks/use-toast"
import { UploadDialog } from "./upload-dialog"
import { CreateFolderDialog } from "./create-folder-dialog"

interface TopBarProps {
  source: "blob"
  currentPath?: string
  viewMode: "grid" | "list"
  onViewModeChange: (mode: "grid" | "list") => void
  onRefresh: () => void
  refreshing?: boolean
}

export function TopBar({ source, currentPath = "", viewMode, onViewModeChange, onRefresh, refreshing = false }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false)
  
  const router = useRouter()
  const pathname = usePathname()
  const { getAccessToken } = useAuth()
  const { toast } = useToast()

  // Generate breadcrumb items from current path
  const getBreadcrumbItems = () => {
    const items = [
      {
        label: "Home",
        href: "/",
        icon: <Home className="w-4 h-4" />,
      },
    ]

    items.push({
      label: "Azure Storage",
      href: "/blob",
      icon: null,
    })

    if (currentPath) {
      const pathSegments = currentPath.split("/").filter(Boolean)
      let accumulatedPath = ""

      pathSegments.forEach((segment, index) => {
        accumulatedPath += `/${segment}`
        const isLast = index === pathSegments.length - 1

        items.push({
          label: decodeURIComponent(segment),
          href: isLast ? "" : `/${source}${accumulatedPath}`,
          icon: null,
        })
      })
    }

    return items
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Implement search functionality
      devLog("Searching for:", searchQuery)
    }
  }


  const breadcrumbItems = getBreadcrumbItems()

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-900">
        {/* Left side - Breadcrumb */}
        <div className="flex items-center space-x-4">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbItems.map((item, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {item.href && index < breadcrumbItems.length - 1 ? (
                      <BreadcrumbLink href={item.href} className="flex items-center space-x-1 hover:text-blue-600">
                        {item.icon}
                        <span>{item.label}</span>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="flex items-center space-x-1">
                        {item.icon}
                        <span>{item.label}</span>
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-8">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </form>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("grid")}
              className="rounded-r-none"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("list")}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Upload Button */}
          <Button onClick={() => setUploadDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>

          {/* New Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setCreateFolderDialogOpen(true)}>
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>

          {/* More Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onRefresh} className="flex items-center gap-2">
                {refreshing && <Loader2 className="w-4 h-4 animate-spin" />}
                Refresh
              </DropdownMenuItem>
              <DropdownMenuItem>Select all</DropdownMenuItem>
              <DropdownMenuItem>Sort by</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        parentPath={currentPath}
        onSuccess={onRefresh}
      />

      <CreateFolderDialog
        open={createFolderDialogOpen}
        onOpenChange={setCreateFolderDialogOpen}
        parentPath={currentPath}
        onSuccess={onRefresh}
      />
    </>
  )
}
