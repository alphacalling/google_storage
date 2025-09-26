import { Router } from "express";
import { BlobStorageService } from "../lib/blob/storage";
import { handleBlobError } from "../lib/blob/error";
import { extractUserEmailFromAuthHeader } from "../lib/auth/token";
import { devLog } from "../lib/utils/dev-log";

const router = Router();

// POST /blob/move
router.post("/move", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"] as string | undefined;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { fileId, newParentId } = req.body;

    if (!fileId || !newParentId) {
      return res.status(400).json({ error: "File ID and new parent ID required" });
    }

    const userEmail = extractUserEmailFromAuthHeader(authHeader);
    const blobService = new BlobStorageService(userEmail);
    await blobService.init();

    devLog(`🚚 Moving blob ${fileId} to ${newParentId}`);
    const file = await blobService.moveBlob(fileId, newParentId);

    res.json({ file });
  } catch (error: any) {
    handleBlobError(error, "Failed to move blob", res);
  }
});

export default router;
