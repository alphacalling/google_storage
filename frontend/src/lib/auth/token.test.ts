import { describe, it, expect, beforeEach } from 'vitest'
import { extractUserEmailFromAuthHeader } from './token'

const graphAudience = '00000003-0000-0000-c000-000000000000'

function createToken(payload: Record<string, string>): string {
  const header = Buffer.from('{}').toString('base64')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64')
  return `${header}.${body}.`
}

beforeEach(() => {
  process.env.VITE_AZURE_AD_CLIENT_ID = 'client123'
  process.env.VITE_AZURE_AD_TENANT_ID = 'tenant123'
})

describe('extractUserEmailFromAuthHeader', () => {
  it('accepts token with AZURE_AD_CLIENT_ID audience', () => {
    const token = createToken({
      preferred_username: 'alice@example.com',
      tid: 'tenant123',
      aud: 'client123',
    })
    const email = extractUserEmailFromAuthHeader(`Bearer ${token}`)
    expect(email).toBe('alice@example.com')
  })

  it('accepts token with Microsoft Graph audience', () => {
    const token = createToken({
      preferred_username: 'bob@example.com',
      tid: 'tenant123',
      aud: graphAudience,
    })
    const email = extractUserEmailFromAuthHeader(`Bearer ${token}`)
    expect(email).toBe('bob@example.com')
  })

  it('accepts token with api://<clientId> audience', () => {
    const token = createToken({
      preferred_username: 'charlie@example.com',
      tid: 'tenant123',
      aud: `api://client123`,
    })
    const email = extractUserEmailFromAuthHeader(`Bearer ${token}`)
    expect(email).toBe('charlie@example.com')
  })

  it('rejects token with invalid audience', () => {
    const token = createToken({
      preferred_username: 'bob@example.com',
      tid: 'tenant123',
      aud: 'other-audience',
    })
    expect(() =>
      extractUserEmailFromAuthHeader(`Bearer ${token}`)
    ).toThrow('Token audience mismatch')
  })
})
