import nodemailer from 'nodemailer';

// 创建 nodemailer 传输器
// 使用 QQ 邮箱的 SMTP 服务器
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465, // SSL 端口
  secure: true, // 使用 SSL
  auth: {
    user: process.env.EMAIL_USER, // 你的 QQ 邮箱地址
    pass: process.env.EMAIL_PASS, // 你的 QQ 邮箱授权码
  },
});

export async function sendVerificationCodeEmail(to: string, code: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured. Skipping email send. Code is:', code);
    return;
  }

  const mailOptions = {
    from: `"Moment 3D" <${process.env.EMAIL_USER}>`, // 发件人
    to, // 收件人
    subject: '[Moment 3D] - 您的登录/注册验证码', // 邮件主题
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">欢迎来到 Moment 3D</h2>
        <p>您的验证码是：</p>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <h1 style="color: #000000ff; margin: 0; letter-spacing: 5px;">${code}</h1>
        </div>
        <p>此验证码在 <strong>10分钟</strong> 内有效。请勿将此验证码泄露给他人。</p>
        <p style="color: #888; font-size: 12px; margin-top: 40px;">如果这不是您的操作，请忽略此邮件。</p>
      </div>
    `, // 邮件 HTML 内容
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${to}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
}
