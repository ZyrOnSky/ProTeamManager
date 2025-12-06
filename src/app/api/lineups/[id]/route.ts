import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
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
    const { name, description, scheduleLink } = body;

    const lineup = await prisma.lineup.update({
      where: { id },
      data: {
        name,
        description,
        scheduleLink,
      },
      include: {
        players: {
          include: { user: true }
        },
        staff: true
      }
    });

    return NextResponse.json(lineup);
  } catch (error) {
    console.error("Error updating lineup:", error);
    return new NextResponse("Error updating lineup", { status: 500 });
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
    
    // First, unassign all players and staff
    // Note: Prisma might handle this with onDelete: SetNull if configured, but let's be safe
    
    // Unassign players
    await prisma.playerProfile.updateMany({
      where: { lineupId: id },
      data: { lineupId: null },
    });

    // Unassign staff
    await prisma.user.updateMany({
      where: { assignedLineupId: id },
      data: { assignedLineupId: null },
    });

    // Delete lineup
    await prisma.lineup.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting lineup:", error);
    return new NextResponse("Error deleting lineup", { status: 500 });
  }
}
