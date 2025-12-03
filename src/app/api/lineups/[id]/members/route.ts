import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "COACH")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return new NextResponse("User ID required", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { playerProfile: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    if (user.role === "PLAYER") {
      // Assign to player profile
      // If player doesn't have a profile, create one (should exist though)
      if (user.playerProfile) {
        await prisma.playerProfile.update({
          where: { userId: user.id },
          data: { lineupId: id },
        });
      } else {
        // Fallback: create profile
        await prisma.playerProfile.create({
          data: {
            userId: user.id,
            position: "MID", // Default
            lineupId: id,
          },
        });
      }
    } else if (user.role === "COACH" || user.role === "STAFF") {
      // Assign to user directly
      await prisma.user.update({
        where: { id: user.id },
        data: { assignedLineupId: id },
      });
    } else {
      return new NextResponse("Cannot assign this user role to a lineup", { status: 400 });
    }

    // Fetch updated lineup with relations to return to client
    const updatedLineup = await prisma.lineup.findUnique({
      where: { id },
      include: {
        players: {
          include: { user: true }
        },
        staff: true
      }
    });

    return NextResponse.json(updatedLineup);
  } catch (error) {
    console.error("Error adding member:", error);
    return new NextResponse("Error adding member", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "COACH")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return new NextResponse("User ID required", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { playerProfile: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    if (user.role === "PLAYER") {
      if (user.playerProfile) {
        await prisma.playerProfile.update({
          where: { userId: user.id },
          data: { lineupId: null },
        });
      }
    } else if (user.role === "COACH" || user.role === "STAFF") {
      await prisma.user.update({
        where: { id: user.id },
        data: { assignedLineupId: null },
      });
    }

    // Fetch updated lineup with relations to return to client
    const updatedLineup = await prisma.lineup.findUnique({
      where: { id },
      include: {
        players: {
          include: { user: true }
        },
        staff: true
      }
    });

    return NextResponse.json(updatedLineup);
  } catch (error) {
    console.error("Error removing member:", error);
    return new NextResponse("Error removing member", { status: 500 });
  }
}
