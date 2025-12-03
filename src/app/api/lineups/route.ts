import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const lineups = await prisma.lineup.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(lineups);
  } catch (error) {
    console.error("Error fetching lineups:", error);
    return NextResponse.json(
      { error: "Error fetching lineups" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const lineup = await prisma.lineup.create({
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(lineup);
  } catch (error) {
    console.error("Error creating lineup:", error);
    return NextResponse.json(
      { error: "Error creating lineup" },
      { status: 500 }
    );
  }
}
