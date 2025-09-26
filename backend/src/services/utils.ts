import { IncomingMessage } from 'http'
import Busboy from 'busboy'

export async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks).toString()
}

export async function parseMultipart(req: IncomingMessage): Promise<{ fields: Record<string, string>; file: File | null }> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers })
    const fields: Record<string, string> = {}
    const chunks: Buffer[] = []
    let fileName = ''
    let fileType = ''

    busboy.on('file', (_name, stream, info) => {
      fileName = info.filename
      fileType = info.mimeType
      stream.on('data', (d) => chunks.push(d as Buffer))
    })

    busboy.on('field', (name, val) => {
      fields[name] = val
    })

    busboy.on('finish', () => {
      const file = fileName ? new File([Buffer.concat(chunks)], fileName, { type: fileType }) : null
      resolve({ fields, file })
    })
    busboy.on('error', reject)
    req.pipe(busboy)
  })
}
