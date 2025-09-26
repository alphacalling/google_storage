"use client"

import { useState, useEffect } from "react"
import { X, Download, Share, ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "./loading-spinner"
import { cn } from "@/lib/utils"
import type { FileItem } from "@/lib/types"

interface PreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: FileItem
  source: "onedrive" | "blob"
}

export function PreviewModal({ open, onOpenChange, file, source }: PreviewModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [textContent, setTextContent] = useState<string | null>(null)

  const isImage = file.name.match(/\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i)
  const isPdf = file.name.match(/\.pdf$/i)
  const isText = file.name.match(/\.(txt|md|json|xml|csv)$/i)
  const isVideo = file.name.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i)
  const isAudio = file.name.match(/\.(mp3|wav|flac|aac|ogg)$/i)

  useEffect(() => {
    if (open) {
      setLoading(true)
      setError(null)
      setZoom(100)
      setRotation(0)

      // Simulate loading
      setTimeout(() => {
        setLoading(false)
      }, 1000)
    }
  }, [open, file])

  useEffect(() => {
    if (open && isText && file.downloadUrl) {
      fetch(file.downloadUrl)
        .then((r) => r.text())
        .then(setTextContent)
        .catch(() => setError("Failed to load file"))
    }
  }, [open, isText, file.downloadUrl])

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 25))
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)

  const handleDownload = () => {
    if (file.downloadUrl) {
      window.open(file.downloadUrl, "_blank")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-full h-[90vh] p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Preview</DialogTitle>
        </DialogHeader>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold truncate">{file.name}</h2>
            <span className="text-sm text-gray-500">
              {file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : ""}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isImage && (
              <>
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-500 min-w-[3rem] text-center">{zoom}%</span>
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleRotate}>
                  <RotateCw className="w-4 h-4" />
                </Button>
              </>
            )}

            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4" />
            </Button>

            <Button variant="outline" size="sm">
              <Share className="w-4 h-4" />
            </Button>

            {/* <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button> */}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <LoadingSpinner />
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <Button onClick={() => setError(null)}>Try Again</Button>
              </div>
            </div>
          ) : (
            <div className={cn(
              "flex h-full",
              isPdf ? "items-start justify-start" : "items-center justify-center p-4"
            )}>
              {isImage ? (
                <Image
                  src={
                    file.downloadUrl || `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(file.name)}`
                  }
                  alt={file.name}
                  width={600}
                  height={400}
                  className="max-w-full max-h-full object-contain"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transition: "transform 0.2s ease",
                  }}
                  onError={() => setError("Failed to load image")}
                  unoptimized
                />
              ) : isPdf ? (
                <div className="w-full h-full">
                  <iframe
                    src={file.downloadUrl || ""}
                    className="w-full h-full border-0"
                    title={`Preview of ${file.name}`}
                  />
                </div>
              ) : isText ? (
                <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100 font-mono">
                    {textContent || "Loading text content..."}
                  </pre>
                </div>
              ) : isVideo ? (
                <video
                  src={file.downloadUrl}
                  controls
                  className="max-w-full max-h-full"
                />
              ) : isAudio ? (
                <audio src={file.downloadUrl} controls className="w-full" />
              ) : (
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📄</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Preview not available</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    This file type cannot be previewed in the browser
                  </p>
                  <Button onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download to view
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
