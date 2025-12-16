
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking Prisma Client fields...');
  // We can't easily inspect types at runtime, but we can try to create a dummy record or just check if the property exists on the model delegate?
  // No, the model delegate is just an object.
  
  // Let's try to see if we can access the field in a query
  try {
    // Just try to count, but selecting the field
    const count = await prisma.draftPlan.findMany({
      select: {
        id: true,
        allyTierListId: true // This will throw if the field doesn't exist in the client's knowledge of the schema
      },
      take: 1
    })
    console.log('Field allyTierListId exists in client!');
  } catch (e) {
    console.error('Error accessing field:', e);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
