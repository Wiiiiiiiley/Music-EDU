import { create } from 'zustand'
import { io, Socket } from 'socket.io-client'
import type { User, Mark, CursorPosition } from '../types'

const API_URL = 'https://edutempo-api.wileymei3.workers.dev'

interface SocketState {
  socket: Socket | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  roomMembers: Array<{
    socketId: string
    memberId: string
    role: string
    section?: string
  }>
  
  // 方法
  connect: () => void
  disconnect: () => void
  joinEnsemble: (ensembleId: string, user: User) => void
  leaveEnsemble: (ensembleId: string) => void
  joinAudioRoom: (ensembleId: string, user: User) => void
  leaveAudioRoom: () => void
  
  // 标记相关
  sendMark: (mark: Omit<Mark, 'id' | 'createdAt' | 'creator'>) => void
  deleteMark: (markId: string) => void
  
  // 提示相关
  sendCue: (cue: {
    type: 'CLICK' | 'COUNT_IN' | 'METRONOME' | 'DEMO_AUDIO'
    targetSection?: string
    measureNumber?: number
    bpm?: number
    audioUrl?: string
  }) => void
  
  // 光标同步
  sendCursorPosition: (position: Omit<CursorPosition, 'memberId' | 'role'>) => void
  
  // 排练控制
  startRehearsal: (data: { scoreId: string; rehearsalId: string }) => void
  stopRehearsal: () => void
  sendPosition: (position: { measure: number; beat: number }) => void
  
  // WebRTC 信令
  sendWebRTCOffer: (to: string, signal: any) => void
  sendWebRTCAnswer: (to: string, signal: any) => void
  sendWebRTCIceCandidate: (to: string, signal: any) => void
  sendAudioControl: (control: {
    targetSection?: string
    targetMemberId?: string
    action: 'MUTE' | 'UNMUTE' | 'SET_VOLUME'
    volume?: number
  }) => void
  
  // 设置监听
  setupEventListeners: (callbacks: {
    onMarkAdded?: (mark: Mark) => void
    onMarkDeleted?: (markId: string) => void
    onCueReceived?: (cue: any) => void
    onCursorMoved?: (position: CursorPosition) => void
    onMemberJoined?: (member: any) => void
    onMemberLeft?: (data: any) => void
    onRoomMembers?: (members: any[]) => void
    onRehearsalStarted?: (data: any) => void
    onRehearsalStopped?: () => void
    onPositionUpdated?: (data: any) => void
    onWebRTCOffer?: (data: any) => void
    onWebRTCAnswer?: (data: any) => void
    onWebRTCIceCandidate?: (data: any) => void
    onAudioControl?: (control: any) => void
    onCueAudio?: (data: any) => void
  }) => void
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  isConnecting: false,
  error: null,
  roomMembers: [],
  
  connect: () => {
    if (get().socket?.connected) return
    
    set({ isConnecting: true, error: null })
    
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
    
    socket.on('connect', () => {
      console.log('Socket 已连接:', socket.id)
      set({ isConnected: true, isConnecting: false, error: null })
    })
    
    socket.on('disconnect', () => {
      console.log('Socket 已断开')
      set({ isConnected: false })
    })
    
    socket.on('connect_error', (error) => {
      console.error('Socket 连接错误:', error)
      set({ isConnecting: false, error: error.message })
    })
    
    socket.on('error', (error) => {
      console.error('Socket 错误:', error)
      set({ error: error.message })
    })
    
    set({ socket })
  },
  
  disconnect: () => {
    const socket = get().socket
    if (socket) {
      socket.disconnect()
      set({ socket: null, isConnected: false, roomMembers: [] })
    }
  },
  
  joinEnsemble: (ensembleId: string, user: User) => {
    const socket = get().socket
    if (!socket?.connected) {
      console.error('Socket 未连接')
      return
    }
    
    socket.emit('join-ensemble', {
      ensembleId,
      memberId: user.id,
      role: user.role,
      section: user.section
    })
  },
  
  leaveEnsemble: (ensembleId: string) => {
    const socket = get().socket
    if (socket) {
      socket.emit('leave-ensemble', ensembleId)
    }
  },
  
  joinAudioRoom: (ensembleId: string, user: User) => {
    const socket = get().socket
    if (!socket?.connected) return
    
    socket.emit('join-audio-room', {
      ensembleId,
      memberId: user.id,
      role: user.role,
      section: user.section
    })
  },
  
  leaveAudioRoom: () => {
    const socket = get().socket
    if (socket) {
      socket.emit('leave-audio-room')
    }
  },
  
