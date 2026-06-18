module.exports = {
  apps: [
    {
      name: 'zhishuai-api',
      script: 'dist/index.js',
      cwd: 'C:/Users/Administrator/zhishuai/server',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      error_file: 'C:/Users/Administrator/zhishuai/logs/api-error.log',
      out_file: 'C:/Users/Administrator/zhishuai/logs/api-out.log',
      time: true,
      kill_timeout: 10000,
      listen_timeout: 10000,
    },
    {
      name: 'zhishuai-web',
      script: './node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: 'C:/Users/Administrator/zhishuai/apk',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      error_file: 'C:/Users/Administrator/zhishuai/logs/web-error.log',
      out_file: 'C:/Users/Administrator/zhishuai/logs/web-out.log',
      time: true,
    }
  ]
};
