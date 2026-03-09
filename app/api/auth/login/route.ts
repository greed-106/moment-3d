import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { snowflake } from '@/lib/snowflake';
import { signToken, verifyToken } from '@/lib/jwt';
import { getCurrentUTCTimestamp } from '@/lib/datetime';
import { verifyCode } from '@/lib/verification-code';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code, access_token } = body;

    // 1. 如果有 access_token，尝试自动登录
    if (access_token) {
      const payload = await verifyToken(access_token);
      if (payload && payload.id) {
        // 更新最后登录时间
        db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(getCurrentUTCTimestamp(), payload.id);
        
        return NextResponse.json({
          token: access_token,
          user: { id: payload.id }
        });
      }
    }

    // 2. 如果没有 token 或 token 失效，验证 email 和 code
    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // 验证验证码
    if (!verifyCode(email, code)) {
      // 这里的提示虽然宽泛，但为了安全通常不区分是不存在、过期还是错误，也可以根据需要细分
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    // 3. 查找用户
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string } | undefined;

    let userId = '';

    if (user) {
      // 老用户登录
      userId = user.id;
      db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(getCurrentUTCTimestamp(), userId);
    } else {
      // 新用户注册
      userId = snowflake.nextId();
      db.prepare(
        'INSERT INTO users (id, email, created_at, last_login_at) VALUES (?, ?, ?, ?)'
      ).run(userId, email, getCurrentUTCTimestamp(), getCurrentUTCTimestamp());
    }

    // 4. 生成新 JWT
    const token = await signToken({ id: userId });

    return NextResponse.json({
      token,
      user: { id: userId, email }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
