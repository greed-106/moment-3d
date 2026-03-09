import { NextRequest, NextResponse } from 'next/server';
import { generateAndCacheCode } from '@/lib/verification-code';
import { sendVerificationCodeEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // 生成并缓存验证码
    const code = generateAndCacheCode(email);

    // 发送邮件
    try {
      await sendVerificationCodeEmail(email, code);
      return NextResponse.json({ message: 'Verification code sent successfully' });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      return NextResponse.json({ error: 'Failed to send verification email. Please try again later.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Generate code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
