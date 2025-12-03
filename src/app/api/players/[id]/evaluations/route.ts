import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "COACH")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      communication, 
      mental, 
      mechanics, 
      gameKnowledge, 
      teamplay, 
      notes,
      strengths,
      weaknesses,
      improvementGoal
    } = body;

    // Verify player exists and has a profile
    const player = await prisma.user.findUnique({
      where: { id: params.id },
      include: { playerProfile: true }
    });

    if (!player || !player.playerProfile) {
      return NextResponse.json({ error: "Player profile not found" }, { status: 404 });
    }

    const evaluation = await prisma.playerEvaluation.create({
      data: {
        playerProfileId: player.playerProfile.id,
        coachId: session.user.id,
        date: new Date(),
        communication: Number(communication),
        mental: Number(mental),
        mechanics: Number(mechanics),
        gameKnowledge: Number(gameKnowledge),
        teamplay: Number(teamplay),
        notes: notes || "",
        strengths: strengths || "",
        weaknesses: weaknesses || "",
        improvementGoal: improvementGoal || ""
      },
      include: {
        coach: true
      }
    });

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("Error creating evaluation:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
