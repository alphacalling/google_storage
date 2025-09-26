import { devLog } from '@/lib/utils/dev-log'
import { type NextRequest, NextResponse } from "next/server"
import { BlobStorageService } from "@/lib/blob/storage"
import { handleBlobError } from "@/lib/blob/error"
import { extractUserEmailFromAuthHeader } from "@/lib/auth/token"

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileId } = await request.json()

    if (!fileId) {
      return NextResponse.json({ error: "File ID required" }, { status: 400 })
    }

    const userEmail = extractUserEmailFromAuthHeader(authHeader)
    const blobService = new BlobStorageService(userEmail)
    await blobService.init()

    devLog(`📁 Creating folder: ${fileId}`)

    const folder = await blobService.createFolder(fileId)

    return NextResponse.json({ folder })
  } catch (error) {
    return handleBlobError(error, "Failed to create folder in blob storage")
  }
}
