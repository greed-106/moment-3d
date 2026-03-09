/**
 * 获取当前 UTC 时间的 ISO 8601 字符串
 * @returns UTC ISO 8601 格式的时间字符串，例如：2026-03-09T12:34:56.789Z
 */
export function getCurrentUTCTimestamp(): string {
  return new Date().toISOString();
}
