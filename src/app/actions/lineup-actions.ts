'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveLineupConfiguration(data: {
  name: string;
  lineupId?: string;
  assignments: any;
  filters: any;
}) {
  try {
    const config = await prisma.lineupConfiguration.create({
      data: {
        name: data.name,
        lineupId: data.lineupId || null,
        assignments: data.assignments,
        filters: data.filters,
      },
    });
    
    revalidatePath('/analysis/lineup');
    return { success: true, data: config };
  } catch (error) {
    console.error('Error saving lineup configuration:', error);
    return { success: false, error: 'Failed to save configuration' };
  }
}

export async function getLineupConfigurations(lineupId?: string) {
  try {
    const where = lineupId ? { lineupId } : {};
    const configs = await prisma.lineupConfiguration.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        lineup: {
          select: { name: true }
        }
      }
    });
    return { success: true, data: configs };
  } catch (error) {
    console.error('Error fetching lineup configurations:', error);
    return { success: false, error: 'Failed to fetch configurations' };
  }
}

export async function deleteLineupConfiguration(id: string) {
  try {
    await prisma.lineupConfiguration.delete({
      where: { id }
    });
    revalidatePath('/analysis/lineup');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete configuration' };
  }
}
