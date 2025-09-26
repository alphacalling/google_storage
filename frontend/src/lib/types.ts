export interface FileItem {
  id: string
  name: string
  type: "file" | "folder"
  size: number
  lastModified: Date
  path: string
  downloadUrl?: string
  webUrl?: string
  tags?: string[]
  deletedDate?: Date
  originalPath?: string
}

export interface DeltaItem {
  id: string
  deleted?: boolean
  file?: FileItem
}

export interface QuotaInfo {
  used: number
  total: number
  percentage: number
}

export interface UploadProgress {
  fileId: string
  fileName: string
  progress: number
  status: "pending" | "uploading" | "completed" | "error"
  error?: string
}

export interface SearchResult {
  files: FileItem[]
  totalCount: number
  hasMore: boolean
}

export interface TagInfo {
  name: string
  count: number
  color?: string
}
