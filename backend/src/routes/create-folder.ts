import { Router } from "express";
import { BlobStorageService } from "../lib/blob/storage";
import { handleBlobError } from "../lib/blob/error";
import { extractUserEmailFromAuthHeader } from "../lib/auth/token";
import { devLog } from "../lib/utils/dev-log";

const router = Router();

// Create folder endpoint
router.put("/create-folder", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"] as string | undefined;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { fileId } = req.body;
    if (!fileId) {
      return res.status(400).json({ error: "Folder ID required" });
    }

    const userEmail = extractUserEmailFromAuthHeader(authHeader);
    const blobService = new BlobStorageService(userEmail);
    await blobService.init();

    devLog(`📁 Creating folder: ${fileId}`);
    const folder = await blobService.createFolder(fileId);

    res.json({ folder });
  } catch (error) {
    handleBlobError(error, "Failed to create folder in blob storage", res);
  }
});

export default router;
