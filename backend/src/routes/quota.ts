import { Router } from "express";
import { BlobStorageService } from "../lib/blob/storage";
import { handleBlobError } from "../lib/blob/error";
import { extractUserEmailFromAuthHeader } from "../lib/auth/token";

const router = Router();

// GET /blob/quota
router.get("/quota", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"] as string | undefined;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userEmail = extractUserEmailFromAuthHeader(authHeader);
    const blobService = new BlobStorageService(userEmail);
    await blobService.init();

    const quota = await blobService.getQuota();

    res.json(quota);
  } catch (error: any) {
    handleBlobError(error, "Failed to get blob quota", res);
  }
});

export default router;
