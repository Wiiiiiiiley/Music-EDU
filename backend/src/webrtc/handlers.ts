import { Server, Socket } from 'socket.io';

interface SignalData {
  to: string;
  from: string;
  signal: any;
}

interface JoinAudioRoomData {
  ensembleId: string;
  memberId: string;
  section?: string;
  role: 'CONDUCTOR' | 'PLAYER';
}

export function setupWebRTCHandlers(io: Server) {
  // WebRTC 信令处理
  io.on('connection', (socket: Socket) => {
    
    // 加入音频房间（用于 WebRTC 通话）
    socket.on('join-audio-room', (data: JoinAudioRoomData) => {
      const { ensembleId, memberId, section, role } = data;
      const roomId = `audio:${ensembleId}`;
      
      socket.join(roomId);
      socket.data.audioRoom = roomId;
      socket.data.memberId = memberId;
      socket.data.section = section;
      socket.data.role = role;
      
      console.log(`成员 ${memberId} 加入音频房间 ${roomId}`);
      
      // 通知房间内其他成员有新成员加入
      socket.to(roomId).emit('audio-member-joined', {
        memberId,
        section,
        role,
        socketId: socket.id
      });
      
      // 发送当前房间成员列表给新成员
      const room = io.sockets.adapter.rooms.get(roomId);
      if (room) {
        const members: any[] = [];
        for (const socketId of room) {
          if (socketId !== socket.id) {
            const memberSocket = io.sockets.sockets.get(socketId);
            if (memberSocket) {
              members.push({
                socketId,
                memberId: memberSocket.data.memberId,
                section: memberSocket.data.section,
                role: memberSocket.data.role
              });
            }
          }
        }
        socket.emit('audio-room-members', members);
      }
    });

    // WebRTC offer
    socket.on('webrtc-offer', (data: SignalData) => {
      const { to, signal } = data;
      io.to(to).emit('webrtc-offer', {
        from: socket.id,
        signal,
        memberId: socket.data.memberId,
        section: socket.data.section,
        role: socket.data.role
      });
    });

    // WebRTC answer
    socket.on('webrtc-answer', (data: SignalData) => {
      const { to, signal } = data;
      io.to(to).emit('webrtc-answer', {
        from: socket.id,
        signal,
        memberId: socket.data.memberId
      });
    });

    // ICE candidate
    socket.on('webrtc-ice-candidate', (data: SignalData) => {
      const { to, signal } = data;
      io.to(to).emit('webrtc-ice-candidate', {
        from: socket.id,
        signal,
        memberId: socket.data.memberId
      });
    });

    // 音频控制 - 指挥可以控制各声部音量
    socket.on('audio-control', (data: { 
      targetSection?: string; 
      targetMemberId?: string;
      action: 'MUTE' | 'UNMUTE' | 'SET_VOLUME';
      volume?: number;
    }) => {
      // 验证发送者是指挥
      if (socket.data.role !== 'CONDUCTOR') {
        socket.emit('error', { message: '只有指挥可以控制音频' });
        return;
      }
      
      const roomId = socket.data.audioRoom;
      if (!roomId) return;
      
      // 广播音频控制指令
      if (data.targetMemberId) {
        // 针对特定成员
        const room = io.sockets.adapter.rooms.get(roomId);
        if (room) {
          for (const socketId of room) {
            const memberSocket = io.sockets.sockets.get(socketId);
            if (memberSocket && memberSocket.data.memberId === data.targetMemberId) {
              io.to(socketId).emit('audio-control', data);
              break;
            }
          }
        }
      } else if (data.targetSection) {
        // 针对特定声部
        socket.to(roomId).emit('audio-control', {
          ...data,
          targetSection: data.targetSection
        });
      } else {
        // 针对全体
        socket.to(roomId).emit('audio-control', data);
      }
    });

    // 发送提示音/节拍器音频流
    socket.on('send-cue-audio', (data: { 
      targetSection?: string;
      audioTrack: string; // base64 或音频流标识
      type: 'CLICK' | 'COUNT_IN' | 'METRONOME' | 'DEMO';
      bpm?: number;
    }) => {
      if (socket.data.role !== 'CONDUCTOR') {
        socket.emit('error', { message: '只有指挥可以发送音频提示' });
        return;
      }
      
      const roomId = socket.data.audioRoom;
      if (!roomId) return;
      
      // 广播音频提示
      if (data.targetSection) {
        socket.to(roomId).emit('cue-audio', {
          ...data,
          fromConductor: true,
          timestamp: Date.now()
        });
      } else {
        socket.to(roomId).emit('cue-audio', {
          ...data,
          fromConductor: true,
          timestamp: Date.now()
        });
      }
    });

    // 离开音频房间
    socket.on('leave-audio-room', () => {
      const roomId = socket.data.audioRoom;
      if (roomId) {
        socket.leave(roomId);
        socket.to(roomId).emit('audio-member-left', {
          memberId: socket.data.memberId,
          socketId: socket.id
        });
        delete socket.data.audioRoom;
      }
    });

    // 断开连接时清理
    socket.on('disconnect', () => {
      const roomId = socket.data.audioRoom;
      if (roomId) {
        socket.to(roomId).emit('audio-member-left', {
          memberId: socket.data.memberId,
          socketId: socket.id
        });
      }
    });
  });
}
