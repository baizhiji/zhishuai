module.exports = {
  apps: [
    {
      name: 'zhishuai-api',
      script: 'dist/index.js',
      cwd: '/var/www/zhishuai/server',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        LD_LIBRARY_PATH: '/usr/lib/x86_64-linux-gnu:/usr/lib'
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      error_file: '/var/log/zhishuai/api-error.log',
      out_file: '/var/log/zhishuai/api-out.log',
      time: true,
      kill_timeout: 10000,
      wait_ready: false,
      listen_timeout: 10000,
    },
    {
      name: 'zhishuai-web',
      script: './node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: '/var/www/zhishuai/web',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      error_file: '/var/log/zhishuai/web-error.log',
      out_file: '/var/log/zhishuai/web-out.log',
      time: true,
    }
  ]
};
