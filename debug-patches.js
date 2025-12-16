
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('--- PATCHES ---');
    const patches = await prisma.patch.findMany({
      include: {
        _count: {
          select: { matches: true }
        }
      }
    });
    console.log(JSON.stringify(patches, null, 2));

    console.log('\n--- MATCHES ---');
    const matches = await prisma.match.findMany({
      select: {
        id: true,
        type: true,
        gameVersion: true,
        patchId: true
      }
    });
    console.log(JSON.stringify(matches, null, 2));

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
