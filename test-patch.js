
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Attempting to create patch...');
    const patch = await prisma.patch.create({
      data: {
        version: '15.15',
        description: 'un buen parche',
        startDate: new Date('2025-12-01'),
        officialLink: 'https://www.leagueoflegends.com/es-es/news/game-updates/patch-15-15-notes/'
      }
    });
    console.log('Patch created successfully:', patch);
    
    // Clean up
    await prisma.patch.delete({
      where: { id: patch.id }
    });
    console.log('Test patch deleted.');
  } catch (error) {
    console.error('Error creating patch:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
