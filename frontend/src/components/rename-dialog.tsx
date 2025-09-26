"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { FileEdit } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FileItem } from "@/lib/types"
import { useAuth } from "./auth-provider"
import { useToast } from "@/hooks/use-toast"
import { ONEDRIVE_SERVICE_URL, BLOB_SERVICE_URL } from "@/lib/service-config"

interface RenameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: FileItem
  source: "onedrive" | "blob"
  currentPath?: string
  onSuccess?: () => void
}

export function RenameDialog({ open, onOpenChange, file, source, onSuccess }: RenameDialogProps) {
  const [newName, setNewName] = useState("")
  const [loading, setLoading] = useState(false)
  const { getAccessToken } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setNewName(file.name)
    }
  }, [open, file.name])

  const handleRename = async () => {
    if (!newName.trim() || newName === file.name) return

    setLoading(true)
    try {
      const token = await getAccessToken(source === "blob")

      const base = source === "onedrive" ? ONEDRIVE_SERVICE_URL : BLOB_SERVICE_URL
      const response = await fetch(`${base}/rename`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId: file.id,
          newName: newName.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to rename")
      }

      const data = await response.json()

      toast({
        title: "Renamed successfully",
        description: `"${file.name}" has been renamed to "${data.file?.name || newName}"`,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Failed to rename:", error)
      toast({
        title: "Rename failed",
        description: error instanceof Error ? error.message : "Failed to rename file",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRename()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileEdit className="w-5 h-5" />
            Rename
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="filename" className="text-sm font-medium">
              {file.type === "folder" ? "Folder name" : "File name"}
            </Label>
            <Input
              id="filename"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="mt-1"
              placeholder={file.type === "folder" ? "Enter folder name" : "Enter file name"}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRename} disabled={loading || !newName.trim() || newName === file.name}>
            {loading ? "Renaming..." : "Rename"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
