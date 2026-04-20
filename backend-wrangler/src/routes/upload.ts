import { Hono } from 'hono'
import type { Env } from '../index'

export const uploadRouter = new Hono<{ Bindings: Env }>()

// 上传乐谱文件到 R2
uploadRouter.post('/score', async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file') as File
  
  if (!file) {
    return c.json({ error: 'No file provided' }, 400)
  }
  
  const id = crypto.randomUUID()
  const ext = file.name.split('.').pop()
  const key = `scores/${id}.${ext}`
  
  await c.env.UPLOADS.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type || 'application/pdf',
    },
  })
  
  // 获取文件 URL
  const fileUrl = `https://pub-${c.env.UPLOADS.id}.r2.dev/${key}`
  
  return c.json({
    id,
    fileUrl,
    fileName: file.name,
    fileType: ext?.toLowerCase() === 'pdf' ? 'pdf' : 'musicxml',
    size: file.size,
  })
})

// 上传音频文件到 R2
uploadRouter.post('/audio', async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file') as File
  
  if (!file) {
    return c.json({ error: 'No file provided' }, 400)
  }
  
  const id = crypto.randomUUID()
  const ext = file.name.split('.').pop()
  const key = `audio/${id}.${ext}`
  
  await c.env.UPLOADS.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type || 'audio/mpeg',
    },
  })
  
  const fileUrl = `https://pub-${c.env.UPLOADS.id}.r2.dev/${key}`
  
  return c.json({
    id,
    fileUrl,
    fileName: file.name,
    size: file.size,
  })
})

// 获取上传文件
uploadRouter.get('/:key', async (c) => {
  const key = c.req.param('key')
  const object = await c.env.UPLOADS.get(key)
  
  if (!object) {
    return c.json({ error: 'File not found' }, 404)
  }
  
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  
  return new Response(object.body, { headers })
})
