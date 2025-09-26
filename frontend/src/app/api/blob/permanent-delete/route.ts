import { type NextRequest, NextResponse } from "next/server"
import { BlobStorageService } from "@/lib/blob/storage"
import { handleBlobError } from "@/lib/blob/error"
import { extractUserEmailFromAuthHeader } from "@/lib/auth/token"

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileId } = await request.json()

    if (!fileId) {
      return NextResponse.json({ error: "File ID required" }, { status: 400 })
    }

    // Extract user email from token
    const userEmail = extractUserEmailFromAuthHeader(authHeader)

    // Create blob service with user email
    const blobService = new BlobStorageService(userEmail)
    await blobService.init()

    await blobService.permanentDelete(fileId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleBlobError(error, "Failed to permanently delete blob file")
  }
}
