import { Router } from "express";
import { BlobStorageService } from "../lib/blob/storage";
import { extractUserEmailFromAuthHeader } from "../lib/auth/token";
import { getDb } from "../lib/db";

const router = Router();

// Create share link
router.post("/share", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"] as string | undefined;
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });

    const userEmail = extractUserEmailFromAuthHeader(authHeader);
    if (!userEmail) return res.status(401).json({ error: "Invalid token" });

    const { fileId, expiryDays } = req.body;
    if (!fileId) return res.status(400).json({ error: "File ID required" });

    const db = getDb();
    const [fileRows] = await db.query(
      `SELECT id FROM files WHERE id = ? AND owner_email = ? AND is_deleted = FALSE`,
      [fileId, userEmail]
    );

    if (!(fileRows as any[]).length) return res.status(404).json({ error: "File not found" });

    const service = new BlobStorageService(userEmail);
    await service.init();
    const shareUrl = await service.getShareLink(fileId, expiryDays);

    res.json({ shareUrl, shareId: shareUrl.split("/").pop()! });
  } catch (err) {
    console.error("Error generating share link:", err);
    res.status(500).json({ error: "Failed to generate share link" });
  }
});

// Resolve share link
router.get("/share/:shareId", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"] as string | undefined;
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Sign in required" });

    const userEmail = extractUserEmailFromAuthHeader(authHeader);
    if (!userEmail) return res.status(401).json({ error: "Invalid token" });

    const { shareId } = req.params;
    const db = getDb();
    const [rows] = await db.query(`SELECT * FROM share_links WHERE share_id = ?`, [shareId]);
    const shareLink = (rows as any[])[0];

    if (!shareLink) return res.status(404).json({ error: "Share link not found" });

    const now = new Date();
    if (shareLink.expiry < now) return res.status(403).json({ error: "Share link expired" });

    const service = new BlobStorageService("shared-access");
    await service.init();

    const expiryDays = Math.ceil((shareLink.expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const sasUrl = await service.getSharedFileSasUrl(shareLink.file_id, expiryDays);

    res.json({ fileId: shareLink.file_id, sasUrl, expiry: shareLink.expiry });
  } catch (err) {
    console.error("Error resolving share link:", err);
    res.status(500).json({ error: "Failed to resolve share link" });
  }
});

export default router;
