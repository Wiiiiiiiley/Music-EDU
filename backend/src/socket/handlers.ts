import { Server, Socket } from 'socket.io';
import { prisma } from '../index';

interface JoinRoomData {
  ensembleId: string;
  memberId: string;
  role: 'CONDUCTOR' | 'PLAYER';
  section?: string;
}

interface MarkData {
  id?: string;
  scoreId: string;
  type: 'DRAWING' | 'TEXT' | 'HIGHLIGHT';
  data: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  page: number;
  measureId?: string;
  targetSection?: string;
}

interface CueData {
  type: 'CLICK' | 'COUNT_IN' | 'METRONOME' | 'DEMO_AUDIO';
  targetSection?: string;
  measureNumber?: number;
  bpm?: number;
  audioUrl?: string;
}

interface CursorData {
  x: number;
  y: number;
  page: number;
  memberId: string;
}

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`用户连接: ${socket.id}`);

    // 加入乐团房间
    socket.on('join-ensemble', async (data: JoinRoomData) => {
      const { ensembleId, memberId, role, section } = data;
      
      socket.join(`ensemble:${ensembleId}`);
      socket.data.memberId = memberId;
      socket.data.role = role;
      socket.data.section = section;
      
      console.log(`成员 ${memberId} (${role}, ${section || '全体'}) 加入乐团 ${ensembleId}`);
      
      // 通知房间内的其他成员
      socket.to(`ensemble:${ensembleId}`).emit('member-joined', {
        memberId,
        role,
        section,
        socketId: socket.id
      });
      
      // 发送当前在线成员列表给新加入的成员
      const room = io.sockets.adapter.rooms.get(`ensemble:${ensembleId}`);
      if (room) {
        const members: any[] = [];
        for (const socketId of room) {
          const memberSocket = io.sockets.sockets.get(socketId);
          if (memberSocket && socketId !== socket.id) {
            members.push({
              socketId,
              memberId: memberSocket.data.memberId,
              role: memberSocket.data.role,
              section: memberSocket.data.section
            });
          }
        }
        socket.emit('room-members', members);
      }
    });

    // 离开乐团房间
    socket.on('leave-ensemble', (ensembleId: string) => {
      socket.leave(`ensemble:${ensembleId}`);
      socket.to(`ensemble:${ensembleId}`).emit('member-left', {
        memberId: socket.data.memberId,
        socketId: socket.id
      });
    });

    // 实时标记 - 指挥添加标记
    socket.on('add-mark', async (data: MarkData) => {
      try {
        // 保存到数据库
        const mark = await prisma.mark.create({
          data: {
            type: data.type,
            data: data.data,
            x: data.x,
            y: data.y,
            width: data.width,
            height: data.height,
            page: data.page,
            scoreId: data.scoreId,
            creatorId: socket.data.memberId,
            targetSection: data.targetSection,
            measureId: data.measureId
          }
        });
        
        // 广播给目标成员
        const ensembleId = Array.from(socket.rooms).find(r => r.startsWith('ensemble:'))?.replace('ensemble:', '');
        if (ensembleId) {
          if (data.targetSection) {
            // 只发送给特定声部
            socket.to(`ensemble:${ensembleId}`).emit('mark-added', {
              ...mark,
              targetSection: data.targetSection
            });
          } else {
            // 发送给全体
            socket.to(`ensemble:${ensembleId}`).emit('mark-added', mark);
          }
        }
      } catch (error) {
        console.error('添加标记失败:', error);
        socket.emit('error', { message: '添加标记失败' });
      }
    });

    // 删除标记
    socket.on('delete-mark', async (markId: string) => {
      try {
        await prisma.mark.delete({
          where: { id: markId }
        });
        
        const ensembleId = Array.from(socket.rooms).find(r => r.startsWith('ensemble:'))?.replace('ensemble:', '');
        if (ensembleId) {
          socket.to(`ensemble:${ensembleId}`).emit('mark-deleted', markId);
        }
      } catch (error) {
        console.error('删除标记失败:', error);
      }
    });

    // 发送提示音/节拍器指令
    socket.on('send-cue', async (data: CueData) => {
      const ensembleId = Array.from(socket.rooms).find(r => r.startsWith('ensemble:'))?.replace('ensemble:', '');
      if (!ensembleId) return;
      
      // 验证发送者是指挥
      if (socket.data.role !== 'CONDUCTOR') {
        socket.emit('error', { message: '只有指挥可以发送提示' });
        return;
      }
      
      // 广播提示
      if (data.targetSection) {
        // 只发送给特定声部
        socket.to(`ensemble:${ensembleId}`).emit('cue-received', {
          ...data,
          fromConductor: true,
          timestamp: Date.now()
        });
      } else {
        // 发送给全体
        socket.to(`ensemble:${ensembleId}`).emit('cue-received', {
          ...data,
          fromConductor: true,
          timestamp: Date.now()
        });
      }
      
      // 记录到排练日志
      console.log(`指挥发送提示: ${data.type}`);
    });

    // 光标位置同步（可选，用于显示指挥正在看哪里）
    socket.on('cursor-move', (data: CursorData) => {
      const ensembleId = Array.from(socket.rooms).find(r => r.startsWith('ensemble:'))?.replace('ensemble:', '');
      if (ensembleId) {
        socket.to(`ensemble:${ensembleId}`).emit('cursor-moved', {
          ...data,
          memberId: socket.data.memberId,
          role: socket.data.role
        });
      }
    });

    // 乐手页面同步
    socket.on('page-change', (page: number) => {
      const ensembleId = Array.from(socket.rooms).find(r => r.startsWith('ensemble:'))?.replace('ensemble:', '');
      if (ensembleId) {
        socket.to(`ensemble:${ensembleId}`).emit('page-changed', {
          memberId: socket.data.memberId,
          page
        });
      }
    });

    // 排练控制
    socket.on('rehearsal-start', (data: { scoreId: string; rehearsalId: string }) => {
      const ensembleId = Array.from(socket.rooms).find(r => r.startsWith('ensemble:'))?.replace('ensemble:', '');
      if (ensembleId && socket.data.role === 'CONDUCTOR') {
        socket.to(`ensemble:${ensembleId}`).emit('rehearsal-started', data);
      }
    });

    socket.on('rehearsal-stop', () => {
      const ensembleId = Array.from(socket.rooms).find(r => r.startsWith('ensemble:'))?.replace('ensemble:', '');
      if (ensembleId && socket.data.role === 'CONDUCTOR') {
        socket.to(`ensemble:${ensembleId}`).emit('rehearsal-stopped');
      }
    });

    // 当前演奏位置同步
    socket.on('current-position', (data: { measure: number; beat: number }) => {
      const ensembleId = Array.from(socket.rooms).find(r => r.startsWith('ensemble:'))?.replace('ensemble:', '');
      if (ensembleId) {
        socket.to(`ensemble:${ensembleId}`).emit('position-updated', {
          ...data,
          memberId: socket.data.memberId
        });
      }
    });

    // 断开连接
    socket.on('disconnect', () => {
      console.log(`用户断开连接: ${socket.id}`);
      const ensembleId = Array.from(socket.rooms).find(r => r.startsWith('ensemble:'))?.replace('ensemble:', '');
      if (ensembleId) {
        socket.to(`ensemble:${ensembleId}`).emit('member-left', {
          memberId: socket.data.memberId,
          socketId: socket.id
        });
      }
    });
  });
}
