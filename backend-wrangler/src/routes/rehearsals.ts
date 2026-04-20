import { Hono } from 'hono'

export const rehearsalsRouter = new Hono()

// 获取所有排练记录
rehearsalsRouter.get('/', async (c) => {
  const ensembleId = c.req.query('ensembleId')
  const env = c.env as any
  
  let query = 'SELECT * FROM Rehearsal'
  if (ensembleId) {
    query += ' WHERE ensembleId = ? ORDER BY startedAt DESC'
    const { results } = await env.DB.prepare(query).bind(ensembleId).all()
    return c.json(results)
  }
  
  const { results } = await env.DB.prepare(query + ' ORDER BY startedAt DESC').all()
  return c.json(results)
})

// 开始排练
rehearsalsRouter.post('/start', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const env = c.env as any
  
  await env.DB.prepare(
    'INSERT INTO Rehearsal (id, ensembleId, scoreId, startedAt) VALUES (?, ?, ?, datetime("now"))'
  ).bind(id, body.ensembleId, body.scoreId || null).run()
  
  return c.json({ id, ...body, startedAt: new Date().toISOString() }, 201)
})

// 结束排练
rehearsalsRouter.post('/:id/end', async (c) => {
  const id = c.req.param('id')
  const env = c.env as any
  
  await env.DB.prepare(
    'UPDATE Rehearsal SET endedAt = datetime("now") WHERE id = ?'
  ).bind(id).run()
  
  return c.json({ success: true })
})

// 获取排练详情
rehearsalsRouter.get('/:id', async (c) => {
  const id = c.req.param('id')
  const env = c.env as any
  
  const rehearsal = await env.DB.prepare(
    'SELECT * FROM Rehearsal WHERE id = ?'
  ).bind(id).first()
  
  if (!rehearsal) {
    return c.json({ error: 'Rehearsal not found' }, 404)
  }
  
  // 获取排练事件
  const { results: events } = await env.DB.prepare(
    'SELECT * FROM RehearsalEvent WHERE rehearsalId = ? ORDER BY timestamp'
  ).bind(id).all()
  
  return c.json({ ...rehearsal, events })
})

// 记录排练事件
rehearsalsRouter.post('/:id/events', async (c) => {
  const rehearsalId = c.req.param('id')
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const env = c.env as any
  
  await env.DB.prepare(
    'INSERT INTO RehearsalEvent (id, rehearsalId, type, data, timestamp) VALUES (?, ?, ?, ?, datetime("now"))'
  ).bind(id, rehearsalId, body.type, JSON.stringify(body.data || {})).run()
  
  return c.json({ id, ...body }, 201)
})
