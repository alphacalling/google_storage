import { Router } from "express";
import { BlobStorageService } from "../lib/blob/storage";
import { handleBlobError } from "../lib/blob/error";
import { extractUserEmailFromAuthHeader } from "../lib/auth/token";

const router = Router();

// DELETE /blob/permanent
router.delete("/permanent", async (req, res) => {
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

    await blobService.permanentDelete(fileId);

    res.json({ success: true });
  } catch (error: any) {
    handleBlobError(error, "Failed to permanently delete blob file", res);
  }
});

export default router;
