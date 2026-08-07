#!/usr/bin/env node
// Create agent user in database
require('dotenv').config({ path: '/var/www/zhishuai/server/.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function main() {
  const prisma = new PrismaClient();

  const password = bcrypt.hashSync('123456', 12);
  const userId = crypto.randomUUID();
  const now = new Date();

  try {
    const user = await prisma.user.create({
      data: {
        id: userId,
        phone: '13900000099',
        name: '代理商',
        role: 'agent',
        status: 'active',
        password,
        createdAt: now,
        updatedAt: now,
      },
    });
    console.log('Created agent user:', JSON.stringify(user));
  } catch (err) {
    console.error('Error:', err.message);
    // Try to find existing
    const existing = await prisma.user.findFirst({ where: { phone: '13900000099' } });
    if (existing) {
      console.log('Agent user already exists:', JSON.stringify(existing));
    } else {
      console.error('Failed to create agent user');
    }
  }
  await prisma.$disconnect();
}

main();
