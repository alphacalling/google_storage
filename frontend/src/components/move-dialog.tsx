"use client"

import { useState, useEffect } from "react"
import { FolderOpen, Folder, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { FileItem } from "@/lib/types"
import { getFileIconColor } from "@/lib/utils/file-utils"
import { useAuth } from "@/components/auth-provider"
import { ONEDRIVE_SERVICE_URL, BLOB_SERVICE_URL } from "@/lib/service-config"

interface MoveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: FileItem
  source: "onedrive" | "blob"
}

interface FolderNode {
  id: string
  name: string
  path: string
  children?: FolderNode[]
}

export function MoveDialog({ open, onOpenChange, file, source }: MoveDialogProps) {
  const [selectedId, setSelectedId] = useState("")
  const [loading, setLoading] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const [folders, setFolders] = useState<FolderNode[]>([])
  const { getAccessToken } = useAuth()
  const folderColor = getFileIconColor({
    id: "",
    name: "",
    type: "folder",
    size: 0,
    lastModified: new Date(),
    path: "",
  } as FileItem)

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getAccessToken(source === "blob")
        const base = source === "onedrive" ? ONEDRIVE_SERVICE_URL : BLOB_SERVICE_URL
        const res = await fetch(`${base}/files?path=`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        const folderNodes = (data.files || []).filter((f: FileItem) => f.type === "folder").map((f: FileItem) => ({
          id: f.id,
          name: f.name,
          path: f.name,
          children: [],
        }))
        setFolders([{ id: "root", name: "Azure Storage", path: "", children: folderNodes }])
      } catch (err) {
        console.error("Failed to load folders", err)
      }
    }
    if (open) load()
  }, [open, source])

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const handleMove = async () => {
    if (!selectedId) return

    setLoading(true)
    try {
      const token = await getAccessToken(source === "blob")
      const base = source === "onedrive" ? ONEDRIVE_SERVICE_URL : BLOB_SERVICE_URL
      const res = await fetch(`${base}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileId: file.id, newParentId: selectedId }),
      })
      if (!res.ok) throw new Error("Move failed")
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to move file:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderFolderTree = (folders: FolderNode[], level = 0) => {
    return folders.map((folder) => (
      <div key={folder.id}>
        <div
          className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
            selectedId === folder.id ? "bg-blue-100 dark:bg-blue-900/20" : ""
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => setSelectedId(folder.id)}
        >
          {folder.children && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFolder(folder.id)
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              <ChevronRight
                className={`w-3 h-3 transition-transform ${expandedFolders.has(folder.id) ? "rotate-90" : ""}`}
              />
            </button>
          )}
          <Folder className={`w-4 h-4 ${folderColor}`} />
          <span className="text-sm">{folder.name}</span>
        </div>

        {folder.children && expandedFolders.has(folder.id) && <div>{renderFolderTree(folder.children, level + 1)}</div>}
      </div>
    ))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className={`w-5 h-5 ${folderColor}`} />
            Move "{file.name}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Choose a destination folder:</p>

            <ScrollArea className="h-64 border rounded-lg">
              <div className="p-2">{renderFolderTree(folders)}</div>
            </ScrollArea>
          </div>

          {selectedId && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Destination ID:</span> {selectedId}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={loading || !selectedId}>
            {loading ? "Moving..." : "Move here"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
