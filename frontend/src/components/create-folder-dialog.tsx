"use client"

import type React from "react"

import { useState } from "react"
import { Plus, Folder } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "./auth-provider"
import { useToast } from "@/hooks/use-toast"
import { BLOB_SERVICE_URL } from "@/lib/service-config"

interface CreateFolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentPath: string
  onSuccess?: () => void
}

export function CreateFolderDialog({ open, onOpenChange, parentPath, onSuccess }: CreateFolderDialogProps) {
  const [folderName, setFolderName] = useState("")
  const [loading, setLoading] = useState(false)
  const { getAccessToken } = useAuth()
  const { toast } = useToast()

  const handleCreate = async () => {
    if (!folderName.trim()) return

    setLoading(true)
    try {
      const token = await getAccessToken(true)

      const requestBody = {
        fileId: parentPath ? `${parentPath}/${folderName.trim()}` : folderName.trim(),
      }

      const response = await fetch(`${BLOB_SERVICE_URL}/create-folder`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })      

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create folder")
      }

      const data = await response.json()

      toast({
        title: "Folder created",
        description: `"${data.folder?.name || folderName}" has been created successfully`,
      })

      onOpenChange(false)
      setFolderName("")
      onSuccess?.()
    } catch (error) {
      console.error("Create folder error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create folder",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreate()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Folder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="foldername" className="text-sm font-medium">
              Folder name
            </Label>
            <Input
              id="foldername"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="mt-1"
              placeholder="Enter folder name"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Folder className="w-4 h-4" />
            <span>Location: {parentPath || "Root"}</span>
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading || !folderName.trim()}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
