"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, File, CheckCircle, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { BLOB_SERVICE_URL } from "@/lib/service-config"

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentPath: string
  onSuccess?: () => void
}

interface UploadFile {
  file: File
  progress: number
  status: "pending" | "uploading" | "completed" | "error"
  error?: string
}

export function UploadDialog({ open, onOpenChange, parentPath, onSuccess }: UploadDialogProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const { getAccessToken } = useAuth()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      progress: 0,
      status: "pending" as const,
    }))
    setUploadFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  })

  const removeFile = (index: number) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const startUpload = async () => {
    setIsUploading(true)

    for (let i = 0; i < uploadFiles.length; i++) {
      const uploadFile = uploadFiles[i]
      if (uploadFile.status !== "pending") continue

      try {
        setUploadFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: "uploading" } : f)))

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          setUploadFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, progress } : f)))
        }

        await uploadFileToBlob(uploadFile.file, parentPath)

        setUploadFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: "completed", progress: 100 } : f)))
      } catch (error) {
        setUploadFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: "error",
                  error: error instanceof Error ? error.message : "Upload failed",
                }
              : f,
          ),
        )
      }
    }

    setIsUploading(false)
    onSuccess?.()
  }

  const uploadFileToBlob = async (file: File, path: string) => {
    const token = await getAccessToken(true)
    const endpoint = `${BLOB_SERVICE_URL}/api/v1/upload`

    const formData = new FormData()
    formData.append("file", file)
    formData.append("path", path)

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(text)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusIcon = (status: UploadFile["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <File className="w-4 h-4 text-gray-400" />
    }
  }

  const canUpload = uploadFiles.length > 0 && !isUploading
  const allCompleted = uploadFiles.every((f) => f.status === "completed")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
            )}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {isDragActive ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-gray-500 dark:text-gray-400">or click to browse files</p>
          </div>

          {/* File List */}
          {uploadFiles.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {uploadFiles.map((uploadFile, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  {getStatusIcon(uploadFile.status)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {uploadFile.file.name}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(uploadFile.file.size)}
                      </span>
                    </div>

                    {uploadFile.status === "uploading" && <Progress value={uploadFile.progress} className="h-1" />}

                    {uploadFile.status === "error" && uploadFile.error && (
                      <p className="text-xs text-red-500 mt-1">{uploadFile.error}</p>
                    )}
                  </div>

                  {uploadFile.status === "pending" && (
                    <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {allCompleted ? "Close" : "Cancel"}
            </Button>
            {canUpload && (
              <Button onClick={startUpload} disabled={isUploading}>
                {isUploading ? "Uploading..." : "Upload Files"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
