"use server";

import { prisma } from "@/lib/prisma";

export async function getOrganizationHierarchy() {
  // 1. Fetch all active users with their profiles and lineups
  const users = await prisma.user.findMany({
    where: {
      status: { not: 'DELETED' }
    },
    include: {
      playerProfile: true,
      assignedLineup: true,
    }
  });

  // 2. Fetch all lineups to create group nodes
  const lineups = await prisma.lineup.findMany({
    where: {
      isActive: true
    }
  });

  return { users, lineups };
}

export async function updateUserHierarchyDetails(userId: string, name: string, jobTitle: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        jobTitle
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating user hierarchy details:", error);
    return { success: false, error: "Failed to update user details" };
  }
}