  sendMark: (mark) => {
    const socket = get().socket
    if (socket) {
      socket.emit('add-mark', mark)
    }
  },
  
  deleteMark: (markId) => {
    const socket = get().socket
    if (socket) {
      socket.emit('delete-mark', markId)
    }
  },
  
  sendCue: (cue) => {
    const socket = get().socket
    if (socket) {
      socket.emit('send-cue', cue)
    }
  },
  
  sendCursorPosition: (position) => {
    const socket = get().socket
    if (socket) {
      socket.emit('cursor-move', position)
    }
  },
  
  startRehearsal: (data) => {
    const socket = get().socket
    if (socket) {
      socket.emit('rehearsal-start', data)
    }
  },
  
  stopRehearsal: () => {
    const socket = get().socket
    if (socket) {
      socket.emit('rehearsal-stop')
    }
  },
  
  sendPosition: (position) => {
    const socket = get().socket
    if (socket) {
      socket.emit('current-position', position)
    }
  },
  
  sendWebRTCOffer: (to, signal) => {
    const socket = get().socket
    if (socket) {
      socket.emit('webrtc-offer', { to, from: socket.id, signal })
    }
  },
  
  sendWebRTCAnswer: (to, signal) => {
    const socket = get().socket
    if (socket) {
      socket.emit('webrtc-answer', { to, from: socket.id, signal })
    }
  },
  
  sendWebRTCIceCandidate: (to, signal) => {
    const socket = get().socket
    if (socket) {
      socket.emit('webrtc-ice-candidate', { to, from: socket.id, signal })
    }
  },
  
  sendAudioControl: (control) => {
    const socket = get().socket
    if (socket) {
      socket.emit('audio-control', control)
    }
  },
  
  setupEventListeners: (callbacks) => {
    const socket = get().socket
    if (!socket) return
    
    // 清除旧监听器
    socket.off('mark-added')
    socket.off('mark-deleted')
    socket.off('cue-received')
    socket.off('cursor-moved')
    socket.off('member-joined')
    socket.off('member-left')
    socket.off('room-members')
    socket.off('rehearsal-started')
    socket.off('rehearsal-stopped')
    socket.off('position-updated')
    socket.off('webrtc-offer')
    socket.off('webrtc-answer')
    socket.off('webrtc-ice-candidate')
    socket.off('audio-control')
    socket.off('cue-audio')
    
    // 设置新监听器
    if (callbacks.onMarkAdded) {
      socket.on('mark-added', callbacks.onMarkAdded)
    }
    if (callbacks.onMarkDeleted) {
      socket.on('mark-deleted', callbacks.onMarkDeleted)
    }
    if (callbacks.onCueReceived) {
      socket.on('cue-received', callbacks.onCueReceived)
    }
    if (callbacks.onCursorMoved) {
      socket.on('cursor-moved', callbacks.onCursorMoved)
    }
    if (callbacks.onMemberJoined) {
      socket.on('member-joined', (member) => {
        set((state) => ({
          roomMembers: [...state.roomMembers, member]
        }))
        callbacks.onMemberJoined?.(member)
      })
    }
    if (callbacks.onMemberLeft) {
      socket.on('member-left', (data) => {
        set((state) => ({
          roomMembers: state.roomMembers.filter(m => m.socketId !== data.socketId)
        }))
        callbacks.onMemberLeft?.(data)
      })
    }
    if (callbacks.onRoomMembers) {
      socket.on('room-members', (members) => {
        set({ roomMembers: members })
        callbacks.onRoomMembers?.(members)
      })
    }
    if (callbacks.onRehearsalStarted) {
      socket.on('rehearsal-started', callbacks.onRehearsalStarted)
    }
    if (callbacks.onRehearsalStopped) {
      socket.on('rehearsal-stopped', callbacks.onRehearsalStopped)
    }
    if (callbacks.onPositionUpdated) {
      socket.on('position-updated', callbacks.onPositionUpdated)
    }
    if (callbacks.onWebRTCOffer) {
      socket.on('webrtc-offer', callbacks.onWebRTCOffer)
    }
    if (callbacks.onWebRTCAnswer) {
      socket.on('webrtc-answer', callbacks.onWebRTCAnswer)
    }
    if (callbacks.onWebRTCIceCandidate) {
      socket.on('webrtc-ice-candidate', callbacks.onWebRTCIceCandidate)
    }
    if (callbacks.onAudioControl) {
      socket.on('audio-control', callbacks.onAudioControl)
    }
    if (callbacks.onCueAudio) {
      socket.on('cue-audio', callbacks.onCueAudio)
    }
  }
}))
