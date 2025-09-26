import { type NextRequest, NextResponse } from "next/server"
import { BlobStorageService } from "@/lib/blob/storage"
import { handleBlobError } from "@/lib/blob/error"
import { extractUserEmailFromAuthHeader } from "@/lib/auth/token"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Extract user email from token
    const userEmail = extractUserEmailFromAuthHeader(authHeader)

    // Create blob service with user email
    const blobService = new BlobStorageService(userEmail)
    await blobService.init()

    const deletedFiles = await blobService.getRecycleBin()

    return NextResponse.json(deletedFiles)
  } catch (error) {
    return handleBlobError(error, "Failed to get blob recycle bin")
  }
}
