import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createLog } from "@/lib/logger";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const body = await req.json();
    const { 
      date, 
      duration, 
      result, 
      gameVersion,
      championName, 
      position, 
      championRole,
      laneAllocation,
      kills, 
      deaths, 
      assists, 
      cs, 
      gold, 
      damageDealt, 
      visionWards, 
      wardsPlaced,
      laneOpponent,
      matchupNotes,
      microRating,
      macroRating,
      communicationRating,
      mentalRating,
      positioningRating,
      laningRating,
      teamfightRating,
      playerProfileId
    } = body;

    // Verify ownership or role
    const profile = await prisma.playerProfile.findUnique({
        where: { id: playerProfileId },
        include: { user: true }
    });

    if (!profile) {
        return new NextResponse("Profile not found", { status: 404 });
    }

    const isOwner = profile.userId === session.user.id;
    const isAdminOrCoach = session.user.role === "ADMIN" || session.user.role === "COACH";

    if (!isOwner && !isAdminOrCoach) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    // Create Match
    const match = await prisma.match.create({
      data: {
        type: "SOLOQ",
        date: new Date(date),
        duration: duration ? parseInt(duration) * 60 : null, // minutes to seconds
        result,
        gameVersion,
        patchId: body.patchId || null,
        participants: {
            create: {
                playerProfileId,
                championName,
                position,
                championRole: championRole || null,
                laneAllocation: laneAllocation || null,
                kills: parseInt(kills || 0),
                deaths: parseInt(deaths || 0),
                assists: parseInt(assists || 0),
                cs: parseInt(cs || 0),
                gold: parseInt(gold || 0),
                damageDealt: parseInt(damageDealt || 0),
                visionWards: parseInt(visionWards || 0),
                wardsPlaced: parseInt(wardsPlaced || 0),
                laneOpponent,
                matchupNotes,
                microRating: microRating ? parseFloat(microRating) : null,
                macroRating: macroRating ? parseFloat(macroRating) : null,
                communicationRating: communicationRating ? parseFloat(communicationRating) : null,
                mentalRating: mentalRating ? parseFloat(mentalRating) : null,
                positioningRating: positioningRating ? parseFloat(positioningRating) : null,
                laningRating: laningRating ? parseFloat(laningRating) : null,
                teamfightRating: teamfightRating ? parseFloat(teamfightRating) : null,
            }
        }
      },
    });

    await createLog(
      session.user.id,
      "CREATE",
      "MATCH",
      match.id,
      `Created SoloQ match for player ${profile.user.name}`
    );

    return NextResponse.json(match);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
