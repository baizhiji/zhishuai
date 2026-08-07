import express from 'express';
import aiChatRoutes from './src/routes/ai-chat';

const app = express();
app.use(express.json());
app.use('/api/ai-chat', aiChatRoutes);

const server = app.listen(3999, () => {
  console.log('test server on 3999');
});

setTimeout(() => {
  fetch('http://localhost:3999/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'aliyun', model: 'qwen-plus', message: '你好' })
  }).then(r => r.text()).then(t => {
    console.log('test response:', t.slice(0, 200));
    server.close();
    process.exit(0);
  }).catch(e => {
    console.error('test error:', e.message);
    server.close();
    process.exit(1);
  });
}, 2000);
