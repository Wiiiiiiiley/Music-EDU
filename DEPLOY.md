# Cloudflare Pages 部署指南

## 架构

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────┐
│  Cloudflare     │      │  Cloudflare      │      │  Cloudflare │
│  Pages          │──────│  Workers (API)     │──────│  D1 (DB)    │
│  (前端静态托管)  │      │  (WebSocket/API) │      │             │
└─────────────────┘      └──────────────────┘      └─────────────┘
                                │
                                ▼
                         ┌─────────────┐
                         │  R2 (存储)  │
                         │  乐谱/音频   │
                         └─────────────┘
```

## 1. 准备工作

### 安装 Wrangler CLI
```bash
npm install -g wrangler
```

### 登录 Cloudflare
```bash
wrangler login
```

## 2. 创建 Cloudflare 资源

### 创建 D1 数据库
```bash
wrangler d1 create edutempo-db
```
记录返回的 `database_id`，填入 `backend-wrangler/wrangler.toml`

### 创建 R2 存储桶
```bash
wrangler r2 bucket create edutempo-uploads
```

### 创建 KV 命名空间
```bash
wrangler kv:namespace create "KV"
```
记录返回的 `id`，填入 `backend-wrangler/wrangler.toml`

## 3. 数据库迁移

### 创建表结构
在 `backend-wrangler` 目录下执行：
```bash
wrangler d1 migrations create edutempo-db init
```

创建迁移文件 `migrations/0001_init.sql`：
```sql
CREATE TABLE Ensemble (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  conductorId TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Member (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  instrument TEXT,
  section TEXT,
  ensembleId TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ensembleId) REFERENCES Ensemble(id) ON DELETE CASCADE
);

CREATE TABLE Score (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  composer TEXT,
  fileUrl TEXT NOT NULL,
  fileType TEXT NOT NULL,
  audioUrl TEXT,
  ensembleId TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ensembleId) REFERENCES Ensemble(id) ON DELETE CASCADE
);

CREATE TABLE Measure (
  id TEXT PRIMARY KEY,
  number INTEGER NOT NULL,
  scoreId TEXT NOT NULL,
  startTime REAL,
  endTime REAL,
  FOREIGN KEY (scoreId) REFERENCES Score(id) ON DELETE CASCADE
);

CREATE TABLE Mark (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  data TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  width REAL,
  height REAL,
  page INTEGER NOT NULL,
  measureId TEXT,
  scoreId TEXT NOT NULL,
  creatorId TEXT NOT NULL,
  targetSection TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scoreId) REFERENCES Score(id) ON DELETE CASCADE,
  FOREIGN KEY (creatorId) REFERENCES Member(id)
);

CREATE TABLE Cue (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  measureId TEXT NOT NULL,
  targetSection TEXT,
  audioUrl TEXT,
  bpm INTEGER,
  timeSignature TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (measureId) REFERENCES Measure(id) ON DELETE CASCADE
);

CREATE TABLE Rehearsal (
  id TEXT PRIMARY KEY,
  ensembleId TEXT NOT NULL,
  scoreId TEXT,
  startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  endedAt DATETIME,
  recordingUrl TEXT,
  FOREIGN KEY (ensembleId) REFERENCES Ensemble(id) ON DELETE CASCADE,
  FOREIGN KEY (scoreId) REFERENCES Score(id)
);

CREATE TABLE RehearsalEvent (
  id TEXT PRIMARY KEY,
  rehearsalId TEXT NOT NULL,
  type TEXT NOT NULL,
  data TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rehearsalId) REFERENCES Rehearsal(id) ON DELETE CASCADE
);

CREATE INDEX idx_member_ensemble ON Member(ensembleId);
CREATE INDEX idx_score_ensemble ON Score(ensembleId);
CREATE INDEX idx_measure_score ON Measure(scoreId);
CREATE INDEX idx_mark_score ON Mark(scoreId);
CREATE INDEX idx_rehearsal_ensemble ON Rehearsal(ensembleId);
```

### 执行迁移
```bash
wrangler d1 migrations apply edutempo-db
```

## 4. 部署后端 (Workers)

```bash
cd backend-wrangler
npm install
wrangler deploy
```

记录部署后的 Workers URL，例如：
`https://edutempo-api.your-subdomain.workers.dev`

## 5. 配置前端

### 更新环境变量
编辑 `frontend/.env.production`：
```
VITE_API_URL=https://edutempo-api.your-subdomain.workers.dev
VITE_WS_URL=wss://edutempo-api.your-subdomain.workers.dev
```

### 更新 wrangler.toml
编辑 `frontend/wrangler.toml`，填入实际的 Workers URL：
```toml
[env.production.vars]
VITE_API_URL = "https://edutempo-api.your-subdomain.workers.dev"
VITE_WS_URL = "wss://edutempo-api.your-subdomain.workers.dev"
```

## 6. 部署前端 (Pages)

### 方式一：Wrangler CLI
```bash
cd frontend
npm install
npm run build
wrangler pages deploy dist
```

### 方式二：Git 集成 (推荐)
1. 推送代码到 GitHub
2. 在 Cloudflare Dashboard 中创建 Pages 项目
3. 连接 GitHub 仓库
4. 构建设置：
   - 构建命令：`npm run build`
   - 构建输出：`dist`
   - 根目录：`frontend`

## 7. 自定义域名 (可选)

### 前端域名
1. 在 Pages 项目设置中添加自定义域名
2. 按照 Cloudflare 提示配置 DNS

### 后端域名
1. 在 Workers 设置中添加自定义域名
2. 更新前端的 API_URL 为新域名

## 注意事项

1. **WebSocket**: Workers 支持 WebSocket，但需要通过 Durable Objects 实现
2. **文件上传**: R2 存储的文件可以通过自定义域名访问，需要配置 public URL
3. **CORS**: 确保 Workers 的 CORS 设置允许你的 Pages 域名
4. **环境变量**: 敏感信息（如 JWT_SECRET）使用 `wrangler secret put` 设置

## 故障排查

- 检查 Workers 日志：`wrangler tail`
- 检查 D1 数据库：`wrangler d1 execute edutempo-db --command="SELECT * FROM Ensemble"`
- 检查 R2 存储：`wrangler r2 object list edutempo-uploads`
