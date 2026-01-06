import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // 增加请求体大小限制到 50MB
    serverComponentsExternalPackages: [],
  },
  // 配置 API 路由的请求体大小限制
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
  /** Uncomment this if you are using webpack and not Turbopack */
  // webpack: (config) => {
  //   config.module.parser = {
  //     ...config.module.parser,
  //     javascript: {
  //       ...config.module.parser?.javascript,
  //       url: false, // disable parsing of `new URL()` syntax
  //     },
  //   };
  //   return config;
  // },
};

export default nextConfig;