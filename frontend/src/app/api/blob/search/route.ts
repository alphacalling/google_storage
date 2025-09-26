import { type NextRequest, NextResponse } from "next/server"
import { BlobStorageService } from "@/lib/blob/storage"
import { handleBlobError } from "@/lib/blob/error"
import { extractUserEmailFromAuthHeader } from "@/lib/auth/token"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const authHeader = request.headers.get("authorization")

    if (!query) {
      return NextResponse.json({ error: "Search query required" }, { status: 400 })
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userEmail = extractUserEmailFromAuthHeader(authHeader)
    const blobService = new BlobStorageService(userEmail)
    await blobService.init()

    const files = await blobService.searchFiles(query)

    return NextResponse.json({ files })
  } catch (error) {
    return handleBlobError(error, "Failed to search blob files")
  }
}
