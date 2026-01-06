# Moment3D

定格瞬间，留住世界 - 将照片转换为 3D 高斯泼溅场景

## 功能特性

- 🖼️ **图片上传**: 支持 JPG、PNG 格式图片上传
- ⚡ **实时处理**: SSE 实时推送处理进度
- 🎨 **粒子效果**: 6 种粒子效果（Magic、Spread、Unroll、Twister、Rain、无效果）
- 📱 **移动端优化**: 自动检测设备，优化性能
- 🎮 **交互教程**: PC 端和移动端的详细操作指南
- 🌟 **优雅设计**: 奶白色系的简约美观界面

## 技术栈

- **前端**: Next.js 15, React 19, TypeScript
- **3D 渲染**: Three.js, React Three Fiber, Spark.js
- **样式**: Tailwind CSS
- **后端**: Next.js API Routes (代理层)
- **推理后端**: FastAPI + SHARP 模型

## 环境变量配置

### 前端环境变量

创建 `.env.local` 文件（可以从 `.env.local.example` 复制）：

```bash
# 推理后端 API 地址
BACKEND_URL=http://localhost:8000

# Next.js 前端端口（可选，默认 3000）
# PORT=3000
```

### 环境变量说明

- `BACKEND_URL`: 推理后端的地址和端口
  - 开发环境: `http://localhost:8000`
  - 生产环境: 设置为实际的后端服务地址

- `PORT`: Next.js 前端服务端口（可选）
  - 默认: `3000`
  - 如需修改，取消注释并设置端口号

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.local.example .env.local

# 编辑 .env.local，设置正确的后端地址
```

### 3. 启动开发服务器

```bash
npm run dev
```

前端将在 `http://localhost:3000` 启动（或 `PORT` 环境变量指定的端口）

### 4. 启动推理后端

确保推理后端服务运行在 `BACKEND_URL` 指定的地址上（默认 `http://localhost:8000`）

## 项目结构

```
app/
├── (home)/                      # 首页
│   ├── _components/
│   │   └── progress-bar.tsx     # 进度条组件
│   └── page.tsx                 # 首页主文件
├── viewer/[taskId]/             # 查看器页面
│   └── page.tsx                 # 查看器主文件
├── api/                         # API 路由（代理层）
│   ├── predict/route.ts         # 图片上传代理
│   ├── stream/[taskId]/route.ts # SSE 状态推送代理
│   └── result/[taskId]/route.ts # 结果文件获取代理
├── _components/                 # 共享组件
│   ├── splat-scene.tsx          # 统一的 3D 场景组件
│   ├── splat-effects.ts         # 粒子效果定义
│   ├── interaction-tutorial.tsx # 交互教程
│   └── spark/                   # Spark.js 组件封装
└── layout.tsx                   # 根布局
```

## API 端点

### Next.js 前端 API（代理层）

- `POST /api/predict` - 上传图片
- `GET /api/stream/{taskId}` - SSE 状态推送
- `GET /api/result/{taskId}` - 获取处理结果

## 使用方法

1. **上传图片**: 在首页点击或拖放图片
2. **等待处理**: 查看实时进度条（上传 → 排队 → 重建 → 压缩）
3. **查看结果**: 自动跳转到 3D 查看器
4. **切换效果**: 在右上角选择不同的粒子效果
5. **交互操作**: 点击"交互教程"查看操作指南

## 开发命令

```bash
# 开发模式
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