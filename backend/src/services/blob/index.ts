import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { config as loadEnv } from "dotenv";
import { BlobStorageService } from "../../lib/blob/storage";
import { extractUserEmailFromAuthHeader } from "../../lib/auth/token";
import { readBody, parseMultipart } from "../utils";

// Setup dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
loadEnv({ path: path.resolve(__dirname, "../../.env"), override: false });

const app = express();
app.use(cors());
app.use(express.json()); // parses JSON body
app.use(express.urlencoded({ extended: true }));

// Middleware for service injection
function requireService(req, res, next) {
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userEmail = extractUserEmailFromAuthHeader(auth);
  req.service = new BlobStorageService(userEmail);
  req.service.init().then(() => next()).catch(next);
}

// Health check
app.get("/", (req, res) => res.send("Blob service"));

// List files
app.get("/files", requireService, async (req, res, next) => {
  try {
    const prefix = req.query.path || "";
    const files = await req.service.listFiles(prefix);
    res.json({ files });
  } catch (err) { next(err); }
});

// Upload (multipart)
app.post("/files", requireService, async (req, res, next) => {
  try {
    const { fields, file } = await parseMultipart(req);
    if (!file) return res.status(400).json({ error: "No file provided" });
    const uploaded = await req.service.uploadFile(file, fields["path"] || "");
    res.json({ file: uploaded });
  } catch (err) { next(err); }
});

// Quota
app.get("/quota", requireService, async (req, res, next) => {
  try {
    const quota = await req.service.getQuota();
    res.json(quota);
  } catch (err) { next(err); }
});

