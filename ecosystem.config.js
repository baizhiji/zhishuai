module.exports = {
  apps: [
    {
      name: 'zhishuai-api',
      script: 'dist/index.js',
      cwd: '/var/www/zhishuai/server',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        LD_LIBRARY_PATH: '/usr/lib/x86_64-linux-gnu:/usr/lib',
        // FCM推送配置（通过环境变量传入，不硬编码）
        GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
        GOOGLE_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
        APNS_KEY_ID: process.env.APNS_KEY_ID || '',
        APNS_TEAM_ID: process.env.APNS_TEAM_ID || '',
        APNS_PRIVATE_KEY: process.env.APNS_PRIVATE_KEY || '',
        VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || '',
        VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || '',
        VAPID_SUBJECT: process.env.VAPID_SUBJECT || '',
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
