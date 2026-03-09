# Next.js 后端 API 测试文档

本文档介绍所有后端 API 接口的详细信息，包括请求方法、参数、响应格式和测试示例。

## 目录

1. [认证接口](#1-认证接口)
2. [任务上传接口](#2-任务上传接口)
3. [任务列表接口](#3-任务列表接口)
4. [任务元数据接口](#4-任务元数据接口)
5. [任务资源文件接口](#5-任务资源文件接口)

---

## 1. 认证接口

### 发送验证码

**端点**: `POST /api/auth/code`

**描述**: 向指定邮箱发送 6 位数字验证码，用于登录或注册。

**请求头**:
```
Content-Type: application/json
```

**请求体**:
```json
{
  "email": "user@example.com"
}
```

**成功响应** (200 OK):
```json
{
  "message": "Verification code sent successfully"
}
```

**错误响应**:
- `400 Bad Request`: 参数错误
  ```json
  {
    "error": "Email is required"
  }
  ```
  或
  ```json
  {
    "error": "Invalid email format"
  }
  ```
- `500 Internal Server Error`: 发送邮件失败
  ```json
  {
    "error": "Failed to send verification email. Please try again later."
  }
  ```

**测试示例 (curl)**:

```bash
# 发送验证码
curl -X POST http://localhost:3000/api/auth/code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**注意事项**:
- 验证码有效期为 5 分钟
- 验证码为 6 位数字
- 同一邮箱重复请求会覆盖之前的验证码
- 验证码使用后会立即失效，不可重复使用
- 需要配置邮箱服务（`EMAIL_USER` 和 `EMAIL_PASS` 环境变量）
- 如果未配置邮箱服务，验证码会在控制台输出（仅用于开发测试）

---

### 用户登录/注册

**端点**: `POST /api/auth/login`

**描述**: 支持两种登录方式：
- 使用 Access Token 自动登录
- 使用邮箱 + 验证码登录（如果用户不存在则自动注册）

**请求头**:
```
Content-Type: application/json
```

**请求体**:

方式一：Token 自动登录
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

方式二：邮箱 + 验证码登录
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**成功响应** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "71829384756254",
    "email": "user@example.com"
  }
}
```

**错误响应**:
- `400 Bad Request`: 缺少必需参数
  ```json
  {
    "error": "Email and code are required"
  }
  ```
  或
  ```json
  {
    "error": "Invalid email format"
  }
  ```
  或
  ```json
  {
    "error": "Invalid or expired verification code"
  }
  ```
- `500 Internal Server Error`: 服务器错误

**测试示例 (curl)**:

```bash
# 方式一：Token 自动登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "your_token_here"
  }'

# 方式二：邮箱 + 验证码登录（新用户自动注册）
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456"
  }'
```

**完整登录流程示例**:

```bash
# 1. 发送验证码
curl -X POST http://localhost:3000/api/auth/code \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# 2. 等待接收邮件中的验证码（或查看控制台输出）

# 3. 使用验证码登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456"
  }'
```

**注意事项**:
- 验证码验证功能已实现，必须使用有效的验证码
- Token 有效期为 7 天
- 如果用户不存在，会自动创建新用户
- 验证码使用后会立即失效
- 验证码有效期为 5 分钟

---

## 2. 任务上传接口

### 上传视频文件

**端点**: `POST /api/tasks/upload`

**描述**: 上传视频文件进行三维重建。支持并发控制，最多允许 10 个并发上传到 Next 后端，后端会排队转发到推理后端（单并发）。

**请求头**:
```
Content-Type: multipart/form-data
Authorization: Bearer <access_token>
```

**请求体** (FormData):
- `file`: 视频文件（必需）

**成功响应** (200 OK):
```json
{
  "task_id": "71829384756254",
  "message": "Task uploaded and queued"
}
```

**错误响应**:
- `401 Unauthorized`: 未提供有效的 Token
  ```json
  {
    "error": "Unauthorized"
  }
  ```
- `400 Bad Request`: 缺少文件
  ```json
  {
    "error": "File is required"
  }
  ```
- `503 Service Unavailable`: 超过最大并发数
  ```json
  {
    "error": "Service Unavailable: Too many uploads"
  }
  ```
- `500 Internal Server Error`: 服务器错误

**测试示例 (curl)**:

```bash
# 首先登录获取 token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "13800138000", "code": "123456"}' \
  | jq -r '.token')

# 上传视频文件
curl -X POST http://localhost:3000/api/tasks/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/your/video.mp4"
```

**支持的视频格式**:
- `.mp4`
- `.avi`
- `.mov`
- `.mkv`
- `.webm`
- `.flv`
- `.wmv`

**注意事项**:
- 文件会先存储到临时目录（默认 `./data/temp`）
- 任务会自动排队转发到推理后端
- 任务初始状态为 `Waiting`
- 接口会立即返回，不等待推理完成
- 上传成功或失败后，临时文件会自动清理
- 如果转发失败，任务状态会自动更新为 `Failure`

---

## 3. 任务列表接口

### 获取已完成的任务列表

**端点**: `GET /api/tasks`

**描述**: 获取已完成的三维重建任务列表，支持分页和按用户过滤。

**请求参数** (Query String):
- `user_id` (可选): 用户 ID，如果提供则只返回该用户的任务。不能为空字符串。
- `page` (可选): 页码，默认为 1。必须是正整数。
- `limit` (可选): 每页数量，默认为 20，最大为 100。必须是正整数。

**成功响应** (200 OK):
```json
{
  "data": [
    {
      "task_id": "71829384756254",
      "user_nickname": "张三",
      "completed_at": "2026-03-09T12:34:56.789Z"
    },
    {
      "task_id": "71829384756255",
      "user_nickname": "李四",
      "completed_at": "2026-03-09T12:30:00.123Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "total_pages": 5,
    "has_more": true
  }
}
```

**错误响应**:
- `400 Bad Request`: 参数验证失败
  ```json
  {
    "error": "page must be a positive integer"
  }
  ```
  
  可能的错误消息：
  - `user_id cannot be empty`
  - `page cannot be empty`
  - `page must be a positive integer`
  - `limit cannot be empty`
  - `limit must be a positive integer`
  - `limit cannot exceed 100`

- `500 Internal Server Error`: 服务器错误

**测试示例 (curl)**:

```bash
# 获取所有用户的任务（首页信息流）
curl http://localhost:3000/api/tasks

# 获取第 2 页，每页 10 条
curl "http://localhost:3000/api/tasks?page=2&limit=10"

# 获取特定用户的任务（用户个人主页）
curl "http://localhost:3000/api/tasks?user_id=71829384756254"

# 组合查询
curl "http://localhost:3000/api/tasks?user_id=71829384756254&page=1&limit=20"

# 测试参数验证 - 空参数（应返回 400）
curl "http://localhost:3000/api/tasks?page="

# 测试参数验证 - 无效页码（应返回 400）
curl "http://localhost:3000/api/tasks?page=0"
curl "http://localhost:3000/api/tasks?page=abc"

# 测试参数验证 - 超出限制（应返回 400）
curl "http://localhost:3000/api/tasks?limit=101"

# 测试超出范围的页码（应返回空数组）
curl "http://localhost:3000/api/tasks?page=9999"
```

**注意事项**:
- 只返回状态为 `Finish` 的任务
- 按完成时间倒序排列（最新的在前）
- 如果请求的页码超出范围，返回空数组（`data: []`），而不是错误
- `limit` 最大值为 100，防止一次查询过多数据
- 空参数（如 `?page=` 或 `?user_id=`）会返回 400 错误
- 响应中新增 `limit` 和 `total_pages` 字段，方便前端分页

---

## 4. 任务元数据接口

### 获取任务的渲染元数据

**端点**: `GET /api/tasks/[taskId]/metadata`

**描述**: 获取指定任务的三维渲染元数据，用于前端渲染器配置。此接口会转发请求到推理后端。

**路径参数**:
- `taskId`: 任务 ID

**成功响应** (200 OK):
```json
{
    "task_id": "2030902719916675072",
    "intrinsic_matrix": [
        1481.189193099253,
        0,
        540,
        0,
        1475.6943239446784,
        960,
        0,
        0,
        1
    ],
    "extrinsic_matrix": [
        -0.9934409135984404,
        -0.02765519431624884,
        -0.11095197797257439,
        2.7080928144098557,
        -0.10684919094315805,
        -0.1210538098717997,
        0.9868785262180522,
        -4.637997996419697,
        -0.04072347705548563,
        0.9922606337766569,
        0.11730487233554554,
        4.481451576061114,
        0,
        0,
        0,
        1
    ]
}
```

**错误响应**:
- `404 Not Found`: 元数据不存在
  ```json
  {
    "error": "Metadata not found"
  }
  ```
- `500 Internal Server Error`: 服务器错误
  ```json
  {
    "error": "Failed to fetch metadata"
  }
  ```

**测试示例 (curl)**:

```bash
# 获取任务元数据
curl http://localhost:3000/api/tasks/71829384756254/metadata
```

**注意事项**:
- 此接口是推理后端的代理接口
- 实际数据格式取决于推理后端返回的内容
- 需要确保推理后端 URL 配置正确（`INFERENCE_BACKEND_URL` 环境变量）
- 如果推理后端未运行，会返回 500 错误

---

## 5. 任务资源文件接口

### 下载任务的三维模型文件

**端点**: `GET /api/tasks/[taskId]/assets`

**描述**: 下载指定任务的三维模型资源文件（.sog 格式）。此接口会转发请求到推理后端。

**路径参数**:
- `taskId`: 任务 ID

**成功响应** (200 OK):
- Content-Type: `application/octet-stream`
- Content-Disposition: `attachment; filename="[taskId].sog"`
- Body: 二进制文件数据

**错误响应**:
- `404 Not Found`: 资源文件不存在
  ```json
  {
    "error": "Assets not found"
  }
  ```
- `500 Internal Server Error`: 服务器错误
  ```json
  {
    "error": "Failed to fetch assets"
  }
  ```

**测试示例 (curl)**:

```bash
# 下载任务资源文件
curl http://localhost:3000/api/tasks/71829384756254/assets \
  -o model.sog

# 或者直接在浏览器中访问
# http://localhost:3000/api/tasks/71829384756254/assets
```

**注意事项**:
- 此接口是推理后端的代理接口
- 文件会以附件形式下载
- 文件格式为 .sog（三维高斯模型格式）
- 需要确保推理后端 URL 配置正确（`INFERENCE_BACKEND_URL` 环境变量）
- 如果推理后端未运行，会返回 500 错误

---

## 环境变量配置

在测试前，请确保 `.env.local` 文件配置正确：

```bash
# 推理后端 API 地址
INFERENCE_BACKEND_URL=http://127.0.0.1:4000

# JWT 密钥（生产环境请使用强密钥）
JWT_SECRET=your_secret_key_here

# SQLite 数据库路径
DATABASE_PATH=./data/database.sqlite

# 临时文件存储路径
TEMP_PATH=./data/temp

# 最大并发上传数
MAX_UPLOADS=10

# 邮箱服务配置（用于发送验证码）
EMAIL_USER=your_email@qq.com
EMAIL_PASS=your_qq_email_authorization_code
```

**邮箱配置说明**：
- `EMAIL_USER`：发件邮箱地址（支持 QQ 邮箱）
- `EMAIL_PASS`：QQ 邮箱授权码（不是邮箱密码）
- 如何获取 QQ 邮箱授权码：
  1. 登录 QQ 邮箱网页版
  2. 设置 → 账户 → POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务
  3. 开启 SMTP 服务
  4. 生成授权码
- 如果未配置邮箱服务，验证码会在控制台输出（仅用于开发测试）

---

## 数据库表结构

### users 表
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,              -- 雪花算法生成的用户 ID
  email TEXT UNIQUE,                -- 邮箱（唯一）
  nickname TEXT UNIQUE,             -- 昵称（唯一，可为空）
  created_at TEXT,                  -- 创建时间（UTC ISO 8601 格式）
  last_login_at TEXT                -- 最后登录时间（UTC ISO 8601 格式）
);
```

### tasks 表
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,              -- 雪花算法生成的任务 ID
  user_id TEXT,                     -- 用户 ID（外键）
  status TEXT,                      -- 任务状态：waiting, finish, failure（小写）
  created_at TEXT,                  -- 创建时间（UTC ISO 8601 格式）
  completed_at TEXT,                -- 完成时间（UTC ISO 8601 格式，finish 或 failure 时设置）
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

**时间格式说明**：
- 所有时间字段使用 **UTC ISO 8601 格式**：`2026-03-09T12:34:56.789Z`
- 存储为 TEXT 类型，便于跨平台兼容
- 状态字段使用小写：`waiting`, `finish`, `failure`（与推理后端保持一致）
- `completed_at` 字段在任务状态变为 `finish` 或 `failure` 时都会被设置，表示任务结束的时间（无论成功还是失败）

---

## 完整测试流程示例

以下是一个完整的测试流程，演示如何使用所有 API：

```bash
#!/bin/bash

# 1. 发送验证码
echo "=== 1. 发送验证码 ==="
CODE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/code \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}')

echo $CODE_RESPONSE | jq .

# 2. 等待接收邮件中的验证码（或查看控制台输出）
echo -e "\n请输入收到的验证码："
read VERIFICATION_CODE

# 3. 用户登录/注册
echo -e "\n=== 2. 用户登录 ==="
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"user@example.com\", \"code\": \"$VERIFICATION_CODE\"}")

echo $LOGIN_RESPONSE | jq .

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.id')

echo "Token: $TOKEN"
echo "User ID: $USER_ID"

# 4. 上传视频
echo -e "\n=== 3. 上传视频 ==="
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:3000/api/tasks/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./test-video.mp4")

echo $UPLOAD_RESPONSE | jq .

TASK_ID=$(echo $UPLOAD_RESPONSE | jq -r '.task_id')
echo "Task ID: $TASK_ID"

# 5. 获取所有任务列表（首页信息流）
echo -e "\n=== 4. 获取所有任务列表 ==="
curl -s http://localhost:3000/api/tasks | jq .

# 6. 获取当前用户的任务列表
echo -e "\n=== 5. 获取用户任务列表 ==="
curl -s "http://localhost:3000/api/tasks?user_id=$USER_ID" | jq .

# 7. 获取任务元数据（需要等待任务完成）
echo -e "\n=== 6. 获取任务元数据 ==="
curl -s "http://localhost:3000/api/tasks/$TASK_ID/metadata" | jq .

# 8. 下载任务资源文件
echo -e "\n=== 7. 下载任务资源文件 ==="
curl -s "http://localhost:3000/api/tasks/$TASK_ID/assets" \
  -o "model_$TASK_ID.sog"

echo "文件已下载: model_$TASK_ID.sog"
```

保存为 `test-api.sh`，然后运行：
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 使用 Postman 测试

### 1. 导入环境变量

创建一个 Postman 环境，添加以下变量：
- `base_url`: `http://localhost:3000`
- `token`: （登录后自动设置）
- `user_id`: （登录后自动设置）
- `task_id`: （上传后自动设置）

### 2. 创建请求集合

#### 请求 0: 发送验证码
- Method: `POST`
- URL: `{{base_url}}/api/auth/code`
- Body (JSON):
  ```json
  {
    "email": "user@example.com"
  }
  ```

#### 请求 1: 登录
- Method: `POST`
- URL: `{{base_url}}/api/auth/login`
- Body (JSON):
  ```json
  {
    "email": "user@example.com",
    "code": "123456"
  }
  ```
- Tests (自动保存 token):
  ```javascript
  const response = pm.response.json();
  pm.environment.set("token", response.token);
  pm.environment.set("user_id", response.user.id);
  ```

#### 请求 2: 上传视频
- Method: `POST`
- URL: `{{base_url}}/api/tasks/upload`
- Headers:
  - `Authorization`: `Bearer {{token}}`
- Body (form-data):
  - `file`: 选择文件
- Tests:
  ```javascript
  const response = pm.response.json();
  pm.environment.set("task_id", response.task_id);
  ```

#### 请求 3: 获取任务列表
- Method: `GET`
- URL: `{{base_url}}/api/tasks?user_id={{user_id}}&page=1&limit=20`

#### 请求 4: 获取元数据
- Method: `GET`
- URL: `{{base_url}}/api/tasks/{{task_id}}/metadata`

#### 请求 5: 下载资源文件
- Method: `GET`
- URL: `{{base_url}}/api/tasks/{{task_id}}/assets`

---

## 常见问题

### Q1: 上传视频时返回 503 错误
**A**: 当前并发上传数已达到上限（默认 10），请等待其他上传完成或调整 `MAX_UPLOADS` 环境变量。

### Q2: 获取元数据或资源文件时返回 404
**A**: 可能原因：
1. 任务尚未完成（状态不是 `Finish`）
2. 推理后端未正确配置或未运行
3. 任务 ID 不存在

### Q3: Token 过期怎么办
**A**: Token 有效期为 7 天，过期后需要重新登录获取新 token。

### Q4: 如何查看数据库内容
**A**: 使用 SQLite 客户端工具：
```bash
sqlite3 ./data/database.sqlite

# 查看所有用户
SELECT * FROM users;

# 查看所有任务
SELECT * FROM tasks;

# 查看特定用户的任务
SELECT * FROM tasks WHERE user_id = '71829384756254';

# 查看不同状态的任务
SELECT * FROM tasks WHERE status = 'waiting';
SELECT * FROM tasks WHERE status = 'finish';
SELECT * FROM tasks WHERE status = 'failure';
```

---

## 性能测试建议

### 并发上传测试
使用 Apache Bench 或类似工具测试并发上传：

```bash
# 测试 20 个并发请求（应该有 10 个成功，10 个返回 503）
ab -n 20 -c 20 -H "Authorization: Bearer $TOKEN" \
  -p video.mp4 -T "multipart/form-data" \
  http://localhost:3000/api/tasks/upload
```

### 分页查询性能测试
```bash
# 测试大量数据的分页查询
for i in {1..100}; do
  curl -s "http://localhost:3000/api/tasks?page=$i&limit=20" > /dev/null
  echo "Page $i completed"
done
```

---

## 更新日志

- **2026-03-08**: 初始版本，包含所有 5 个 API 接口的文档
- **2026-03-08**: 添加临时文件即时清理机制和错误处理

---

## 临时文件清理机制

系统实现了即时的临时文件清理机制：

### 即时清理
- 当任务成功转发到推理后端后，立即删除临时文件
- 当任务转发失败时，立即删除临时文件并更新任务状态为 `Failure`
- 当上传过程中发生错误时，立即删除临时文件并更新任务状态为 `Failure`

### 手动清理
如果需要手动清理临时文件，可以直接删除临时目录：
```bash
# Windows
rmdir /s /q data\temp
mkdir data\temp

# Linux/Mac
rm -rf ./data/temp
mkdir -p ./data/temp
```

### 清理日志示例
```
Cleaned up temp file: G:\code\web\gaussian-studio-web\data\temp\71829384756254.mp4
Task 71829384756254 successfully forwarded to inference backend
```



---

## 任务状态同步机制

系统实现了自动的任务状态同步机制，定期从推理后端同步任务状态。

### 工作原理

1. **定时查询**：每 1 分钟自动执行一次同步
2. **批量查询**：查询所有 `waiting` 状态的任务
3. **状态更新**：当推理后端返回 `finish` 或 `failure` 状态时，更新 Next 数据库

### 推理后端接口

**端点**: `POST /status/batch`

**请求体**:
```json
{
  "task_ids": ["2030683749200564224", "2030683749200564225"]
}
```

**响应**:
```json
{
  "results": [
    {
      "task_id": "2030683749200564224",
      "status": "finish",
      "exists": true,
      "completed_at": "2026-03-09T00:43:32.526748"
    },
    {
      "task_id": "2030683749200564225",
      "status": "waiting",
      "exists": true
    }
  ]
}
```

### 状态说明

- `waiting`: 任务等待处理或正在处理中
- `finish`: 任务成功完成
- `failure`: 任务处理失败

### 日志示例

```
Starting task status sync scheduler (every 1 minute)
Syncing status for 3 waiting tasks
Task 2030683749200564224 status updated to: finish
Task 2030683749200564225 status updated to: failure
Successfully updated 2 tasks
```

### 注意事项

- 同步任务在服务器启动时自动开始
- 只同步 `waiting` 状态的任务
- 使用推理后端返回的 `completed_at` 时间戳
- 如果推理后端没有返回完成时间，使用当前时间


---

## 时间格式说明

### UTC ISO 8601 格式

所有 API 返回的时间字段都使用 **UTC ISO 8601 格式**：

```
2026-03-09T12:34:56.789Z
```

**格式说明**：
- `2026-03-09`：日期（年-月-日）
- `T`：日期和时间的分隔符
- `12:34:56.789`：时间（时:分:秒.毫秒）
- `Z`：表示 UTC 时区（零时区）

### JavaScript 中的使用

```javascript
// 解析时间字符串
const date = new Date("2026-03-09T12:34:56.789Z");

// 转换为本地时间显示
console.log(date.toLocaleString()); // 根据用户时区显示

// 获取时间戳
console.log(date.getTime()); // 毫秒时间戳

// 格式化显示
console.log(date.toLocaleDateString()); // 2026/3/9
console.log(date.toLocaleTimeString()); // 12:34:56
```

### 数据库查询示例

```sql
-- 查询最近 24 小时完成的任务
SELECT * FROM tasks 
WHERE completed_at > datetime('now', '-1 day')
AND status = 'finish';

-- 按完成时间排序
SELECT * FROM tasks 
WHERE completed_at IS NOT NULL
ORDER BY completed_at DESC;

-- 计算任务处理时长（秒）
SELECT id, 
  (julianday(completed_at) - julianday(created_at)) * 86400 as duration_seconds
FROM tasks 
WHERE completed_at IS NOT NULL;
```

### 注意事项

- 所有时间都是 UTC 时间，前端需要根据用户时区转换显示
- 时间精度到毫秒
- 数据库中存储为 TEXT 类型，便于跨平台兼容
- SQLite 的 `datetime()` 函数可以直接处理 ISO 8601 格式


---

## 邮箱验证码服务

### 工作原理

1. **验证码生成**：6 位随机数字（100000-999999）
2. **存储方式**：内存缓存（Map 结构）
3. **有效期**：5 分钟
4. **一次性使用**：验证成功后立即失效
5. **自动清理**：每 10 分钟清理一次过期验证码

### 邮件模板

发送的邮件包含：
- 发件人：Moment 3D
- 主题：Moment 3D - 您的登录/注册验证码
- 内容：HTML 格式，包含验证码和有效期说明

### 安全特性

- 验证码使用后立即失效，防止重复使用
- 验证码有效期 5 分钟，过期自动失效
- 同一邮箱重复请求会覆盖之前的验证码
- 验证失败不区分具体原因（不存在/过期/错误），防止信息泄露

### 开发测试

如果未配置邮箱服务（`EMAIL_USER` 和 `EMAIL_PASS`），验证码会在控制台输出：

```
Email credentials not configured. Skipping email send. Code is: 123456
```

这样可以在开发环境中快速测试，无需配置真实的邮箱服务。

### 生产环境配置

1. 获取 QQ 邮箱授权码：
   - 登录 QQ 邮箱网页版
   - 设置 → 账户 → POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务
   - 开启 SMTP 服务
   - 生成授权码（16 位字符）

2. 配置环境变量：
   ```bash
   EMAIL_USER=your_email@qq.com
   EMAIL_PASS=your_authorization_code
   ```

3. 重启服务器

### 故障排查

**问题：收不到验证码邮件**
- 检查邮箱配置是否正确
- 检查控制台是否有错误日志
- 检查邮箱是否在垃圾邮件中
- 确认 QQ 邮箱 SMTP 服务已开启

**问题：验证码总是提示无效**
- 检查验证码是否过期（5 分钟）
- 检查验证码是否已使用过
- 检查邮箱地址是否一致
- 查看控制台日志确认验证码

### 技术栈

- **nodemailer**：邮件发送库
- **QQ 邮箱 SMTP**：smtp.qq.com:465 (SSL)
- **内存缓存**：Map 数据结构
- **定时清理**：setInterval 每 10 分钟
