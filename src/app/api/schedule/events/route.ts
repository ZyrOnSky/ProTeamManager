import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lineupId = searchParams.get("lineupId");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!lineupId) {
    return NextResponse.json({ error: "Lineup ID is required" }, { status: 400 });
  }

  try {
    const events = await prisma.scheduleEvent.findMany({
      where: {
        lineupId,
        startTime: {
          gte: start ? new Date(start) : undefined,
          lte: end ? new Date(end) : undefined,
        },
      },
      include: {
        attendances: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                // image: true, // User model doesn't have image yet
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      title,
      description,
      startTime,
      endTime,
      type,
      lineupId,
      opponentName,
      opponentContact,
      scrimType,
      modality,
      activityType,
    } = body;

    if (!title || !startTime || !type || !lineupId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const event = await prisma.scheduleEvent.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        type,
        lineupId,
        opponentName,
        opponentContact,
        scrimType,
        modality,
        activityType,
      },
    });

    // Initialize attendance for all lineup members?
    // Maybe we should do this optionally or let the user add them.
    // For now, let's just create the event.

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
