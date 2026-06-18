const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function main() {
  const hash = bcrypt.hashSync('123456', 10);
  console.log('Generated hash:', hash);
  
  const conn = await mysql.createConnection({
    host: '172.19.0.13',
    user: 'root',
    password: 'Hao-20061218',
    database: 'zhishuai'
  });
  
  await conn.execute("UPDATE User SET password = ? WHERE phone = '18601655222'", [hash]);
  
  const [rows] = await conn.execute("SELECT phone, LEFT(password, 30) as pwd FROM User WHERE phone = '18601655222'");
  console.log('Updated user:', JSON.stringify(rows));
  
  await conn.end();
}

main().catch(console.error);
