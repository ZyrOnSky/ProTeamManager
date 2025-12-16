"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleCaptain(userId: string, lineupId: string | null | undefined, isCaptain: boolean) {
  try {
    // If we are making this player a captain, and they belong to a lineup,
    // we should probably unset other captains in the same lineup if we want strict "one captain" rule.
    // For now, let's just toggle the specific player. The user can manage multiple captains if they want, 
    // or manually unset the old one. 
    // BUT, usually "The Captain" implies uniqueness. Let's enforce uniqueness per lineup if lineupId exists.
    
    if (isCaptain && lineupId) {
      // Unset captain for all other players in this lineup
      await prisma.playerProfile.updateMany({
        where: {
          lineupId: lineupId,
          userId: { not: userId },
          isCaptain: true
        },
        data: {
          isCaptain: false
        }
      });
    }

    // Update the target player
    await prisma.playerProfile.update({
      where: { userId: userId },
      data: { isCaptain: isCaptain }
    });

    revalidatePath("/players");
    revalidatePath("/hierarchy");
    return { success: true };
  } catch (error) {
    console.error("Error toggling captain:", error);
    return { success: false, error: "Failed to update captain status" };
  }
}
