module.exports = {
  apps: [
    {
      name: 'zhishuai-api',
      script: 'server/dist/index.js',
      cwd: '/www/zhishuai',
      env: {
        NODE_ENV: 'production',
        LD_LIBRARY_PATH: '/usr/lib/x86_64-linux-gnu:/usr/lib'
      }
    }
  ]
};
