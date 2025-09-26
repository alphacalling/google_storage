"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Plus, Tag, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { useAuth } from "./auth-provider"
import { useToast } from "@/hooks/use-toast"
import type { FileItem } from "@/lib/types"
import { ONEDRIVE_SERVICE_URL, BLOB_SERVICE_URL } from "@/lib/service-config"

interface TagsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: FileItem
  source: "onedrive" | "blob"
  onSuccess?: () => void
}

export function TagsDialog({ open, onOpenChange, file, source, onSuccess }: TagsDialogProps) {
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [availableTags] = useState(["Important", "Work", "Personal", "Archive", "Draft", "Review", "Shared", "Urgent"])
  const { getAccessToken } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadTags()
    }
  }, [open, file.id])

  const loadTags = async () => {
    if (source === "blob") {
      // For blob storage, use existing tags from file object
      setTags(file.tags || [])
      return
    }

    try {
      setLoading(true)
      const isBlob = source === ("blob" as any)
      const token = await getAccessToken(isBlob)

      const response = await fetch(`${ONEDRIVE_SERVICE_URL}/tags?fileId=${file.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const customTags = data.fields.customTags
        if (customTags) {
          setTags(customTags.split(",").map((tag: string) => tag.trim()).filter(Boolean))
        } else {
          setTags([])
        }
      } else {
        // If no list item fields exist, start with empty tags
        setTags([])
      }
    } catch (error) {
      console.error("Failed to load tags:", error)
      setTags(file.tags || [])
    } finally {
      setLoading(false)
    }
  }

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags((prev) => [...prev, trimmedTag])
    }
    setNewTag("")
  }

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const token = await getAccessToken(source === "blob")

      if (source === "onedrive") {
        const response = await fetch(`${ONEDRIVE_SERVICE_URL}/tags`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileId: file.id,
            tags: tags,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to save tags")
        }

        toast({
          title: "Tags updated",
          description: "File tags have been saved",
        })
      } else {
        // For blob storage, use existing blob metadata API
        const response = await fetch(`${BLOB_SERVICE_URL}/tags`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileId: file.id,
            tags: tags,
          }),
        })

        if (!response.ok) throw new Error("Failed to save tags")

        toast({
          title: "Tags updated",
          description: "File tags have been saved to Azure Storage",
        })
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Failed to save tags:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save tags",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag(newTag)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Manage Tags
            {source === "onedrive" && (
              <Badge variant="outline" className="text-xs">Azure Storage</Badge>
            )}
            {source === "blob" && (
              <Badge variant="secondary" className="text-xs">Azure Storage</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">File: {file.name}</Label>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading tags...</span>
            </div>
          )}

          {/* Current Tags */}
          {!loading && (
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Current Tags</Label>
              <div className="flex flex-wrap gap-2 min-h-[2rem] p-2 border border-gray-200 dark:border-gray-600 rounded-lg">
                {tags.length === 0 ? (
                  <span className="text-sm text-gray-400 dark:text-gray-500">No tags</span>
                ) : (
                  tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button 
                        onClick={() => removeTag(tag)} 
                        className="ml-1 hover:text-red-500"
                        disabled={saving}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Add New Tag */}
          {!loading && (
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Add Tag</Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter tag name..."
                  className="flex-1"
                  disabled={saving}
                />
                <Button
                  onClick={() => addTag(newTag)}
                  disabled={!newTag.trim() || tags.includes(newTag.trim()) || saving}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Suggested Tags */}
          {!loading && (
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Suggested Tags</Label>
              <div className="flex flex-wrap gap-2">
                {availableTags
                  .filter((tag) => !tags.includes(tag))
                  .map((tag) => (
                    <Button 
                      key={tag} 
                      variant="outline" 
                      size="sm" 
                      onClick={() => addTag(tag)} 
                      className="text-xs"
                      disabled={saving}
                    >
                      {tag}
                    </Button>
                  ))}
              </div>
            </div>
          )}

          {/* API Info */}
          {source === "onedrive" && (
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
              <p>💡 Tags are stored as metadata alongside your files.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading || saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Tags"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
