# Moment 3D

定格瞬间，留住世界 - 基于 3D 高斯泼溅的视频三维重建平台

## 功能特性

- 🎥 **视频上传**: 支持多种视频格式（MP4、AVI、MOV 等）
- 🔐 **邮箱认证**: 基于邮箱验证码的安全登录系统
- ⚡ **并发控制**: 智能队列管理，支持多用户并发上传
- 📊 **任务管理**: 实时任务状态同步，支持任务列表查询
- 🎨 **3D 渲染**: 基于 Spark.js 的高性能 3D 场景渲染
- 📱 **响应式设计**: 完美适配桌面端和移动端
- 🌟 **优雅界面**: 现代化的 UI 设计

## 技术栈

### 前端
- **框架**: Next.js 15, React 19, TypeScript
- **3D 渲染**: Three.js, React Three Fiber, Spark.js
- **样式**: Tailwind CSS
- **动画**: Framer Motion

### 后端
- **API**: Next.js API Routes
- **数据库**: SQLite (better-sqlite3)
- **认证**: JWT (jose)
- **邮件服务**: Nodemailer (邮箱 SMTP)
- **文件上传**: Axios, FormData

### 推理后端
- **框架**: FastAPI
- **模型**: 3D Gaussian Splatting

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd moment-3d
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制环境变量模板：

```bash
cp .env .env.local
```

编辑 `.env.local`，填入实际配置：

### 4. 启动开发服务器

```bash
npm run dev
```

前端将在 `http://localhost:3000` 启动

### 5. 启动推理后端

确保推理后端服务运行在 `INFERENCE_BACKEND_URL` 指定的地址上

## 环境变量配置详解

### 必需配置

#### INFERENCE_BACKEND_URL
推理后端 API 地址

```bash
INFERENCE_BACKEND_URL=http://127.0.0.1:4000
```

#### JWT_SECRET
JWT 签名密钥，用于用户认证

```bash
# 生成随机密钥（推荐）
JWT_SECRET=$(openssl rand -base64 32)

# 或手动设置
JWT_SECRET=your_very_long_and_random_secret_key_here
```

⚠️ **生产环境必须使用强密钥！**

### 可选配置

#### DATABASE_PATH
SQLite 数据库文件路径

```bash
DATABASE_PATH=./data/database.sqlite
```

#### TEMP_PATH
临时文件存储路径（用于视频上传缓存）

```bash
TEMP_PATH=./data/temp
```

#### MAX_UPLOADS
最大并发上传数（同时向 Next 后端上传的视频数量）

```bash
MAX_UPLOADS=10
```

#### EMAIL_USER 和 EMAIL_PASS
邮箱服务配置（用于发送验证码）

```bash
EMAIL_USER=your_email@qq.com
EMAIL_PASS=your_qq_email_authorization_code
```

## 项目结构

```
moment-3d/
├── app/                          # Next.js 应用目录
│   ├── (home)/                   # 首页
│   │   └── page.tsx
│   ├── viewer/[taskId]/          # 3D 查看器页面
│   │   └── page.tsx
│   ├── api/                      # API 路由
│   │   ├── auth/                 # 认证相关
│   │   │   ├── code/route.ts    # 发送验证码
│   │   │   └── login/route.ts   # 登录/注册
│   │   └── tasks/                # 任务管理
│   │       ├── route.ts          # 任务列表
│   │       ├── upload/route.ts   # 视频上传
│   │       └── [taskId]/         # 任务详情
│   │           ├── metadata/route.ts  # 元数据
│   │           └── assets/route.ts    # 资源文件
│   ├── _components/              # 共享组件
│   │   ├── splat-viewer/         # 3D 查看器组件
│   │   └── spark/                # Spark.js 封装
│   ├── globals.css               # 全局样式
│   └── layout.tsx                # 根布局
├── lib/                          # 工具库
│   ├── db.ts                     # 数据库连接
│   ├── jwt.ts                    # JWT 工具
│   ├── snowflake.ts              # 雪花 ID 生成器
│   ├── datetime.ts               # 时间处理
│   ├── email.ts                  # 邮件服务
│   ├── verification-code.ts      # 验证码管理
│   └── task-status-sync.ts       # 任务状态同步
├── public/                       # 静态资源
├── .env                          # 环境变量模板
├── .env.local                    # 本地环境变量（不提交）
├── API_TESTING.md                # API 测试文档
└── package.json
```

