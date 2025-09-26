import { devLog } from '@/lib/utils/dev-log'
import { type NextRequest, NextResponse } from "next/server"
import { BlobStorageService } from "@/lib/blob/storage"
import { handleBlobError } from "@/lib/blob/error"
import { extractUserEmailFromAuthHeader } from "@/lib/auth/token"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userEmail = extractUserEmailFromAuthHeader(authHeader)
    const blobService = new BlobStorageService(userEmail)
    await blobService.init()

    const formData = await request.formData()
    const file = formData.get("file") as File
    const path = (formData.get("path") as string) || ""

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    devLog(`📤 Uploading file: ${file.name} to path: ${path}`)

    const uploadedFile = await blobService.uploadFile(file, path)

    return NextResponse.json({ file: uploadedFile })
  } catch (error) {
    return handleBlobError(error, "Failed to upload file to blob storage")
  }
}
