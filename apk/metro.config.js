const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// 设置项目根目录
config.root = projectRoot;

// 设置 nodeModules 路径
config.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// 设置 watchFolders 指向当前项目
config.watchFolders = [projectRoot];

module.exports = config;
