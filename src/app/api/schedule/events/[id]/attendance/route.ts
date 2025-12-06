import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, status, notes } = body;

    if (!userId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const attendance = await prisma.eventAttendance.upsert({
      where: {
        eventId_userId: {
          eventId: id,
          userId,
        },
      },
      update: {
        status,
        notes,
      },
      create: {
        eventId: id,
        userId,
        status,
        notes,
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
