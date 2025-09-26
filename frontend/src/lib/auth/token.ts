export function extractUserEmailFromAuthHeader(authHeader: string): string {
  if (!authHeader.startsWith("Bearer ")) {
    throw new Error("Invalid authorization header")
  }

  const token = authHeader.slice(7)
  const parts = token.split('.')
  if (parts.length < 2) {
    throw new Error("Invalid token format")
  }

  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8')) as {
    preferred_username?: string
    email?: string
    upn?: string
    tid?: string
    aud?: string
  }

  const tenantId = process.env.VITE_AZURE_AD_TENANT_ID
  const clientId = process.env.VITE_AZURE_AD_CLIENT_ID
  const graphAudience = '00000003-0000-0000-c000-000000000000'

  if (tenantId && payload.tid && payload.tid !== tenantId) {
    throw new Error('Token tenant mismatch')
  }

  if (clientId && payload.aud) {
    const allowedAudiences = [clientId, `api://${clientId}`, graphAudience]
    if (!allowedAudiences.includes(payload.aud)) {
      throw new Error('Token audience mismatch')
    }
  }

  const email = payload.preferred_username || payload.email || payload.upn
  if (!email) {
    throw new Error('Email claim not found in token')
  }

  return email
}
