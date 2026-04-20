import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

import { ensemblesRouter } from './routes/ensembles'
import { scoresRouter } from './routes/scores'
import { rehearsalsRouter } from './routes/rehearsals'

export interface Env {
  DB: D1Database
  CORS_ORIGIN: string
}

const app = new Hono()

// 中间件
app.use('*', logger())
app.use('*', prettyJSON())

// CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// 健康检查
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'EduTempo API',
  })
})

// API 路由
app.route('/api/ensembles', ensemblesRouter as any)
app.route('/api/scores', scoresRouter as any)
app.route('/api/rehearsals', rehearsalsRouter as any)

// 404
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

// 错误处理
app.onError((err, c) => {
  console.error('Error:', err)
  return c.json({
    error: 'Internal Server Error',
    message: err.message,
  }, 500)
})

export default app
