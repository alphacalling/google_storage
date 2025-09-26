import { NextResponse } from "next/server";
import * as jose from "jose";
import { getDb } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json(
        { ok: false, error: "Missing idToken" },
        { status: 400 }
      );
    }

    const tenantId = process.env.VITE_AZURE_AD_CLIENT_ID!;
    const clientId = process.env.VITE_AZURE_AD_TENANT_ID!;
    const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;
    const jwksUrl = `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`;

    // 1. Verify token
    const resp = await fetch(jwksUrl);
    if (!resp.ok) {
      throw new Error(`Failed to fetch JWKS: ${resp.statusText}`);
    }
    const jwksJson = await resp.json();
    const localJwks = jose.createLocalJWKSet(jwksJson);

    const { payload } = await jose.jwtVerify(idToken, localJwks, {
      issuer,
      audience: clientId,
    });

    // 2. Extract claims
    const msalId = payload.oid as string;
    const email =
      (payload.email as string) ||
      (payload.preferred_username as string) ||
      null;
    const fullName =
      (payload.name as string) ||
      (payload.unique_name as string) ||
      "User";

    if (!msalId || !email) {
      return NextResponse.json(
        { ok: false, error: "Token missing oid/email" },
        { status: 400 }
      );
    }

    // 3. Insert or update DB
    const db = getDb();
    await db.query(
      `INSERT INTO users (msal_id, email, full_name, created_at, last_login_at)
       VALUES (?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE 
         email = VALUES(email),
         full_name = VALUES(full_name),
         last_login_at = NOW()`,
      [msalId, email, fullName]
    );

    return NextResponse.json({
      ok: true,
      user: { msalId, email, fullName },
    });
  } catch (err: any) {
    console.error("❌ Error in POST /user:", err);
    return NextResponse.json(
      { ok: false, error: err.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
