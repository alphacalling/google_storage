import { NextRequest, NextResponse } from "next/server";
import { extractUserEmailFromAuthHeader } from "@/lib/auth/token";
import { BlobStorageService } from "@/lib/blob/storage";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer "))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userEmail = extractUserEmailFromAuthHeader(authHeader);
    if (!userEmail)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { fileId, expiryDays } = await request.json();
    if (!fileId)
      return NextResponse.json({ error: "File ID required" }, { status: 400 });

    const db = getDb();

    // ✅ Lookup using file UUID
    const [fileRows] = await db.query(
      `SELECT id FROM files WHERE id = ? AND owner_email = ? AND is_deleted = FALSE`,
      [fileId, userEmail]
    );

    if (!(fileRows as any[]).length)
      return NextResponse.json({ error: "File not found" }, { status: 404 });

    // Generate share link
    const service = new BlobStorageService(userEmail);
    await service.init();
    const shareUrl = await service.getShareLink(fileId, expiryDays);

    return NextResponse.json({ shareUrl, shareId: shareUrl.split("/").pop()! });
  } catch (err) {
    console.error("Error generating share link:", err);
    return NextResponse.json(
      { error: "Failed to generate share link" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer "))
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const userEmail = extractUserEmailFromAuthHeader(authHeader);
    if (!userEmail)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const db = getDb();
    const [rows] = await db.query(
      `SELECT * FROM share_links WHERE share_id = ?`,
      [params.shareId]
    );
    const shareLink = (rows as any[])[0];
    if (!shareLink)
      return NextResponse.json(
        { error: "Share link not found" },
        { status: 404 }
      );

    // Check expiry
    const now = new Date();
    if (shareLink.expiry < now)
      return NextResponse.json(
        { error: "Share link expired" },
        { status: 403 }
      );

    // Generate SAS
    const service = new BlobStorageService("shared-access");
    await service.init();
    const expiryDays = Math.ceil(
      (shareLink.expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const sasUrl = await service.getSharedFileSasUrl(
      shareLink.file_id,
      expiryDays
    );

    return NextResponse.json({
      fileId: shareLink.file_id,
      sasUrl,
      expiry: shareLink.expiry,
    });
  } catch (err) {
    console.error("GET share error:", err);
    return NextResponse.json(
      { error: "Failed to resolve share link" },
      { status: 500 }
    );
  }
}

// import { NextRequest, NextResponse } from "next/server";
// import { BlobStorageService } from "@/lib/blob/storage";
// import { extractUserEmailFromAuthHeader } from "@/lib/auth/token";

// export async function POST(request: NextRequest) {
//   try {
//     const authHeader = request.headers.get("authorization");
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const userEmail = extractUserEmailFromAuthHeader(authHeader);
//     const service = new BlobStorageService(userEmail);
//     await service.init();

//     const body = await request.json();
//     const { fileId, expiryDays } = body;

//     if (!fileId) {
//       return NextResponse.json({ error: "File ID required" }, { status: 400 });
//     }

//     // Use the storage service to generate the share link
//     const shareUrl = await service.getShareLink(fileId, expiryDays);
//     return NextResponse.json({ url: shareUrl });
//   } catch (error) {
//     console.error("Error generating share link:", error);
//     return NextResponse.json(
//       { error: "Failed to generate share link" },
//       { status: 500 }
//     );
//   }
// }
