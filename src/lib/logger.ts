import { prisma } from "@/lib/prisma";

export async function createLog(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  details?: string
) {
  try {
    // Verificar si el usuario existe
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });
    
    if (!userExists) {
      // Buscar el primer admin disponible
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true }
      });
      
      if (adminUser) {
        userId = adminUser.id;
      } else {
        return null;
      }
    }
    
    const log = await prisma.changeLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details,
      },
    });
    return log;
  } catch (error) {
    console.error("Error creating log:", error);
    return null;
  }
}
