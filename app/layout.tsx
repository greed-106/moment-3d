import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moment3D - 定格瞬间，封存世界",
  description: "将照片转换为 3D 高斯泼溅场景",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="bg-zinc-950 text-white antialiased">{children}</body>
    </html>
  );
}
