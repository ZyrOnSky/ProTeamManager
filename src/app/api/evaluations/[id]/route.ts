import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "COACH")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.playerEvaluation.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting evaluation:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
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

    const evaluation = await prisma.playerEvaluation.update({
      where: { id: params.id },
      data: {
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
    console.error("Error updating evaluation:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
