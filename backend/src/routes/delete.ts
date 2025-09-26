import { Router } from "express";
import { BlobStorageService } from "../lib/blob/storage";
import { handleBlobError } from "../lib/blob/error";
import { extractUserEmailFromAuthHeader } from "../lib/auth/token";
import { devLog } from "../lib/utils/dev-log";

const router = Router();

// Soft delete blob
router.delete("/delete", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"] as string | undefined;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { fileId } = req.body;
    if (!fileId) {
      return res.status(400).json({ error: "File ID required" });
    }

    const userEmail = extractUserEmailFromAuthHeader(authHeader);
    const blobService = new BlobStorageService(userEmail);
    await blobService.init();

    devLog(`🗑️ Soft deleting blob: ${fileId}`);
    await blobService.deleteFile(fileId);

    res.json({ success: true });
  } catch (error: any) {
    console.error(error.message);
    handleBlobError(error, "Failed to delete blob", res);
  }
});

export default router;
