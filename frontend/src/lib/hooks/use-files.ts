"use client"

import { useEffect } from "react"
import { devLog } from "@/lib/utils/dev-log"
import { useAuth } from "@/components/auth-provider"
import type { FileItem } from "@/lib/types"
import { BLOB_SERVICE_URL } from "@/lib/service-config"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

interface UseFilesOptions {
  path?: string
  autoRefresh?: boolean
}

interface UseFilesReturn {
  files: FileItem[]
  loading: boolean
  refreshing: boolean
  error: string | null
  refresh: () => Promise<void>
  uploadFile: (file: File) => Promise<void>
  createFolder: (name: string) => Promise<void>
  deleteFile: (fileId: string) => Promise<void>
  renameFile: (fileId: string, newName: string) => Promise<void>
}

export function useFiles({ path = "", autoRefresh = false }: UseFilesOptions): UseFilesReturn {
  const { getAccessToken } = useAuth()
  const queryClient = useQueryClient()

  const fetchFiles = async (): Promise<FileItem[]> => {
    devLog(`📤 Fetching files from blob path "${path}"`)
    const token = await getAccessToken(true)
    const headers = { Authorization: `Bearer ${token}` }
    const endpoint = `${BLOB_SERVICE_URL}/files`
    const params = new URLSearchParams()
    if (path) params.append("path", path)
    const response = await fetch(`${endpoint}?${params.toString()}`, { headers })
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed. Please sign in again.")
      }
      let message = `Failed to fetch files: ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData && errorData.error) {
          message = `${errorData.error}${errorData.details ? ` – ${errorData.details}` : ""}`
        }
      } catch {
        // ignore
      }
      throw new Error(message)
    }
    const data = await response.json()
    const files = data.files || []
    devLog(`✅ Blob API returned ${files.length} items`)
    return files
  }

  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["files", path],
    queryFn: fetchFiles,
    refetchInterval: autoRefresh ? 30000 : false,
  })

  const files = data ?? []
  const loading = isLoading && !data
  const refreshing = isFetching
  const errorMessage = (error as Error | null)?.message ?? null

  useEffect(() => {
    devLog(`🗃️ useFiles received ${files.length} items`)
  }, [files])

  useEffect(() => {
    if (errorMessage) {
      devLog(`⚠️ useFiles error: ${errorMessage}`)
    }
  }, [errorMessage])

  const refresh = async () => {
    await refetch()
  }

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      devLog(`⬆️ Uploading file ${file.name} to path "${path}"`)
      const token = await getAccessToken(true)
      const form = new FormData()
      form.append("file", file)
      form.append("path", path)
      const response = await fetch(`${BLOB_SERVICE_URL}/files`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      if (!response.ok) throw new Error("Upload failed")
      return response.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["files", path] }),
  })

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const token = await getAccessToken(true)
      const response = await fetch(`${BLOB_SERVICE_URL}/create-folder`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, path }),
      })
      if (!response.ok) throw new Error("Failed to create folder")
      return response.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["files", path] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const token = await getAccessToken(true)
      const response = await fetch(`${BLOB_SERVICE_URL}/delete?fileId=${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to delete file")
      return response.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["files", path] }),
  })

  const renameMutation = useMutation({
    mutationFn: async ({ fileId, newName }: { fileId: string; newName: string }) => {
      const token = await getAccessToken(true)
      const response = await fetch(`${BLOB_SERVICE_URL}/rename`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId, newName }),
      })
      if (!response.ok) throw new Error("Failed to rename file")
      return response.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["files", path] }),
  })

  return {
    files,
    loading,
    refreshing,
    error: errorMessage,
    refresh,
    uploadFile: async (file: File) => uploadMutation.mutateAsync(file),
    createFolder: async (name: string) => createFolderMutation.mutateAsync(name),
    deleteFile: async (fileId: string) => deleteMutation.mutateAsync(fileId),
    renameFile: async (fileId: string, newName: string) => renameMutation.mutateAsync({
      fileId,
      newName,
    }),
  }
}

