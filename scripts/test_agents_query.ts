const { prisma } = require('../server/src/utils/db');

async function main() {
  try {
    const agents = await prisma.agent.findMany({
      where: {},
      include: {
        User: {
          select: { phone: true, name: true, avatar: true, createdAt: true }
        },
        other_Agent: { select: { id: true } },
        _count: { select: { UserAgentRelation: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log('SUCCESS:', JSON.stringify(agents, null, 2));
  } catch (e: any) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