## API 端点

### 认证接口

- `POST /api/auth/code` - 发送验证码
- `POST /api/auth/login` - 登录/注册

### 任务管理

- `POST /api/tasks/upload` - 上传视频
- `GET /api/tasks` - 获取任务列表（支持分页和用户过滤）
- `GET /api/tasks/[taskId]/metadata` - 获取任务元数据
- `GET /api/tasks/[taskId]/assets` - 下载任务资源文件

详细的 API 文档请查看 [API_TESTING.md](./API_TESTING.md)

## 数据库设计

### users 表
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,              -- 雪花算法生成的用户 ID
  email TEXT UNIQUE,                -- 邮箱（唯一）
  nickname TEXT UNIQUE,             -- 昵称（可为空）
  created_at TEXT,                  -- 创建时间（UTC ISO 8601）
  last_login_at TEXT                -- 最后登录时间（UTC ISO 8601）
);
```

### tasks 表
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,              -- 雪花算法生成的任务 ID
  user_id TEXT,                     -- 用户 ID（外键）
  status TEXT,                      -- 任务状态：waiting, finish, failure
  created_at TEXT,                  -- 创建时间（UTC ISO 8601）
  completed_at TEXT,                -- 完成时间（UTC ISO 8601）
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

## 核心功能

### 1. 邮箱验证码认证

- 6 位数字验证码
- 10 分钟有效期
- 一次性使用
- 自动清理过期验证码

### 2. 视频上传与并发控制

- 支持多种视频格式
- 最多 10 个并发上传到 Next 后端
- 单并发队列转发到推理后端
- 自动文件清理

### 3. 任务状态同步

- 每 1 分钟自动同步任务状态
- 批量查询推理后端
- 自动更新数据库

### 4. 3D 场景渲染

- 基于 Spark.js 的高性能渲染
- 支持多种交互方式
- 响应式设计

## 开发命令

```bash
# 开发模式（使用 Turbopack）
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint

# 代码格式化
npm run lint:fix

# 构建并打包部署文件
npm run package
```

## 构建和部署

使用内置的打包脚本，一键构建并生成部署包：

```bash
# 构建并打包
npm run package
```

这个命令会：
1. 自动执行 `npm run build`
2. 检查必要文件是否存在
3. 将部署文件打包成 ZIP 文件
4. 生成带时间戳的部署包（如：`moment3d-2024-01-06T15-30-45.zip`）

### 部署步骤

1. **本地构建打包**
```bash
npm run package
```

2. **上传到服务器**

3. **服务器部署**
```bash
# 解压
unzip moment3d-*.zip

# 安装生产依赖
npm ci --only=production

# 配置环境变量
nano .env.local

# 启动服务
npm start
```

### 环境变量（生产环境）

生产环境建议使用环境变量管理服务：

- **Vercel**: 在项目设置中配置环境变量
- **Railway**: 在 Variables 面板配置
- **自建服务器**: 使用 `.env.local` 或系统环境变量

## 故障排查

### 环境变量不生效

1. 确认配置在 `.env.local` 文件中
2. 重启开发服务器
3. 检查变量名是否正确（区分大小写）

### 邮件发送失败

1. 检查 `EMAIL_USER` 和 `EMAIL_PASS` 是否配置
2. 确认使用的是授权码，不是邮箱密码
3. 检查 QQ 邮箱 SMTP 服务是否已开启
4. 查看控制台错误日志

### 数据库连接失败

1. 检查 `DATABASE_PATH` 配置
2. 确认目录有写入权限
3. 查看 `data/` 目录是否存在

## 安全提示

⚠️ **重要安全事项**：

1. **永远不要将 `.env.local` 提交到 Git**
2. **生产环境必须使用强 JWT 密钥**
3. **定期更换邮箱授权码**
4. **使用 HTTPS 部署生产环境**
5. **定期备份数据库**

## 贡献

欢迎提交 Issue 和 Pull Request！