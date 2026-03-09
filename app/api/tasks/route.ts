import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // 参数验证和解析
    const userIdParam = searchParams.get('user_id');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    // 验证 user_id（如果提供）
    let userId: string | null = null;
    if (userIdParam !== null) {
      if (userIdParam.trim() === '') {
        return NextResponse.json({ error: 'user_id cannot be empty' }, { status: 400 });
      }
      userId = userIdParam;
    }

    // 验证和解析 page
    let page = 1;
    if (pageParam !== null) {
      if (pageParam.trim() === '') {
        return NextResponse.json({ error: 'page cannot be empty' }, { status: 400 });
      }
      page = parseInt(pageParam, 10);
      if (isNaN(page) || page < 1) {
        return NextResponse.json({ error: 'page must be a positive integer' }, { status: 400 });
      }
    }

    // 验证和解析 limit
    let limit = 20;
    if (limitParam !== null) {
      if (limitParam.trim() === '') {
        return NextResponse.json({ error: 'limit cannot be empty' }, { status: 400 });
      }
      limit = parseInt(limitParam, 10);
      if (isNaN(limit) || limit < 1) {
        return NextResponse.json({ error: 'limit must be a positive integer' }, { status: 400 });
      }
      if (limit > 100) {
        return NextResponse.json({ error: 'limit cannot exceed 100' }, { status: 400 });
      }
    }

    const offset = (page - 1) * limit;

    let query = `
      SELECT t.id as task_id, t.completed_at, u.nickname as user_nickname
      FROM tasks t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.status = 'finish'
    `;

    const params: any[] = [];

    if (userId) {
      query += ` AND t.user_id = ?`;
      params.push(userId);
    }

    query += ` ORDER BY t.completed_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const tasks = db.prepare(query).all(...params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM tasks WHERE status = 'finish'`;
    const countParams: any[] = [];
    if (userId) {
      countQuery += ` AND user_id = ?`;
      countParams.push(userId);
    }
    const { total } = db.prepare(countQuery).get(...countParams) as { total: number };

    // 计算总页数
    const totalPages = Math.ceil(total / limit);

    // 如果请求的页码超出范围，返回空数据（而不是错误）
    const data = page > totalPages && total > 0 ? [] : tasks.map((task: any) => ({
      task_id: task.task_id,
      user_nickname: task.user_nickname,
      completed_at: task.completed_at,
    }));

    return NextResponse.json({
      data,
      pagination: {
        total,
        page,
        limit,
        total_pages: totalPages,
        has_more: page < totalPages
      }
    });

  } catch (error) {
    console.error('Fetch tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
