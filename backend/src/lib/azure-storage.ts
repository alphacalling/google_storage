import { Buffer } from "buffer"

const AZURE_ACCOUNT_NAME = process.env.AZURE_ACCOUNT_NAME || process.env.AZURE_STORAGE_ACCOUNT_NAME || ""
const AZURE_ACCOUNT_KEY = process.env.AZURE_ACCOUNT_KEY || ""

function containerNameForUser(email: string): string {
  return email.replace(/[^a-zA-Z0-9]/g, "_")
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  return Buffer.from(base64, "base64").buffer
}

function bufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64")
}

async function signWithAccountKey(stringToSign: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    base64ToArrayBuffer(AZURE_ACCOUNT_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(stringToSign))
  return bufferToBase64(sig)
}

function buildCanonicalHeaders(headers: Record<string, string | number>): string {
  const lines = Object.keys(headers)
    .filter((k) => k.toLowerCase().startsWith("x-ms-"))
    .sort((a, b) => a.localeCompare(b))
    .map((k) => `${k.toLowerCase()}:${headers[k]}`)
  return lines.length ? lines.join("\n") + "\n" : ""
}

function buildStringToSign(
  method: string,
  options: {
    contentLength?: number | string
    contentType?: string
    canonicalHeaders?: string
    canonicalResource?: string
  } = {},
) {
  const { contentLength = "", contentType = "", canonicalHeaders = "", canonicalResource = "" } = options
  const parts = [method.toUpperCase(), "", "", String(contentLength), "", contentType, "", "", "", "", ""]
  let str = parts.join("\n") + "\n"
  str += canonicalHeaders
  str += canonicalResource
  return str
}

function validateAzureConfig() {
  if (!AZURE_ACCOUNT_NAME || !AZURE_ACCOUNT_KEY) {
    throw new Error(
      `Azure storage environment variables are missing. Account Name: ${!!AZURE_ACCOUNT_NAME}, Account Key: ${!!AZURE_ACCOUNT_KEY}`,
    )
  }
}

export async function azureUpload(content: any, filename: string, userEmail: string): Promise<void> {
  validateAzureConfig()
  const container = containerNameForUser(userEmail)
  const body = typeof content === "string" ? content : JSON.stringify(content)

  const encoded = encodeURIComponent(filename).replace(/%2F/g, "/")
  const url = `https://${AZURE_ACCOUNT_NAME}.blob.core.windows.net/${container}/${encoded}`
  const date = new Date().toUTCString()
  const contentLength = new TextEncoder().encode(body).length
  const contentType = "application/json"
  const headers: Record<string, any> = {
    "x-ms-blob-type": "BlockBlob",
    "x-ms-date": date,
    "x-ms-version": "2021-08-06",
    "Content-Type": contentType,
    "Content-Length": contentLength,
  }
  const canonicalHeaders = buildCanonicalHeaders(headers)
  const canonicalResource = `/${AZURE_ACCOUNT_NAME}/${container}/${encoded}`
  const stringToSign = buildStringToSign("PUT", { contentLength, contentType, canonicalHeaders, canonicalResource })
  const signature = await signWithAccountKey(stringToSign)
  headers.Authorization = `SharedKey ${AZURE_ACCOUNT_NAME}:${signature}`

  const res = await fetch(url, { method: "PUT", headers, body })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 100)}`)
  }
}

export async function azureDownload(filename: string, userEmail: string): Promise<Response> {
  validateAzureConfig()
  const container = containerNameForUser(userEmail)
  const encoded = encodeURIComponent(filename).replace(/%2F/g, "/")
  const url = `https://${AZURE_ACCOUNT_NAME}.blob.core.windows.net/${container}/${encoded}`
  const date = new Date().toUTCString()
  const headers: Record<string, any> = {
    "x-ms-date": date,
    "x-ms-version": "2021-08-06",
  }
  const canonicalHeaders = buildCanonicalHeaders(headers)
  const canonicalResource = `/${AZURE_ACCOUNT_NAME}/${container}/${encoded}`
  const stringToSign = buildStringToSign("GET", { canonicalHeaders, canonicalResource })
  const signature = await signWithAccountKey(stringToSign)
  headers.Authorization = `SharedKey ${AZURE_ACCOUNT_NAME}:${signature}`

  const res = await fetch(url, { method: "GET", headers })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 100)}`)
  }
  return res
}

export async function azureDelete(filename: string, userEmail: string): Promise<void> {
  validateAzureConfig()
  const container = containerNameForUser(userEmail)
  const encoded = encodeURIComponent(filename).replace(/%2F/g, "/")
  const url = `https://${AZURE_ACCOUNT_NAME}.blob.core.windows.net/${container}/${encoded}`
  const date = new Date().toUTCString()
  const headers: Record<string, any> = {
    "x-ms-date": date,
    "x-ms-version": "2021-08-06",
  }
  const canonicalHeaders = buildCanonicalHeaders(headers)
  const canonicalResource = `/${AZURE_ACCOUNT_NAME}/${container}/${encoded}`
  const stringToSign = buildStringToSign("DELETE", { canonicalHeaders, canonicalResource })
  const signature = await signWithAccountKey(stringToSign)
  headers.Authorization = `SharedKey ${AZURE_ACCOUNT_NAME}:${signature}`

  const res = await fetch(url, { method: "DELETE", headers })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 100)}`)
  }
}

export async function azureList(prefix = "", userEmail: string): Promise<any> {
  validateAzureConfig()
  const container = containerNameForUser(userEmail)
  const params = prefix
    ? `?restype=container&comp=list&prefix=${encodeURIComponent(prefix)}`
    : "?restype=container&comp=list"
  const url = `https://${AZURE_ACCOUNT_NAME}.blob.core.windows.net/${container}${params}`
  const date = new Date().toUTCString()
  const headers: Record<string, any> = {
    "x-ms-date": date,
    "x-ms-version": "2021-08-06",
  }
  const canonicalHeaders = buildCanonicalHeaders(headers)
  const canonicalResource = `/${AZURE_ACCOUNT_NAME}/${container}\ncomp:list\nrestype:container${prefix ? `\nprefix:${prefix}` : ""}`
  const stringToSign = buildStringToSign("GET", { canonicalHeaders, canonicalResource })
  const signature = await signWithAccountKey(stringToSign)
  headers.Authorization = `SharedKey ${AZURE_ACCOUNT_NAME}:${signature}`

  const res = await fetch(url, { method: "GET", headers })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 100)}`)
  }
  return await res.text()
}
