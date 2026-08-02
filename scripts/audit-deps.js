/**
 * 依赖审计脚本 - 解析 package-lock.json 提取所有依赖版本
 * 用于没有 npm CLI 的环境下进行依赖安全检查
 */
const fs = require('fs');
const path = require('path');

function walkDeps(deps, parent, result) {
  if (!deps) return;
  for (const [name, info] of Object.entries(deps)) {
    const key = parent ? `${name} (via ${parent})` : name;
    result[name] = {
      version: info.version,
      resolved: info.resolved || '',
      parent: parent || 'direct',
    };
    if (info.dependencies) {
      walkDeps(info.dependencies, key, result);
    }
  }
}

function auditDir(dir, label) {
  const lockFile = path.join(dir, 'package-lock.json');
  if (!fs.existsSync(lockFile)) {
    console.log(`[${label}] package-lock.json not found`);
    return {};
  }
  try {
    const lock = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
    const result = {};
    if (lock.packages) {
      // lockfile v2/v3
      for (const [pkgPath, info] of Object.entries(lock.packages)) {
        if (pkgPath === '') continue;
        let name = pkgPath.split('node_modules/').pop();
        if (!name) name = pkgPath;
        // Skip local packages
        if (name.startsWith('.')) continue;
        result[name] = {
          version: info.version,
          resolved: info.resolved || '',
          parent: 'direct',
        };
      }
    } else if (lock.dependencies) {
      walkDeps(lock.dependencies, null, result);
    }
    const count = Object.keys(result).length;
    console.log(`[${label}] Found ${count} unique packages in lockfile`);
    return result;
  } catch (e) {
    console.log(`[${label}] Error reading lockfile: ${e.message}`);
    return {};
  }
}

const webDeps = auditDir(path.resolve('c:/Users/Administrator/zhishuai/web'), 'WEB');
const serverDeps = auditDir(path.resolve('c:/Users/Administrator/zhishuai/server'), 'SERVER');

// Output summary
const output = {
  web: {
    packages: Object.keys(webDeps).length,
    keyDeps: {},
  },
  server: {
    packages: Object.keys(serverDeps).length,
    keyDeps: {},
  },
};

// Extract key dependencies with versions
const KEY_PACKAGES = [
  'next', 'react', 'react-dom', 'axios', 'xlsx', 'postcss',
  'tailwindcss', 'glob', 'minimatch', 'form-data', 'ws', 'braces',
  'semver', 'eslint', 'typescript', '@prisma/client', 'prisma',
  'express', 'jsonwebtoken', 'helmet', 'mysql2', 'playwright',
  'multer', 'zod', 'bcryptjs', 'cross-spawn', 'micromatch', 'nanoid',
  'path-to-regexp', 'body-parser', 'cookie', 'debug', 'http-proxy',
  'node-fetch', 'undici', 'webpack', 'rollup', 'vite', 'esbuild',
];

for (const pkg of KEY_PACKAGES) {
  if (webDeps[pkg]) {
    output.web.keyDeps[pkg] = webDeps[pkg].version;
  }
  if (serverDeps[pkg]) {
    output.server.keyDeps[pkg] = serverDeps[pkg].version;
  }
}

console.log('\n===== KEY DEPENDENCIES =====');
console.log(JSON.stringify(output, null, 2));
