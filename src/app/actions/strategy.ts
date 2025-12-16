'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// --- Helper Actions ---

export async function getAllLineups() {
  try {
    const lineups = await prisma.lineup.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: lineups };
  } catch (error) {
    console.error('Failed to fetch lineups:', error);
    return { success: false, error: 'Failed to fetch lineups' };
  }
}

// --- Playbook Actions ---

export async function createPlaybook(data: {
  title: string;
  description?: string;
  lineupId?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    const playbook = await prisma.playbook.create({
      data: {
        title: data.title,
        description: data.description,
        lineupId: data.lineupId,
        creatorId: session?.user?.id as string | undefined,
      },
    });
    revalidatePath('/strategy');
    return { success: true, data: playbook };
  } catch (error) {
    console.error('Failed to create playbook:', error);
    return { success: false, error: 'Failed to create playbook' };
  }
}

export async function getPlaybooks(lineupId?: string) {
  try {
    const where = lineupId ? { lineupId } : {};
    const playbooks = await prisma.playbook.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { scenes: true },
        },
        lineup: {
          select: { name: true },
        },
        creator: {
          select: { name: true, realName: true },
        },
      },
    });
    return { success: true, data: playbooks };
  } catch (error) {
    console.error('Failed to fetch playbooks:', error);
    return { success: false, error: 'Failed to fetch playbooks' };
  }
}

export async function getPlaybook(id: string) {
  try {
    const playbook = await prisma.playbook.findUnique({
      where: { id },
      include: {
        scenes: {
          orderBy: { order: 'asc' },
        },
      },
    });
    return { success: true, data: playbook };
  } catch (error) {
    console.error('Failed to fetch playbook:', error);
    return { success: false, error: 'Failed to fetch playbook' };
  }
}

export async function updatePlaybook(id: string, data: {
  title?: string;
  description?: string;
}) {
  try {
    const playbook = await prisma.playbook.update({
      where: { id },
      data,
    });
    revalidatePath('/strategy');
    revalidatePath(`/strategy/playbook/${id}`);
    return { success: true, data: playbook };
  } catch (error) {
    console.error('Failed to update playbook:', error);
    return { success: false, error: 'Failed to update playbook' };
  }
}

export async function deletePlaybook(id: string) {
  try {
    await prisma.playbook.delete({
      where: { id },
    });
    revalidatePath('/strategy');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete playbook:', error);
    return { success: false, error: 'Failed to delete playbook' };
  }
}

// --- Scene Actions ---

export async function createScene(data: {
  playbookId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
}) {
  try {
    // Get max order for siblings to append at the end
    const siblings = await prisma.strategyScene.findMany({
      where: {
        playbookId: data.playbookId,
        parentId: data.parentId || null,
      },
      orderBy: { order: 'desc' },
      take: 1,
    });

    const nextOrder = (siblings[0]?.order ?? -1) + 1;

    const scene = await prisma.strategyScene.create({
      data: {
        playbookId: data.playbookId,
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        parentId: data.parentId,
        order: nextOrder,
      },
    });

    revalidatePath(`/strategy/playbook/${data.playbookId}`);
    return { success: true, data: scene };
  } catch (error) {
    console.error('Failed to create scene:', error);
    return { success: false, error: 'Failed to create scene' };
  }
}

export async function updateScene(id: string, data: {
  title?: string;
  description?: string;
  imageUrl?: string;
}) {
  try {
    const scene = await prisma.strategyScene.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
      },
    });
    revalidatePath(`/strategy/playbook/${scene.playbookId}`);
    return { success: true, data: scene };
  } catch (error) {
    console.error('Failed to update scene:', error);
    return { success: false, error: 'Failed to update scene' };
  }
}

export async function deleteScene(id: string) {
  try {
    const scene = await prisma.strategyScene.delete({
      where: { id },
    });
    revalidatePath(`/strategy/playbook/${scene.playbookId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete scene:', error);
    return { success: false, error: 'Failed to delete scene' };
  }
}
