import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "COACH")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { championName, mastery, notes } = body;
    const userId = params.id;

    // Buscar el PlayerProfile asociado al userId
    const playerProfile = await prisma.playerProfile.findUnique({
      where: { userId },
    });

    if (!playerProfile) {
      return new NextResponse("Player Profile not found", { status: 404 });
    }

    const newPoolEntry = await prisma.championPool.create({
      data: {
        playerProfileId: playerProfile.id,
        championName,
        mastery,
        notes,
      },
    });

    return NextResponse.json(newPoolEntry);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "COACH")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const poolId = searchParams.get("poolId");

    if (!poolId) {
      return new NextResponse("Pool ID required", { status: 400 });
    }

    await prisma.championPool.delete({
      where: { id: poolId },
    });

    return new NextResponse("Deleted", { status: 200 });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
