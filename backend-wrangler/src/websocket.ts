import type { Context } from 'hono'
import type { Env } from './index'

// WebSocket 处理 - 使用 Cloudflare Durable Objects
export const websocketHandler = async (c: Context<{ Bindings: Env }>) => {
  const upgradeHeader = c.req.header('Upgrade')
  
  if (upgradeHeader !== 'websocket') {
    return c.json({ error: 'Expected Upgrade: websocket' }, 426)
  }
  
  // 获取或创建 WebSocket Durable Object
  const id = c.env.WEBSOCKET.idFromName('global')
  const stub = c.env.WEBSOCKET.get(id)
  
  return stub.fetch(c.req.raw)
}

// Durable Object 类
export class WebSocketServer {
  state: DurableObjectState
  sessions: Map<string, WebSocket>
  
  constructor(state: DurableObjectState) {
    this.state = state
    this.sessions = new Map()
  }
  
  async fetch(request: Request) {
    const [client, server] = Object.values(new WebSocketPair())
    
    this.handleSession(server, request)
    
    return new Response(null, {
      status: 101,
      webSocket: client,
    })
  }
  
  handleSession(ws: WebSocket, req: Request) {
    const url = new URL(req.url)
    const ensembleId = url.searchParams.get('ensembleId')
    const userId = url.searchParams.get('userId')
    
    if (!ensembleId || !userId) {
      ws.close(1008, 'Missing ensembleId or userId')
      return
    }
    
    const sessionId = `${ensembleId}:${userId}:${Date.now()}`
    this.sessions.set(sessionId, ws)
    
    ws.accept()
    
    // 发送欢迎消息
    ws.send(JSON.stringify({
      type: 'connected',
      sessionId,
      ensembleId,
    }))
    
    // 广播成员加入
    this.broadcast(ensembleId, {
      type: 'member-joined',
      memberId: userId,
    }, sessionId)
    
    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data as string)
        
        // 处理不同消息类型
        switch (data.type) {
          case 'mark':
            this.broadcast(ensembleId, {
              type: 'mark-added',
              mark: data.mark,
            }, sessionId)
            break
          case 'cue':
            this.broadcast(ensembleId, {
              type: 'cue-received',
              cue: data.cue,
            }, sessionId)
            break
          case 'cursor':
            this.broadcast(ensembleId, {
              type: 'cursor-moved',
              position: data.position,
              memberId: userId,
            }, sessionId)
            break
          case 'webrtc-offer':
          case 'webrtc-answer':
          case 'webrtc-ice':
            // 转发 WebRTC 信令
            this.sendTo(data.to, data)
            break
          default:
            this.broadcast(ensembleId, data, sessionId)
        }
      } catch (err) {
        console.error('Message handling error:', err)
      }
    })
    
    ws.addEventListener('close', () => {
      this.sessions.delete(sessionId)
      this.broadcast(ensembleId, {
        type: 'member-left',
        memberId: userId,
      }, sessionId)
    })
  }
  
  broadcast(ensembleId: string, data: any, excludeSessionId?: string) {
    const message = JSON.stringify(data)
    
    for (const [sessionId, ws] of this.sessions) {
      if (sessionId.startsWith(ensembleId) && sessionId !== excludeSessionId) {
        ws.send(message)
      }
    }
  }
  
  sendTo(sessionId: string, data: any) {
    const ws = this.sessions.get(sessionId)
    if (ws) {
      ws.send(JSON.stringify(data))
    }
  }
}
