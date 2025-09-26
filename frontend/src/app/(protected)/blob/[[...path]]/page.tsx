"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { MainLayout } from "@/components/main-layout"
import { TopBar } from "@/components/top-bar"
import { FileGrid } from "@/components/file-grid"
import { FileList } from "@/components/file-list"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useFiles } from "@/lib/hooks/use-files"
import { getFileTypeFromExtension } from "@/lib/utils/file-utils"

export default function BlobPage() {
  const params = useParams()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [fileFilter, setFileFilter] = useState<string | null>(null)

  // Extract path from params
  const pathArray = Array.isArray(params.path) ? params.path : params.path ? [params.path] : []
  const currentPath = pathArray.join("/")

  const { files, loading, refreshing, error, refresh } = useFiles({
    path: currentPath,
    autoRefresh: true,
  })

  const displayedFiles = fileFilter
    ? files.filter((f) => getFileTypeFromExtension(f.name) === fileFilter.toLowerCase())
    : files

  if (loading && files.length === 0) {
    return (
      <MainLayout source="blob" onFilterChange={setFileFilter}>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout source="blob" onFilterChange={setFileFilter}>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <h2 className="text-xl font-semibold text-red-600">Error Loading Files</h2>
          <p className="text-gray-600">{error}</p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>Possible issues:</p>
            <ul className="list-disc list-inside">
              <li>Authentication token expired</li>
              <li>Insufficient permissions</li>
              <li>Network connectivity issues</li>
              <li>API endpoint not responding</li>
            </ul>
          </div>
          <button onClick={refresh} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Try Again
          </button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout source="blob" onFilterChange={setFileFilter}>
      <TopBar
        source="blob"
        currentPath={currentPath}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={refresh}
        refreshing={refreshing}
      />

      <div className="flex-1 overflow-auto">
        {viewMode === "grid" ? (
          <FileGrid files={displayedFiles} source="blob" currentPath={currentPath} onRefresh={refresh} />
        ) : (
          <div className="p-6">
            <FileList files={displayedFiles} source="blob" currentPath={currentPath} onRefresh={refresh} />
          </div>
        )}
      </div>
    </MainLayout>
  )
}
