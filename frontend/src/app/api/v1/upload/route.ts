import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { id, name, type, mimeType, size, ownerEmail, storagePath, parentId } =
      await req.json();

    if (!id || !name || !ownerEmail || !storagePath) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = getDb();

    await db.query(
      `INSERT INTO files 
        (id, name, type, mime_type, size, owner_email, storage_provider, storage_path, parent_id, created_at, modified_at)
       VALUES (?, ?, ?, ?, ?, ?, 'blob', ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE 
         name = VALUES(name),
         mime_type = VALUES(mime_type),
         size = VALUES(size),
         owner_email = VALUES(owner_email),
         storage_path = VALUES(storage_path),
         parent_id = VALUES(parent_id),
         modified_at = NOW()`,
      [id, name, type, mimeType, size, ownerEmail, storagePath, parentId || null]
    );

    return NextResponse.json({
      ok: true,
      file: { id, name, type, mimeType, size, ownerEmail, storagePath, parentId },
    });
  } catch (err: any) {
    console.error("❌ Error inserting file into DB:", err);
    return NextResponse.json(
      { ok: false, error: err.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
