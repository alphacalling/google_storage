"use client"

import { useState, useEffect } from "react"
import { Info, Calendar, HardDrive, User, Tag, Link, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  formatFileSize,
  formatDate,
  getFileIcon,
  getFileIconColor,
} from "@/lib/utils/file-utils"
import { useAuth } from "./auth-provider"
import { ONEDRIVE_SERVICE_URL } from "@/lib/service-config"
import type { FileItem } from "@/lib/types"

interface DetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: FileItem
  source: "onedrive" | "blob"
}

interface DetailedMetadata {
  id: string
  name: string
  size: number
  createdDateTime: string
  lastModifiedDateTime: string
  createdBy?: {
    user?: {
      displayName: string
      email: string
    }
  }
  lastModifiedBy?: {
    user?: {
      displayName: string
      email: string
    }
  }
  parentReference?: {
    path: string
    name: string
  }
  webUrl: string
  folder?: any
  file?: {
    mimeType: string
    hashes?: {
      quickXorHash: string
    }
  }
  shared?: {
    scope: string
  }
  specialFolder?: {
    name: string
  }
}

export function DetailsDialog({ open, onOpenChange, file, source }: DetailsDialogProps) {
  const [metadata, setMetadata] = useState<DetailedMetadata | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { getAccessToken } = useAuth()

  const IconComponent = getFileIcon(file)
  const color = getFileIconColor(file)

  useEffect(() => {
    if (open && source === "onedrive") {
      fetchMetadata()
    }
  }, [open, file.id, source])

  const fetchMetadata = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = await getAccessToken()
      const response = await fetch(`${ONEDRIVE_SERVICE_URL}/metadata?fileId=${file.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch metadata")

      const data = await response.json()
      setMetadata(data.metadata)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metadata")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Icon and Name */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center">
              <IconComponent className={`w-8 h-8 ${color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">{file.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{file.type === "folder" ? "Folder" : "File"}</p>
            </div>
          </div>

          <Separator />

          {/* Loading State */}
          {loading && source === "onedrive" && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading detailed metadata...</span>
            </div>
          )}

          {/* Error State */}
          {error && source === "onedrive" && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Information</h4>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Type</span>
                <span className="font-medium">
                  {file.type === "folder" ? "Folder" : file.name.split(".").pop()?.toUpperCase() || "File"}
                </span>
              </div>

              {metadata?.file?.mimeType && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">MIME Type</span>
                  <span className="font-medium text-xs">{metadata.file.mimeType}</span>
                </div>
              )}

              {file.type === "file" && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Size</span>
                  <span className="font-medium">{formatFileSize(metadata?.size || file.size)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Modified</span>
                <span className="font-medium">{formatDate(metadata?.lastModifiedDateTime || file.lastModified)}</span>
              </div>

              {metadata?.createdDateTime && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Created</span>
                  <span className="font-medium">{formatDate(metadata.createdDateTime)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Location</span>
                <span className="font-medium truncate ml-2">
                  {metadata?.parentReference?.path?.replace("/drive/root:", "") || file.path || "/"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Source</span>
                <Badge variant={source === "onedrive" ? "default" : "secondary"}>
                  Azure Storage
                </Badge>
              </div>

              {metadata?.shared && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Sharing</span>
                  <Badge variant="outline">{metadata.shared.scope || "Shared"}</Badge>
                </div>
              )}

              {metadata?.specialFolder && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Special Folder</span>
                  <Badge variant="secondary">{metadata.specialFolder.name}</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Created/Modified By */}
          {(metadata?.createdBy || metadata?.lastModifiedBy) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4" />
                  People
                </h4>
                <div className="space-y-2 text-sm">
                  {metadata.createdBy?.user && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Created by</span>
                      <span className="font-medium">
                        {metadata.createdBy.user.displayName || metadata.createdBy.user.email}
                      </span>
                    </div>
                  )}
                  {metadata.lastModifiedBy?.user && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Modified by</span>
                      <span className="font-medium">
                        {metadata.lastModifiedBy.user.displayName || metadata.lastModifiedBy.user.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Tags */}
          {file.tags && file.tags.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {file.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Security Hash */}
          {metadata?.file?.hashes?.quickXorHash && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Security</h4>
                <div className="text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">QuickXOR Hash</span>
                  </div>
                  <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded font-mono text-xs break-all">
                    {metadata.file.hashes.quickXorHash}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Links */}
          {(file.webUrl || metadata?.webUrl) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  Links
                </h4>
                <div className="space-y-2">
                  <a
                    href={metadata?.webUrl || file.webUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 break-all"
                  >
                    Open in Azure Portal
                  </a>
                </div>
              </div>
            </>
          )}

          {/* Activity Summary */}
          <Separator />
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Activity
            </h4>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2 mb-1">
                <HardDrive className="w-3 h-3" />
                <span>
                  Last modified {formatDate(metadata?.lastModifiedDateTime || file.lastModified)}
                  {metadata?.lastModifiedBy?.user && ` by ${metadata.lastModifiedBy.user.displayName}`}
                </span>
              </div>
              {metadata?.createdDateTime && (
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3" />
                  <span>
                    Created {formatDate(metadata.createdDateTime)}
                    {metadata?.createdBy?.user && ` by ${metadata.createdBy.user.displayName}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
