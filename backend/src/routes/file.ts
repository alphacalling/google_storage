import { Router } from "express";
import { BlobStorageService } from "../lib/blob/storage";
import { handleBlobError } from "../lib/blob/error";
import { extractUserEmailFromAuthHeader } from "../lib/auth/token";
import { devLog } from "../lib/utils/dev-log";
import { parseMultipart } from "../utils/utils";

const router = Router();

// List files in a folder
router.get("/", async (req, res) => {
  try {
    const pathParam = (req.query.path as string) || "";
    const authHeader = req.headers["authorization"] as string | undefined;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userEmail = extractUserEmailFromAuthHeader(authHeader);
    const blobService = new BlobStorageService(userEmail);
    await blobService.init();

    const files = await blobService.listFiles(pathParam);

    res.json({ files });
  } catch (error: any) {
    handleBlobError(error, "Failed to fetch blob files", res);
  }
});

// Upload a file
router.post("/upload", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"] as string | undefined;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userEmail = extractUserEmailFromAuthHeader(authHeader);
    const blobService = new BlobStorageService(userEmail);
    await blobService.init();

    // Parse multipart/form-data
    const { fields, file } = await parseMultipart(req);
    const pathParam = fields["path"] || "";

    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    devLog(`📤 Uploading file: ${file.name} to path: ${pathParam}`);
    const uploadedFile = await blobService.uploadFile(file, pathParam);

    res.json({ file: uploadedFile });
  } catch (error: any) {
    handleBlobError(error, "Failed to upload file to blob storage", res);
  }
});

export default router;
