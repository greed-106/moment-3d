import db from './db';
import axios from 'axios';
import { getCurrentUTCTimestamp } from './datetime';

const BACKEND_URL = process.env.INFERENCE_BACKEND_URL || 'http://localhost:8000';
const SYNC_INTERVAL = 60 * 1000; // 1 分钟

let syncTimer: NodeJS.Timeout | null = null;

/**
 * 同步任务状态
 */
async function syncTaskStatus() {
  try {
    // 查询所有 waiting 状态的任务
    const waitingTasks = db.prepare('SELECT id FROM tasks WHERE status = ?').all('waiting') as { id: string }[];

    if (waitingTasks.length === 0) {
      console.log('No waiting tasks to sync');
      return;
    }

    const taskIds = waitingTasks.map(task => task.id);
    console.log(`Syncing status for ${taskIds.length} waiting tasks`);

    // 批量查询推理后端的任务状态
    const response = await axios.post(`${BACKEND_URL}/status/batch`, {
      task_ids: taskIds
    });

    const results = response.data.results as Array<{
      task_id: string;
      status: 'waiting' | 'finish' | 'failure';
      exists: boolean;
      completed_at?: string;
    }>;

    // 更新数据库中的任务状态
    let updatedCount = 0;
    for (const result of results) {
      if (!result.exists) {
        console.warn(`Task ${result.task_id} does not exist in inference backend`);
        continue;
      }

      // 只有当状态变为 finish 或 failure 时才更新
      if (result.status === 'finish' || result.status === 'failure') {
        if (result.completed_at) {
          // 使用推理后端返回的完成时间
          db.prepare('UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?')
            .run(result.status, result.completed_at, result.task_id);
        } else {
          // 如果没有完成时间，使用当前 UTC 时间
          db.prepare('UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?')
            .run(result.status, getCurrentUTCTimestamp(), result.task_id);
        }
        updatedCount++;
        console.log(`Task ${result.task_id} status updated to: ${result.status}`);
      }
    }

    if (updatedCount > 0) {
      console.log(`Successfully updated ${updatedCount} tasks`);
    }

  } catch (error) {
    console.error('Error syncing task status:', error);
  }
}

/**
 * 启动定时同步任务
 */
export function startTaskStatusSync() {
  if (syncTimer) {
    console.log('Task status sync already running');
    return;
  }

  console.log('Starting task status sync scheduler (every 1 minute)');
  
  // 立即执行一次
  syncTaskStatus();

  // 每分钟执行一次
  syncTimer = setInterval(() => {
    syncTaskStatus();
  }, SYNC_INTERVAL);
}

/**
 * 停止定时同步任务
 */
export function stopTaskStatusSync() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
    console.log('Task status sync stopped');
  }
}
