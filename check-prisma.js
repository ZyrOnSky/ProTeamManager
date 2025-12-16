
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

console.log('Checking prisma.patch...');
if (prisma.patch) {
  console.log('prisma.patch exists!');
} else {
  console.error('prisma.patch is UNDEFINED. Client might be outdated.');
}
prisma.$disconnect();
