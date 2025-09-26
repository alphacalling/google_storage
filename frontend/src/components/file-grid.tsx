"use client"

import { useEffect, useRef, useState } from "react"
import { FixedSizeGrid as Grid } from "react-window"
import { FileCard } from "./file-card"
import type { FileItem } from "@/lib/types"

interface FileGridProps {
  files: FileItem[]
  source: "onedrive" | "blob"
  currentPath?: string
  onRefresh: () => void
}

export function FileGrid({ files, source, currentPath, onRefresh }: FileGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const handle = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth)
      } else if (typeof window !== "undefined") {
        setWidth(window.innerWidth)
      }
    }
    handle()
    window.addEventListener("resize", handle)
    return () => window.removeEventListener("resize", handle)
  }, [])

  if (files.length > 50 && width > 0) {
    const columnCount = width < 640 ? 1 : width < 768 ? 2 : width < 1024 ? 3 : width < 1280 ? 4 : 5
    const columnWidth = width / columnCount
    const rowHeight = 220
    const rowCount = Math.ceil(files.length / columnCount)

    return (
      <div ref={containerRef} className="p-6 flex-1">
        <Grid
          columnCount={columnCount}
          columnWidth={columnWidth}
          height={Math.min(rowCount * rowHeight, 600)}
          rowCount={rowCount}
          rowHeight={rowHeight}
          width={width}
        >
          {({ columnIndex, rowIndex, style }) => {
            const index = rowIndex * columnCount + columnIndex
            const file = files[index]
            if (!file) return null
            return (
              <div style={{ ...style, padding: 8 }}>
                <FileCard file={file} source={source} currentPath={currentPath} onRefresh={onRefresh} />
              </div>
            )
          }}
        </Grid>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-6">
      {files.map((file) => (
        <FileCard key={file.id} file={file} source={source} currentPath={currentPath} onRefresh={onRefresh} />
      ))}
    </div>
  )
}
