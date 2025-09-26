import { Router } from "express";
import { BlobStorageService } from "../lib/blob/storage";
import { handleBlobError } from "../lib/blob/error";
import { extractUserEmailFromAuthHeader } from "../lib/auth/token";
import { devLog } from "../lib/utils/dev-log";
import { getMimeTypeFromExtension } from "../lib/utils/file-utils";

const router = Router();

// Create an empty file in blob storage
router.post("/create-file", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"] as string | undefined;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, path = "" } = req.body;
    if (!name) {
      return res.status(400).json({ error: "File name required" });
    }

    const userEmail = extractUserEmailFromAuthHeader(authHeader);
    const storage = new BlobStorageService(userEmail);
    await storage.init();

    const mime = getMimeTypeFromExtension(name);
    const file = new File([""], name, { type: mime });
    devLog(`📄 Creating empty file: ${name} at path: ${path}`);

    const created = await storage.uploadFile(file, path);
    res.json({ file: created });
  } catch (error) {
    handleBlobError(error, "Failed to create file in blob storage", res);
  }
});

export default router;
