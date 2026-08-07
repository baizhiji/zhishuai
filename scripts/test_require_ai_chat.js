const aiChat = require('/var/www/zhishuai/server/src/routes/ai-chat');
console.log('require ai-chat type:', typeof aiChat);
console.log('keys:', Object.keys(aiChat));
console.log('is function:', typeof aiChat === 'function');
console.log('default:', typeof aiChat.default);
