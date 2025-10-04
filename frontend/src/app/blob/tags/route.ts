import { devLog } from '@/lib/utils/dev-log'
import { type NextRequest, NextResponse } from "next/server"
import { BlobStorageService } from "@/lib/blob/storage"
import { handleBlobError } from "@/lib/blob/error"
import { extractUserEmailFromAuthHeader } from "@/lib/auth/token"

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileId, tags } = await request.json()

    if (!fileId) {
      return NextResponse.json({ error: "File ID required" }, { status: 400 })
    }

    const userEmail = extractUserEmailFromAuthHeader(authHeader)
    const blobService = new BlobStorageService(userEmail)
    await blobService.init()

    devLog(`🏷️ Updating tags for blob: ${fileId}`, tags)

    await blobService.updateTags(fileId, tags || [])

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleBlobError(error, "Failed to update blob tags")
  }
}