// Create folder
app.post("/create-folder", requireService, async (req, res, next) => {
  try {
    await req.service.createFolder(req.body.fileId);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Copy
app.post("/copy", requireService, async (req, res, next) => {
  try {
    const { fileId, newParentId } = req.body;
    const file = await req.service.copyBlob(fileId, newParentId);
    res.json({ file });
  } catch (err) { next(err); }
});

// Delete (soft)
app.delete("/delete", requireService, async (req, res, next) => {
  try {
    await req.service.deleteFile(req.body.fileId);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Delete (permanent)
app.delete("/permanent-delete", requireService, async (req, res, next) => {
  try {
    await req.service.permanentDelete(req.body.fileId);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Share link
app.post("/share", requireService, async (req, res, next) => {
  try {
    const { fileId, expiryDays = 7 } = req.body;
    if (!fileId) return res.status(400).json({ error: "File ID required" });
    const url = await req.service.getShareLink(fileId, expiryDays);
    res.json({ url });
  } catch (err) { next(err); }
});

// Move
app.post("/move", requireService, async (req, res, next) => {
  try {
    const { fileId, newParentId } = req.body;
    const file = await req.service.moveBlob(fileId, newParentId);
    res.json({ file });
  } catch (err) { next(err); }
});

// Rename
app.patch("/rename", requireService, async (req, res, next) => {
  try {
    const { fileId, newName } = req.body;
    const file = await req.service.renameBlob(fileId, newName);
    res.json({ file });
  } catch (err) { next(err); }
});

// Restore
app.post("/restore", requireService, async (req, res, next) => {
  try {
    const { fileId } = req.body;
    const path = fileId.split("/").slice(1).join("/");
    const file = await req.service.restoreBlob(path);
    res.json({ success: true, file, source: "blob" });
  } catch (err) { next(err); }
});

// Download
app.get("/download", requireService, async (req, res, next) => {
  try {
    const { buffer, contentType, fileName } = await req.service.downloadFile(req.query.path);
    res.setHeader("Content-Type", contentType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (err) { next(err); }
});

// Create file (empty file)
app.post("/create-file", requireService, async (req, res, next) => {
  try {
    const { name, path: p = "" } = req.body;
    const mime = "application/octet-stream";
    const f = new File([""], name, { type: mime });
    const created = await req.service.uploadFile(f, p);
    res.json({ file: created });
  } catch (err) { next(err); }
});

// Search
app.get("/search", requireService, async (req, res, next) => {
  try {
    const files = await req.service.searchFiles(req.query.q);
    res.json({ files });
  } catch (err) { next(err); }
});

// Update tags
app.patch("/tags", requireService, async (req, res, next) => {
  try {
    const { fileId, tags } = req.body;
    await req.service.updateTags(fileId, tags || []);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Recycle bin
app.get("/recycle", requireService, async (req, res, next) => {
  try {
    const files = await req.service.getRecycleBin();
    res.json(files);
  } catch (err) { next(err); }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal error" });
});

export function start(port = 3002) {
  app.listen(port, () => {
    console.log(`Blob service listening on ${port}`);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  start(Number(process.env.PORT) || 3002);
}


// import { createServer } from "http";
// import { parse } from "url";
// import path from "path";
// import { fileURLToPath } from "url";
// import { config as loadEnv } from "dotenv";
// import { BlobStorageService } from "../../lib/blob/storage";
// import { extractUserEmailFromAuthHeader } from "../../lib/auth/token";
// import { readBody, parseMultipart } from "../utils";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Load environment variables from .env.local if present
// // loadEnv({ path: path.resolve(__dirname, "../../.env.local"), override: false });

// // Fall back to .env
// loadEnv({ path: path.resolve(__dirname, "../../.env"), override: false });
// console.log(
//   loadEnv({ path: path.resolve(__dirname, "../../.env"), override: false })
// );

// function getService(req: any, res: any): BlobStorageService | null {
//   const auth = req.headers["authorization"] as string | undefined;
//   if (!auth || !auth.startsWith("Bearer ")) {
//     res.writeHead(401);
//     res.end(JSON.stringify({ error: "Unauthorized" }));
//     return null;
//   }
//   const userEmail = extractUserEmailFromAuthHeader(auth);
//   const service = new BlobStorageService(userEmail);
//   return service;
// }

// async function handler(req: any, res: any) {
//   const { pathname, query } = parse(req.url || "", true);
//   console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`, query);
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET,POST,DELETE,PUT,PATCH,OPTIONS"
//   );
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   console.log("CORS headers set for Blob service request");

//   if (req.method === "OPTIONS") {
//     res.writeHead(204);
//     res.end();
//     return;
//   }
//   if (pathname === "/" && req.method === "GET") {
//     res.writeHead(200, { "Content-Type": "text/plain" });
//     res.end("Blob service");
//     return;
//   }

//   try {
//     if (pathname === "/files" && req.method === "GET") {
//       const service = getService(req, res);
//       if (!service) return;
//       await service.init();
//       const prefix = (query.path as string) || "";
//       const files = await service.listFiles(prefix);
//       res.writeHead(200, { "Content-Type": "application/json" });
//       res.end(JSON.stringify({ files }));
//       return;
//     }

//     if (pathname === "/files" && req.method === "POST") {
//       const service = getService(req, res);
//       if (!service) return;
//       await service.init();
//       const { fields, file } = await parseMultipart(req);
//       if (!file) {
//         res.writeHead(400);
//         res.end(JSON.stringify({ error: "No file provided" }));
//         return;
//       }
//       const uploaded = await service.uploadFile(file, fields["path"] || "");
//       res.writeHead(200, { "Content-Type": "application/json" });
//       res.end(JSON.stringify({ file: uploaded }));
//       return;
//     }

//     if (pathname === "/quota" && req.method === "GET") {
//       const service = getService(req, res);
//       if (!service) return;
//       await service.init();
//       const quota = await service.getQuota();
//       res.writeHead(200, { "Content-Type": "application/json" });
//       res.end(JSON.stringify(quota));
//       return;
//     }

//     if (pathname === "/create-folder" && req.method === "POST") {
//       const service = getService(req, res);
//       if (!service) return;
//       await service.init();
//       const body = JSON.parse(await readBody(req));
//       await service.createFolder(body.fileId);
//       res.writeHead(200, { "Content-Type": "application/json" });
//       res.end(JSON.stringify({ success: true }));
//       return;
//     }

//     if (pathname === "/copy" && req.method === "POST") {
//       const service = getService(req, res);
//       if (!service) return;
//       await service.init();
//       const body = JSON.parse(await readBody(req));
//       const { fileId, newParentId } = body;
//       const file = await service.copyBlob(fileId, newParentId);
//       res.writeHead(200, { "Content-Type": "application/json" });
//       res.end(JSON.stringify({ file }));
//       return;
//     }

//     // if (pathname === "/delete" && req.method === "DELETE") {
//     //   const service = getService(req, res);
//     //   if (!service) return;
//     //   await service.init();
//     //   const body = JSON.parse(await readBody(req));
//     //   // Support folder deletion
//     //   if (body.type === "folder") {
//     //     await service.deleteFolder(body.fileId);
//     //   } else {
//     //     await service.deleteFile(body.fileId);
//     //   }
//     //   res.writeHead(200, { "Content-Type": "application/json" });
//     //   res.end(JSON.stringify({ success: true }));
//     //   return;
//     // }

//     if (pathname === "/delete" && req.method === "DELETE") {
//       const service = getService(req, res);
//       if (!service) return;
//       await service.init();
//       const body = JSON.parse(await readBody(req));
//       await service.deleteFile(body.fileId);
//       res.writeHead(200, { "Content-Type": "application/json" });
//       res.end(JSON.stringify({ success: true }));
//       return;
//     }

//     if (pathname === "/permanent-delete" && req.method === "DELETE") {
//       const service = getService(req, res);
//       if (!service) return;
//       await service.init();
//       const body = JSON.parse(await readBody(req));
//       await service.permanentDelete(body.fileId);
//       res.writeHead(200, { "Content-Type": "application/json" });
//       res.end(JSON.stringify({ success: true }));
//       return;
//     }

//     // new
//     if (pathname === "/share" && req.method === "POST") {
//       const service = getService(req, res);
//       if (!service) return;
//       await service.init();
//       const body = JSON.parse(await readBody(req));
//       const { fileId, expiryDays } = body;
//       if (!fileId) {
//         res.writeHead(400, { "Content-Type": "application/json" });
//         res.end(JSON.stringify({ error: "File ID required" }));
//         return;
//       }
//       const url = await service.getShareLink(fileId, expiryDays ?? 7);
//       res.writeHead(200, { "Content-Type": "application/json" });
//       res.end(JSON.stringify({ url }));
//       return;
//     }

//     if (pathname === "/move" && req.method === "POST") {
//       const service = getService(req, res);
//       if (!service) return;
//       await service.init();
//       const body = JSON.parse(await readBody(req));
//       const { fileId, newParentId } = body;
//       const file = await service.moveBlob(fileId, newParentId);
//       res.writeHead(200, { "Content-Type": "application/json" });
//       res.end(JSON.stringify({ file }));
//       return;
//     }

//     if (pathname === "/rename" && req.method === "PATCH") {
//       const service = getService(req, res);
//       if (!service) return;
//       await service.init();
//       const { fileId, newName } = JSON.parse(await readBody(req));
//       const file = await service.renameBlob(fileId, newName);
//       res.writeHead(200, { "Content-Type": "application/json" });
//       res.end(JSON.stringify({ file }));
//       return;
//     }

//     if (pathname === "/restore" && req.method === "POST") {
//       const service = getService(req, res);
//       if (!service) return;
//       await service.init();
//       const { fileId } = JSON.parse(await readBody(req));
//       const path = fileId.split("/").slice(1).join("/");
//       const file = await service.restoreBlob(path);
//       res.writeHead(200, { "Content-Type": "application/json" });
//       res.end(JSON.stringify({ success: true, file, source: "blob" }));
//       return;
//     }

//     if (pathname === "/download" && req.method === "GET") {
//       const service = getService(req, res);
//       if (!service) return;
//       await service.init();
//       const pathParam = query.path as string;
//       const { buffer, contentType, fileName } = await service.downloadFile(
//         pathParam
//       );
//       res.writeHead(200, {
//         "Content-Type": contentType || "application/octet-stream",
//         "Content-Disposition": `attachment; filename="${fileName}"`,
//       });
//       res.end(buffer);
//       return;
//     }

//     if (pathname === "/upload" && req.method === "POST") {
//       const service = getService(req, res);
//       if (!service) return;
//       await service.init();
//       const { fields, file } = await parseMultipart(req);
//       if (!file) {
//         res.writeHead(400);
//         res.end(JSON.stringify({ error: "No file provided" }));
//         return;
//       }
//       const uploaded = await service.uploadFile(file, fields["path"] || "");
//       res.writeHead(200, { "Content-Type": "application/json" });
//       res.end(JSON.stringify({ file: uploaded }));
//       return;
//     }

//     if (pathname === "/create-file" && req.method === "POST") {
//       const service = getService(req, res);
//       if (!service) return;
//       await service.init();
//       const { name, path: p = "" } = JSON.parse(await readBody(req));
//       const mime = "application/octet-stream";
//       const f = new File([""], name, { type: mime });
//       const created = await service.uploadFile(f, p);
//       res.writeHead(200, { "Content-Type": "application/json" });
//       res.end(JSON.stringify({ file: created }));
//       return;
//     }

//     if (pathname === "/search" && req.method === "GET") {
//       const service = getService(req, res);
//       if (!service) return;
//       await service.init();
//       const q = query.q as string;
//       const files = await service.searchFiles(q);
//       res.writeHead(200, { "Content-Type": "application/json" });
//       res.end(JSON.stringify({ files }));
//       return;
//     }

//     if (pathname === "/tags" && req.method === "PATCH") {
//       const service = getService(req, res);
//       if (!service) return;
//       await service.init();
//       const { fileId, tags } = JSON.parse(await readBody(req));
//       await service.updateTags(fileId, tags || []);
//       res.writeHead(200, { "Content-Type": "application/json" });
//       res.end(JSON.stringify({ success: true }));
//       return;
//     }

//     if (pathname === "/recycle" && req.method === "GET") {
//       const service = getService(req, res);
//       if (!service) return;
//       await service.init();
//       const files = await service.getRecycleBin();
//       res.writeHead(200, { "Content-Type": "application/json" });
//       res.end(JSON.stringify(files));
//       return;
//     }
//   } catch (err) {
//     console.error(err);
//     res.writeHead(500);
//     res.end(JSON.stringify({ error: "Internal error" }));
//     return;
//   }
//   res.writeHead(404);
//   res.end("Not found");
// }

// export function start(port = 3002) {
//   const server = createServer((req, res) => {
//     handler(req, res).catch((e) => {
//       console.error(e);
//       res.writeHead(500);
//       res.end("Internal error");
//     });
//   });
//   server.listen(port, () => {
//     console.log(`Blob service listening on ${port}`);
//   });
// }

// if (require.main === module) {
//   start(Number(process.env.PORT) || 3002);
// }
