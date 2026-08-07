const auth = require('/var/www/zhishuai/server/src/routes/auth');
console.log('require auth type:', typeof auth);
console.log('keys:', Object.keys(auth).slice(0, 5));
console.log('is function:', typeof auth === 'function');
console.log('default:', typeof auth.default);
