import {
  File,
  Folder,
  Image,
  Video,
  Music,
  Archive,
  FileText,
  Code,
} from "lucide-react"
import {
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
} from "react-icons/fa"
import type { FileItem } from "@/lib/types"

export function getFileIcon(file: FileItem) {
  if (file.type === "folder") {
    return Folder
  }

  const extension = file.name.split(".").pop()?.toLowerCase()

  switch (extension) {
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "bmp":
    case "svg":
    case "webp":
      return Image

    case "mp4":
    case "avi":
    case "mov":
    case "wmv":
    case "flv":
    case "webm":
      return Video

    case "mp3":
    case "wav":
    case "flac":
    case "aac":
    case "ogg":
      return Music

    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return Archive

    case "pdf":
      return FaFilePdf

    case "doc":
    case "docx":
      return FaFileWord

    case "txt":
    case "rtf":
      return FileText

    case "xls":
    case "xlsx":
    case "csv":
      return FaFileExcel

    case "ppt":
    case "pptx":
      return FaFilePowerpoint

    case "js":
    case "ts":
    case "jsx":
    case "tsx":
    case "html":
    case "css":
    case "json":
    case "xml":
    case "py":
    case "java":
    case "cpp":
    case "c":
      return Code

    default:
      return File
  }
}

export function getFileIconColor(file: FileItem): string {
  if (file.type === "folder") {
    return "text-yellow-600 dark:text-yellow-400"
  }

  const type = getFileTypeFromExtension(file.name)

  switch (type) {
    case "image":
      return "text-pink-600 dark:text-pink-400"
    case "video":
      return "text-purple-600 dark:text-purple-400"
    case "audio":
      return "text-green-600 dark:text-green-400"
    case "document":
      return "text-blue-600 dark:text-blue-400"
    case "spreadsheet":
      return "text-emerald-600 dark:text-emerald-400"
    case "presentation":
      return "text-orange-600 dark:text-orange-400"
    case "archive":
      return "text-red-600 dark:text-red-400"
    case "code":
      return "text-indigo-600 dark:text-indigo-400"
    default:
      return "text-blue-600 dark:text-blue-400"
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"

  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

export function formatDate(date: Date | string | number): string {
  try {
    // Handle different date formats
    let dateObj: Date

    if (date instanceof Date) {
      dateObj = date
    } else if (typeof date === "string") {
      dateObj = new Date(date)
    } else if (typeof date === "number") {
      dateObj = new Date(date)
    } else {
      console.warn("Invalid date format:", date)
      return "Unknown date"
    }

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn("Invalid date:", date)
      return "Invalid date"
    }

    const now = new Date()
    const diffInMs = now.getTime() - dateObj.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return "Today"
    } else if (diffInDays === 1) {
      return "Yesterday"
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`
    } else {
      return dateObj.toLocaleDateString()
    }
  } catch (error) {
    console.error("Error formatting date:", error, "Date value:", date)
    return "Unknown date"
  }
}

export function getFileTypeFromExtension(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase()

  const imageTypes = ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"]
  const videoTypes = ["mp4", "avi", "mov", "wmv", "flv", "webm"]
  const audioTypes = ["mp3", "wav", "flac", "aac", "ogg"]
  const documentTypes = ["doc", "docx", "txt", "rtf", "pdf"]
  const spreadsheetTypes = ["xls", "xlsx", "csv"]
  const presentationTypes = ["ppt", "pptx"]
  const archiveTypes = ["zip", "rar", "7z", "tar", "gz"]
  const codeTypes = ["js", "ts", "jsx", "tsx", "html", "css", "json", "xml", "py", "java", "cpp", "c"]

  if (imageTypes.includes(extension || "")) return "image"
  if (videoTypes.includes(extension || "")) return "video"
  if (audioTypes.includes(extension || "")) return "audio"
  if (documentTypes.includes(extension || "")) return "document"
  if (spreadsheetTypes.includes(extension || "")) return "spreadsheet"
  if (presentationTypes.includes(extension || "")) return "presentation"
  if (archiveTypes.includes(extension || "")) return "archive"
  if (codeTypes.includes(extension || "")) return "code"

  return "file"
}

export function isOfficeFile(filename: string): boolean {
  const extension = filename.split(".").pop()?.toLowerCase()
  return ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(extension || "")
}

export function canPreview(filename: string): boolean {
  const extension = filename.split(".").pop()?.toLowerCase()
  const previewableTypes = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "svg",
    "webp",
    "pdf",
    "txt",
    "mp4",
    "avi",
    "mov",
    "wmv",
    "flv",
    "webm",
    "mp3",
    "wav",
    "flac",
    "aac",
    "ogg",
  ]
  return previewableTypes.includes(extension || "")
}

export function getMimeTypeFromExtension(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    case 'pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    default:
      return 'application/octet-stream'
  }
}
