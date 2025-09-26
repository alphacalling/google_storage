"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Loader2, Download, Share, Edit3, FileText, Calendar, AlertCircle } from "lucide-react"
import { useAuth } from "./auth-provider"
import { useToast } from "@/hooks/use-toast"
import type { FileItem } from "@/lib/types"
import { ONEDRIVE_SERVICE_URL } from "@/lib/service-config"

interface OfficeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: FileItem
  source: "onedrive" | "blob"
}

export function OfficeModal({ open, onOpenChange, file, source }: OfficeModalProps) {
  const [editUrl, setEditUrl] = useState<string | null>(null)
  const [viewUrl, setViewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { getAccessToken } = useAuth()
  const { toast } = useToast()

  const getFileTypeInfo = () => {
    const extension = file.name.split(".").pop()?.toLowerCase()
    switch (extension) {
      case "docx":
      case "doc":
        return {
          name: "Word Document",
          icon: "📝",
          color: "bg-blue-500",
          description: "Microsoft Word document for text editing and formatting",
        }
      case "xlsx":
      case "xls":
        return {
          name: "Excel Spreadsheet",
          icon: "📊",
          color: "bg-green-500",
          description: "Microsoft Excel spreadsheet for data analysis and calculations",
        }
      case "pptx":
      case "ppt":
        return {
          name: "PowerPoint Presentation",
          icon: "🎯",
          color: "bg-orange-500",
          description: "Microsoft PowerPoint presentation for slides and presentations",
        }
      default:
        return {
          name: "Office Document",
          icon: "📄",
          color: "bg-gray-500",
          description: "Microsoft Office document",
        }
    }
  }

  const fileTypeInfo = getFileTypeInfo()

  useEffect(() => {
    if (open && source === "onedrive") {
      fetchEditUrl()
    }
  }, [open, source, file.id])

  const fetchEditUrl = async () => {
    try {
      setLoading(true)
      const token = await getAccessToken()

      const response = await fetch(`${ONEDRIVE_SERVICE_URL}/edit-url`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId: file.id }),
      })

      if (!response.ok) {
        throw new Error("Failed to get edit URL")
      }

      const data = await response.json()
      setEditUrl(data.editUrl)
      setViewUrl(data.viewUrl)
    } catch (error) {
      console.error("Error fetching edit URL:", error)
      toast({
        title: "Error",
        description: "Failed to get Office Online URLs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    if (source === "blob") {
      toast({
        title: "Not supported",
        description:
          "Office file editing is not supported for Azure Blob Storage files. Please download the file to edit it locally.",
        variant: "destructive",
      })
      return
    }

    if (editUrl) {
      // Open in new tab with specific window features for Office Online
      window.open(editUrl, "_blank", "noopener,noreferrer,width=1200,height=800")
      onOpenChange(false)
      toast({
        title: "Opening in Office Online",
        description: "The file is opening in a new tab for editing",
      })
    } else {
      toast({
        title: "Edit URL not available",
        description: "Unable to open file for editing. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleView = () => {
    if (viewUrl) {
      // Open in new tab for viewing
      window.open(viewUrl, "_blank", "noopener,noreferrer,width=1200,height=800")
      onOpenChange(false)
      toast({
        title: "Opening in Office Online",
        description: "The file is opening in a new tab for viewing",
      })
    } else if (file.webUrl) {
      window.open(file.webUrl, "_blank", "noopener,noreferrer")
      onOpenChange(false)
    } else {
      toast({
        title: "View URL not available",
        description: "Unable to open file for viewing",
        variant: "destructive",
      })
    }
  }

  const handleDownload = () => {
    if (file.downloadUrl) {
      const link = document.createElement("a")
      link.href = file.downloadUrl
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast({
        title: "Download started",
        description: `Downloading ${file.name}`,
      })
    } else {
      toast({
        title: "Download not available",
        description: "Unable to download this file",
        variant: "destructive",
      })
    }
  }

  const handleShare = () => {
    if (navigator.share && file.webUrl) {
      navigator.share({
        title: file.name,
        url: file.webUrl,
      })
    } else if (file.webUrl || file.downloadUrl) {
      navigator.clipboard.writeText(file.webUrl || file.downloadUrl || "")
      toast({
        title: "Link copied",
        description: "File link has been copied to clipboard",
      })
    } else {
      toast({
        title: "Share not available",
        description: "Unable to share this file",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className={`w-12 h-12 ${fileTypeInfo.color} rounded-xl flex items-center justify-center text-white text-2xl shadow-lg`}
            >
              {fileTypeInfo.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate text-gray-900 dark:text-white">{file.name}</div>
              <div className="text-sm text-gray-500 font-normal">{fileTypeInfo.name}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Description */}
          <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border">
            <p className="text-sm text-gray-600 dark:text-gray-400">{fileTypeInfo.description}</p>
          </div>

          {/* File Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FileText className="w-4 h-4" />
                <span>Size</span>
              </div>
              <div className="text-sm font-medium">
                {file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "Unknown"}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Modified</span>
              </div>
              <div className="text-sm font-medium">{new Date(file.lastModified).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Tags */}
          {file.tags && file.tags.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags</div>
              <div className="flex flex-wrap gap-1">
                {file.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {source === "onedrive" ? (
              <>
                <Button
                  onClick={handleEdit}
                  className="w-full justify-start h-12 bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Edit3 className="w-5 h-5 mr-3" />}
                  <div className="flex-1 text-left">
                    <div className="font-medium">Edit in Office Online</div>
                    <div className="text-xs text-blue-100">Opens in a new tab for editing</div>
                  </div>
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>

                <Button
                  onClick={handleView}
                  variant="outline"
                  className="w-full justify-start h-12 bg-transparent border-gray-300"
                  disabled={loading}
                >
                  <FileText className="w-5 h-5 mr-3" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">View Document</div>
                    <div className="text-xs text-gray-500">Read-only view in new tab</div>
                  </div>
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </>
            ) : (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                      Office Online Not Available
                    </div>
                    <div className="text-amber-700 dark:text-amber-300">
                      Office file editing is not supported for Azure Blob Storage files. Please download the file to
                      edit it locally with Microsoft Office.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleDownload} variant="outline" className="justify-center bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>

              <Button onClick={handleShare} variant="outline" className="justify-center bg-transparent">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Info Notice */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <div className="text-sm">
                <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">New Tab Experience</div>
                <div className="text-blue-700 dark:text-blue-300">
                  {source === "onedrive"
                    ? "Microsoft Office files will always open in a new tab for the best editing and viewing experience. This ensures full compatibility with Office Online features and prevents iframe restrictions."
                    : "For the best experience with Office files, download and edit them locally."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
