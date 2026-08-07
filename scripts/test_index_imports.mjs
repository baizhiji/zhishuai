import express from 'express';
import authRoutes from './src/routes/auth';
import aiChatRoutes from './src/routes/ai-chat';

console.log('auth type:', typeof authRoutes, 'default:', typeof authRoutes?.default);
console.log('ai-chat type:', typeof aiChatRoutes, 'default:', typeof aiChatRoutes?.default);

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/ai-chat', aiChatRoutes);

const server = app.listen(3998, () => {
  console.log('test server on 3998');
});

setTimeout(async () => {
  const r1 = await fetch('http://localhost:3998/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '13800000001', password: '123456' })
  });
  console.log('auth status:', r1.status);
  const r2 = await fetch('http://localhost:3998/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'aliyun', model: 'qwen-plus', message: '你好' })
  });
  console.log('ai-chat status:', r2.status);
  server.close();
  process.exit(0);
}, 2000);
