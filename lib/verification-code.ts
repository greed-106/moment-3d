// 内存缓存验证码，简单实现
const codeCache = new Map<string, { code: string; expiresAt: number }>();

const CODE_EXPIRATION_MS = 5 * 60 * 1000; // 5分钟过期

export function generateAndCacheCode(email: string): string {
  // 生成 6 位随机验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // 存入缓存
  codeCache.set(email, {
    code,
    expiresAt: Date.now() + CODE_EXPIRATION_MS,
  });

  return code;
}

export function verifyCode(email: string, code: string): boolean {
  const cached = codeCache.get(email);
  
  if (!cached) {
    return false; // 验证码不存在
  }

  if (Date.now() > cached.expiresAt) {
    codeCache.delete(email); // 验证码已过期，删除
    return false;
  }

  if (cached.code !== code) {
    return false; // 验证码不匹配
  }

  // 验证通过后清除验证码，防止重复使用
  codeCache.delete(email);
  return true;
}

// 可选：定期清理过期验证码，防止内存泄漏
setInterval(() => {
  const now = Date.now();
  for (const [email, cached] of codeCache.entries()) {
    if (now > cached.expiresAt) {
      codeCache.delete(email);
    }
  }
}, 10 * 60 * 1000); // 每 10 分钟清理一次
