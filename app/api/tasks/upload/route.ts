import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { snowflake } from '@/lib/snowflake';
import db from '@/lib/db';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';
import { startTaskStatusSync } from '@/lib/task-status-sync';
import { getCurrentUTCTimestamp } from '@/lib/datetime';

// 全局并发计数器和配置
let currentUploads = 0;
const MAX_UPLOADS = parseInt(process.env.MAX_UPLOADS || '10', 10);
const TEMP_PATH = process.env.TEMP_PATH || path.join(process.cwd(), 'data', 'temp');

// 简单的单并发队列用于转发任务到推理后端
const queue: (() => Promise<void>)[] = [];
let isProcessingQueue = false;

// 确保临时目录存在
if (!fs.existsSync(TEMP_PATH)) {
  fs.mkdirSync(TEMP_PATH, { recursive: true });
}

// 启动任务状态同步定时器（只启动一次）
let statusSyncStarted = false;
if (!statusSyncStarted) {
  startTaskStatusSync();
  statusSyncStarted = true;
}

/**
 * 清理临时文件
 * @param filePath 文件路径
 */
async function cleanupTempFile(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      console.log(`Cleaned up temp file: ${filePath}`);
    }
  } catch (error) {
    console.error(`Failed to cleanup temp file ${filePath}:`, error);
  }
}

/**
 * 更新任务状态
 * @param taskId 任务 ID
 * @param status 状态
 */
function updateTaskStatus(taskId: string, status: 'waiting' | 'finish' | 'failure') {
  try {
    if (status === 'finish' || status === 'failure') {
      // 完成或失败时都记录完成时间
      db.prepare('UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?').run(status, getCurrentUTCTimestamp(), taskId);
    } else {
      db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(status, taskId);
    }
    console.log(`Task ${taskId} status updated to: ${status}`);
  } catch (error) {
    console.error(`Failed to update task ${taskId} status:`, error);
  }
}

async function processQueue() {
  if (isProcessingQueue || queue.length === 0) return;
  isProcessingQueue = true;

  while (queue.length > 0) {
    const task = queue.shift();
    if (task) {
      try {
        await task();
      } catch (error) {
        console.error('Error processing background task:', error);
      }
    }
  }

  isProcessingQueue = false;
}

export async function POST(req: NextRequest) {
  // 1. Next 后端限流
  if (currentUploads >= MAX_UPLOADS) {
    return NextResponse.json({ error: 'Service Unavailable: Too many uploads' }, { status: 503 });
  }

  currentUploads++;

  let taskId: string | null = null;
  let filePath: string | null = null;

  try {
    // 验证用户身份
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.id;

    // 解析 FormData
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // 生成任务 ID
    taskId = snowflake.nextId();
    
    // 2. 存储文件
    const extension = path.extname(file.name) || '';
    filePath = path.join(TEMP_PATH, `${taskId}${extension}`);
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.promises.writeFile(filePath, buffer);

    // 3. 写入数据库
    db.prepare('INSERT INTO tasks (id, user_id, status, created_at) VALUES (?, ?, ?, ?)').run(taskId, userId, 'waiting', getCurrentUTCTimestamp());

    // 4. 异步转发任务
    const currentTaskId = taskId;
    const currentFilePath = filePath;
    const currentFileName = file.name;
    const currentFileType = file.type || 'application/octet-stream'; // 保存文件类型
    
    queue.push(async () => {
      try {
        // 使用流式读取文件
        const fileStream = fs.createReadStream(currentFilePath);
        
        const backendFormData = new FormData();
        backendFormData.append('task_id', currentTaskId);
        backendFormData.append('file', fileStream, {
          filename: currentFileName,
          contentType: currentFileType,
        });

        const backendUrl = process.env.INFERENCE_BACKEND_URL || 'http://localhost:8000';
        
        // 使用 axios 转发给推理后端
        const response = await axios.post(`${backendUrl}/upload`, backendFormData, {
          headers: backendFormData.getHeaders(),
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        });

        console.log(`Task ${currentTaskId} successfully forwarded to inference backend`);
        
        // 上传成功后清理临时文件
        await cleanupTempFile(currentFilePath);
        
      } catch (error: any) {
        console.error(`Failed to forward task ${currentTaskId} to inference backend:`, error);
        
        // 更新任务状态为失败
        updateTaskStatus(currentTaskId, 'failure');
        
        // 清理临时文件
        await cleanupTempFile(currentFilePath);
      }
    });

    // 触发队列处理（异步执行，不等待）
    processQueue();

    // 立即返回给前端
    return NextResponse.json({
      task_id: taskId,
      message: 'Task uploaded and queued'
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // 如果在上传过程中出错，清理临时文件并更新状态
    if (taskId) {
      updateTaskStatus(taskId, 'failure');
    }
    
    if (filePath) {
      await cleanupTempFile(filePath);
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    currentUploads--;
  }
}
