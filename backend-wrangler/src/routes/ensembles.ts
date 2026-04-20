import { Hono } from 'hono'

export const ensemblesRouter = new Hono()

// 获取所有乐团
ensemblesRouter.get('/', async (c) => {
  const env = c.env as any
  const { results } = await env.DB.prepare(
    'SELECT * FROM Ensemble ORDER BY createdAt DESC'
  ).all()
  return c.json(results)
})

// 创建乐团
ensemblesRouter.post('/', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const env = c.env as any
  
  await env.DB.prepare(
    'INSERT INTO Ensemble (id, name, conductorId, createdAt, updatedAt) VALUES (?, ?, ?, datetime("now"), datetime("now"))'
  ).bind(id, body.name, body.conductorId).run()
  
  return c.json({ id, ...body }, 201)
})

// 获取乐团详情
ensemblesRouter.get('/:id', async (c) => {
  const id = c.req.param('id')
  const env = c.env as any
  
  const ensemble = await env.DB.prepare(
    'SELECT * FROM Ensemble WHERE id = ?'
  ).bind(id).first()
  
  if (!ensemble) {
    return c.json({ error: 'Ensemble not found' }, 404)
  }
  
  // 获取成员
  const { results: members } = await env.DB.prepare(
    'SELECT * FROM Member WHERE ensembleId = ?'
  ).bind(id).all()
  
  // 获取乐谱
  const { results: scores } = await env.DB.prepare(
    'SELECT * FROM Score WHERE ensembleId = ? ORDER BY createdAt DESC'
  ).bind(id).all()
  
  return c.json({ ...ensemble, members, scores })
})

// 添加成员
ensemblesRouter.post('/:id/members', async (c) => {
  const ensembleId = c.req.param('id')
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const env = c.env as any
  
  await env.DB.prepare(
    'INSERT INTO Member (id, name, role, instrument, section, ensembleId, createdAt) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))'
  ).bind(id, body.name, body.role, body.instrument || null, body.section || null, ensembleId).run()
  
  return c.json({ id, ...body, ensembleId }, 201)
})

// 删除成员
ensemblesRouter.delete('/:id/members/:memberId', async (c) => {
  const memberId = c.req.param('memberId')
  const env = c.env as any
  
  await env.DB.prepare(
    'DELETE FROM Member WHERE id = ?'
  ).bind(memberId).run()
  
  return c.json({ success: true })
})
