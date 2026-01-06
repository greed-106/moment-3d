#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

console.log('🚀 开始构建和打包 Moment3D...\n');

// 检查必要的依赖
try {
  require('archiver');
} catch (error) {
  console.error('❌ 缺少 archiver 依赖，正在安装...');
  execSync('npm install archiver --save-dev', { stdio: 'inherit' });
  console.log('✅ archiver 安装完成\n');
}

// 1. 构建项目
console.log('📦 正在构建项目...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ 项目构建完成\n');
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}

// 2. 检查必要文件是否存在
const requiredFiles = [
  '.next',
  'public',
  'package.json',
  'package-lock.json'
];

const optionalFiles = [
  '.env.local'
];

console.log('🔍 检查必要文件...');
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ 缺少必要文件: ${file}`);
    process.exit(1);
  }
  console.log(`✅ ${file}`);
}

for (const file of optionalFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`⚠️  ${file} (可选文件，未找到)`);
  }
}

// 3. 创建打包文件
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const packageName = `moment3d-${timestamp}.zip`;

console.log(`\n📦 正在创建部署包: ${packageName}`);

const output = fs.createWriteStream(packageName);
const archive = archiver('zip', {
  zlib: { level: 9 } // 最高压缩级别
});

output.on('close', function() {
  const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`✅ 打包完成! 文件大小: ${sizeInMB} MB`);
  console.log(`📁 部署包: ${packageName}`);
  console.log('\n🚀 部署步骤:');
  console.log(`1. 上传 ${packageName} 到服务器`);
  console.log('2. 解压: unzip ' + packageName);
  console.log('3. 安装依赖: npm ci --only=production');
  console.log('4. 配置环境变量 .env.local');
  console.log('5. 启动服务: npm start');
});

archive.on('error', function(err) {
  console.error('❌ 打包失败:', err);
  process.exit(1);
});

archive.pipe(output);

// 添加文件到压缩包
console.log('📁 添加文件到压缩包...');

// 添加 .next 目录
archive.directory('.next/', '.next/');
console.log('  ✅ .next/');

// 添加 public 目录
archive.directory('public/', 'public/');
console.log('  ✅ public/');

// 添加 package.json
archive.file('package.json', { name: 'package.json' });
console.log('  ✅ package.json');

// 添加 package-lock.json
archive.file('package-lock.json', { name: 'package-lock.json' });
console.log('  ✅ package-lock.json');

// 添加 .env.local (如果存在)
if (fs.existsSync('.env.local')) {
  archive.file('.env.local', { name: '.env.local' });
  console.log('  ✅ .env.local');
}

// 完成打包
archive.finalize();