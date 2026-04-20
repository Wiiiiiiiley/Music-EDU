# EduTempo - 智能乐团排练系统

EduTempo 是一款专为非专业乐团（学生乐团、社区乐团、业余管弦/民乐团）设计的智能排练系统。它解决了传统排练中声部混杂、标记困难、乐谱管理混乱等问题，通过**指挥实时标记**、**分声部音频提示**、**多端乐谱同步**三大核心功能，让每一次排练都更高效。

## 核心功能

### 指挥端
- **乐谱管理**：上传 PDF/MusicXML 格式的乐谱
- **实时标记**：在乐手谱面上圈画、批注，实时同步到所有客户端
- **分声部提示**：向指定声部或全体发送提示音、节拍器、示范音频
- **排练控制**：开始/停止排练，查看排练进度
- **成员管理**：查看乐团成员列表，按声部筛选

### 乐手端
- **电子乐谱**：使用平板或手机打开电子乐谱
- **分声部音频**：佩戴耳机收听自己声部的排练提示音轨
- **实时标记**：接收指挥的实时标记与文字备注
- **音频控制**：独立调节各声道音量

## 技术栈

### 后端
- **Node.js** + **Express** - Web 服务框架
- **Socket.io** - WebSocket 实时通信
- **Prisma** + **SQLite** - ORM 和数据库
- **Multer** - 文件上传处理
- **WebRTC** (信令) - 低延迟音频分发

### 前端
- **React** + **TypeScript** - UI 框架
- **Vite** - 构建工具
- **Tailwind CSS** - 样式
- **Zustand** - 状态管理
- **Socket.io-client** - WebSocket 客户端
- **VexFlow** - 乐谱渲染引擎
- **Lucide React** - 图标库

## 快速开始

### 安装依赖

```bash
# 安装根目录依赖
npm run install:all

# 或者分别安装
cd backend && npm install
cd ../frontend && npm install
```

### 初始化数据库

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 启动开发服务器

```bash
# 同时启动前后端（从根目录）
npm run dev

# 或者分别启动
# 后端
cd backend && npm run dev

# 前端
cd frontend && npm run dev
```

### 访问应用

- 前端：`http://localhost:5173`
- 后端 API：`http://localhost:3001`

## 使用流程

1. **创建乐团**（指挥）
   - 访问首页，选择"我是指挥"
   - 填写基本信息，创建乐团
   - 添加乐团成员

2. **上传乐谱**（指挥）
   - 进入指挥端界面
   - 点击"上传乐谱"
   - 选择 PDF 或 MusicXML 文件，可选上传参考音频

3. **乐手加入**（乐手）
   - 访问首页，选择"我是乐手"
   - 输入乐团 ID 加入
   - 等待指挥选择乐谱并开始排练

4. **开始排练**（指挥）
   - 选择乐谱
   - 使用标注工具在乐谱上标记
   - 发送提示音给特定声部
   - 控制排练开始/停止

## 项目结构

```
edu/
├── backend/                # 后端服务
│   ├── src/
│   │   ├── index.ts       # 入口文件
│   │   ├── socket/        # WebSocket 处理器
│   │   ├── webrtc/        # WebRTC 信令
│   │   └── routes/        # API 路由
│   ├── prisma/            # 数据库模型
│   └── uploads/           # 上传文件目录
├── frontend/              # 前端应用
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── components/    # 组件
│   │   ├── stores/        # 状态管理
│   │   ├── types/         # TypeScript 类型
│   │   └── utils/         # 工具函数
│   └── public/            # 静态资源
└── package.json           # 根配置
```

## API 接口

### 乐团管理
- `GET /api/ensembles` - 获取乐团列表
- `POST /api/ensembles` - 创建乐团
- `GET /api/ensembles/:id` - 获取乐团详情
- `POST /api/ensembles/:id/members` - 添加成员

### 乐谱管理
- `GET /api/scores` - 获取乐谱列表
- `POST /api/scores` - 创建乐谱
- `GET /api/scores/:id` - 获取乐谱详情
- `GET /api/scores/:id/marks` - 获取乐谱标记

### 上传
- `POST /api/upload/score` - 上传乐谱文件
- `POST /api/upload/audio` - 上传音频文件

### 排练
- `GET /api/rehearsals` - 获取排练记录
- `POST /api/rehearsals/start` - 开始排练
- `POST /api/rehearsals/:id/end` - 结束排练

## WebSocket 事件

### 客户端发送
- `join-ensemble` - 加入乐团房间
- `add-mark` - 添加标记
- `send-cue` - 发送提示
- `cursor-move` - 光标移动
- `rehearsal-start` - 开始排练
- `rehearsal-stop` - 停止排练

### 服务器广播
- `mark-added` - 新标记
- `cue-received` - 收到提示
- `member-joined` - 成员加入
- `member-left` - 成员离开
- `rehearsal-started` - 排练开始
- `rehearsal-stopped` - 排练停止

## 技术特点

1. **实时协同标记**
   - 基于 WebSocket 的实时同步
   - 支持绘图、文字、高亮三种标记类型
   - 可按声部定向发送标记

2. **低延迟音频分发**
   - WebRTC 音频流
   - 目标延迟 < 50ms
   - 支持分声部音量控制

3. **跨端支持**
   - 响应式设计，适配平板和手机
   - 支持 Web、iPad、Android Pad
   - 触摸友好的操作界面

## 后续规划

- [ ] AI 音准评分
- [ ] 排练录音与复盘
- [ ] 乐谱自动翻页
- [ ] 小节线智能对齐
- [ ] 离线模式支持

## 许可证

MIT License
