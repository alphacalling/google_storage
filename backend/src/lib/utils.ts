import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - d.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) {
    return "Today"
  } else if (diffDays === 2) {
    return "Yesterday"
  } else if (diffDays <= 7) {
    return `${diffDays - 1} days ago`
  } else {
    return d.toLocaleDateString()
  }
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || ""
}

export function isImageFile(filename: string): boolean {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"]
  return imageExtensions.includes(getFileExtension(filename))
}

export function isVideoFile(filename: string): boolean {
  const videoExtensions = ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"]
  return videoExtensions.includes(getFileExtension(filename))
}

export function isAudioFile(filename: string): boolean {
  const audioExtensions = ["mp3", "wav", "flac", "aac", "ogg", "m4a"]
  return audioExtensions.includes(getFileExtension(filename))
}

export function isOfficeFile(filename: string): boolean {
  const officeExtensions = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"]
  return officeExtensions.includes(getFileExtension(filename))
}

export function isArchiveFile(filename: string): boolean {
  const archiveExtensions = ["zip", "rar", "7z", "tar", "gz", "bz2"]
  return archiveExtensions.includes(getFileExtension(filename))
}

export function canPreview(filename: string): boolean {
  const previewExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "pdf", "txt", "md"]
  return previewExtensions.includes(getFileExtension(filename))
}
