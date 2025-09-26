import { Router } from "express";
import { BlobStorageService } from "../lib/blob/storage";
import { handleBlobError } from "../lib/blob/error";
import { extractUserEmailFromAuthHeader } from "../lib/auth/token";

const router = Router();

// Search files
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q as string;
    const authHeader = req.headers["authorization"] as string | undefined;

    if (!query) return res.status(400).json({ error: "Search query required" });
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });

    const userEmail = extractUserEmailFromAuthHeader(authHeader);
    const blobService = new BlobStorageService(userEmail);
    await blobService.init();

    const files = await blobService.searchFiles(query);
    res.json({ files });
  } catch (error) {
    handleBlobError(error, "Failed to search blob files", res);
  }
});

export default router;
