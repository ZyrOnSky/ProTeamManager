import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createLog } from "@/lib/logger";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const matches = await prisma.match.findMany({
      orderBy: { date: 'desc' },
      include: {
        enemyTeam: true,
      },
      take: 20, // Limitar a los últimos 20 por ahora
    });
    return NextResponse.json(matches);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "COACH")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { date, enemyTeamId, type, ourSide, gameVersion, lineupId } = body;

    const match = await prisma.match.create({
      data: {
        date: new Date(date),
        type: type || "SCRIM",
        enemyTeamId,
        ourSide, // BLUE or RED
        gameVersion,
        lineupId: lineupId || null,
      },
    });

    await createLog(
      session.user.id,
      "CREATE",
      "MATCH",
      match.id,
      `Created match of type ${match.type}`
    );

    return NextResponse.json(match);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
