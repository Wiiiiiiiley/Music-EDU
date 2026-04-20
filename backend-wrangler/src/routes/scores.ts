import { Hono } from 'hono'

export const scoresRouter = new Hono()

// 获取所有乐谱
scoresRouter.get('/', async (c) => {
  const ensembleId = c.req.query('ensembleId')
  const env = c.env as any
  
  let query = 'SELECT * FROM Score'
  if (ensembleId) {
    query += ' WHERE ensembleId = ? ORDER BY createdAt DESC'
    const { results } = await env.DB.prepare(query).bind(ensembleId).all()
    return c.json(results)
  }
  
  const { results } = await env.DB.prepare(query + ' ORDER BY createdAt DESC').all()
  return c.json(results)
})

// 创建乐谱
scoresRouter.post('/', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const env = c.env as any
  
  await env.DB.prepare(
    'INSERT INTO Score (id, title, composer, fileUrl, fileType, audioUrl, ensembleId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))'
  ).bind(id, body.title, body.composer || null, body.fileUrl, body.fileType, body.audioUrl || null, body.ensembleId).run()
  
  return c.json({ id, ...body }, 201)
})

// 获取乐谱详情
scoresRouter.get('/:id', async (c) => {
  const id = c.req.param('id')
  const env = c.env as any
  
  const score = await env.DB.prepare(
    'SELECT * FROM Score WHERE id = ?'
  ).bind(id).first()
  
  if (!score) {
    return c.json({ error: 'Score not found' }, 404)
  }
  
  // 获取小节
  const { results: measures } = await env.DB.prepare(
    'SELECT * FROM Measure WHERE scoreId = ? ORDER BY number'
  ).bind(id).all()
  
  // 获取标记
  const { results: marks } = await env.DB.prepare(
    'SELECT * FROM Mark WHERE scoreId = ? ORDER BY createdAt DESC'
  ).bind(id).all()
  
  return c.json({ ...score, measures, marks })
})

// 获取乐谱标记
scoresRouter.get('/:id/marks', async (c) => {
  const id = c.req.param('id')
  const env = c.env as any
  const { results } = await env.DB.prepare(
    'SELECT * FROM Mark WHERE scoreId = ? ORDER BY createdAt DESC'
  ).bind(id).all()
  return c.json(results)
})

// 删除乐谱
scoresRouter.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const env = c.env as any
  await env.DB.prepare('DELETE FROM Score WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})
