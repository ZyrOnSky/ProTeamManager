import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createLog } from "@/lib/logger";

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const match = await prisma.match.findUnique({
      where: { id: params.id },
      include: { participants: { include: { playerProfile: true } } }
    });

    if (!match) return new NextResponse("Match not found", { status: 404 });

    const body = await req.json();

    // --- SOLOQ LOGIC ---
    if (match.type === "SOLOQ") {
      // Permission Check: Owner or Admin/Coach
      const participant = match.participants.find(p => p.playerProfileId);
      const isOwner = participant?.playerProfile?.userId === session.user.id;
      const isAdminOrCoach = session.user.role === "ADMIN" || session.user.role === "COACH";

      if (!isOwner && !isAdminOrCoach) {
        return new NextResponse("Forbidden", { status: 403 });
      }

      const { 
        date, duration, result, gameVersion, championName, position, 
        championRole, laneAllocation,
        kills, deaths, assists, cs, visionWards, wardsPlaced,
        laneOpponent, matchupNotes,
        microRating, macroRating, communicationRating, mentalRating, positioningRating, laningRating, teamfightRating
      } = body;

      // Update Match
      await prisma.match.update({
        where: { id: params.id },
        data: {
          date: new Date(date),
          duration: duration ? parseInt(duration) * 60 : null,
          result,
          gameVersion,
        }
      });

      // Update Participant
      if (participant) {
        await prisma.matchParticipant.update({
          where: { id: participant.id },
          data: {
            championName,
            position,
            championRole: championRole || null,
            laneAllocation: laneAllocation || null,
            kills: parseInt(kills || 0),
            deaths: parseInt(deaths || 0),
            assists: parseInt(assists || 0),
            cs: parseInt(cs || 0),
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
        });
      }

      await createLog(
        session.user.id,
        "UPDATE",
        "MATCH",
        match.id,
        "Updated SoloQ match details"
      );

      return new NextResponse("Updated", { status: 200 });
    }

    // --- SCRIM LOGIC (Existing) ---
    // Allow Players to edit Scrims too
    if (session.user.role !== "ADMIN" && session.user.role !== "COACH" && session.user.role !== "PLAYER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { 
      blueBans, 
      redBans, 
      ourPicks, 
      enemyPicks, 
      // ... existing destructuring
      gameVersion,
      playerStats,
      analysis // Don't forget analysis
    } = body;

    // 1. Update Match basic info
    await prisma.match.update({
      where: { id: params.id },
      data: {
        blueBans,
        redBans,
        result: body.result || null,
        duration: body.duration || null,
        vodLink: body.vodLink || null,
        gameVersion: gameVersion || null,
      },
    });

    // 2. Update or Create Analysis
    if (analysis) {
        await prisma.matchAnalysis.upsert({
        where: { matchId: params.id },
        create: {
            matchId: params.id,
            ...analysis
        },
        update: {
            ...analysis
        },
        });
    }

    // 3. Update Participants
    // We fetch the match again or use the one we have. 
    // The 'match' variable holds the state BEFORE the update/delete.
    
    const participantsToCreate: any[] = [];
    const changes: string[] = [];

    // Map old participants by position/isEnemy for comparison
    const oldParticipantsMap = new Map();
    if (match.participants) {
        match.participants.forEach(p => {
            const key = `${p.isEnemy ? 'ENEMY' : 'ALLY'}-${p.position}`;
            oldParticipantsMap.set(key, p);
        });
    }

    // Debug: Uncomment if needed
    // console.log("📊 Changes detected:", changes.length);

    // Compare Basic Info
    if (body.result && body.result !== match.result) changes.push(`Result changed to ${body.result}`);
    if (JSON.stringify(blueBans) !== JSON.stringify(match.blueBans)) changes.push("Updated Blue Bans");
    if (JSON.stringify(redBans) !== JSON.stringify(match.redBans)) changes.push("Updated Red Bans");

    // Our Team Picks
    if (ourPicks) {
        for (const [role, data] of Object.entries(ourPicks) as [string, any][]) {
            // Always process if we have data, even if champion is empty (to clear it?)
            // But the frontend sends empty string if cleared.
            
            const key = `ALLY-${role}`;
            const oldP = oldParticipantsMap.get(key);
            const newChamp = data.champion || "";
            const oldChamp = oldP?.championName || "";

            // Log change if champion changed
            if (newChamp !== oldChamp) {
                if (newChamp && !oldChamp) changes.push(`${role}: Picked ${newChamp}`);
                else if (!newChamp && oldChamp) changes.push(`${role}: Removed ${oldChamp}`);
                else if (newChamp && oldChamp) changes.push(`${role}: Swapped ${oldChamp} -> ${newChamp}`);
            }

            if (data.champion) {
                const stats = playerStats?.[role] || {};
                participantsToCreate.push({
                    matchId: params.id,
                    position: role as any,
                    championName: data.champion,
                    playerProfileId: data.playerId || null,
                    isEnemy: false,
                    kills: stats.kills ? parseInt(stats.kills) : 0,
                    deaths: stats.deaths ? parseInt(stats.deaths) : 0,
                    assists: stats.assists ? parseInt(stats.assists) : 0,
                    cs: stats.cs ? parseInt(stats.cs) : 0,
                    visionWards: stats.visionWards ? parseInt(stats.visionWards) : 0,
                    wardsPlaced: stats.wardsPlaced ? parseInt(stats.wardsPlaced) : 0,
                    laneOpponent: stats.laneOpponent || null,
                    matchupNotes: stats.notes || null,
                    microRating: stats.microRating ? parseFloat(stats.microRating) : null,
                    macroRating: stats.macroRating ? parseFloat(stats.macroRating) : null,
                    communicationRating: stats.communicationRating ? parseFloat(stats.communicationRating) : null,
                    mentalRating: stats.mentalRating ? parseFloat(stats.mentalRating) : null,
                    positioningRating: stats.positioningRating ? parseFloat(stats.positioningRating) : null,
                    laningRating: stats.laningRating ? parseFloat(stats.laningRating) : null,
                    teamfightRating: stats.teamfightRating ? parseFloat(stats.teamfightRating) : null,
                    laneAllocation: stats.laneAllocation || null,
                    championRole: stats.championRole || null,
                });
            }
        }
    }

    // Enemy Team Picks
    if (enemyPicks) {
        for (const [role, champion] of Object.entries(enemyPicks) as [string, string][]) {
            const key = `ENEMY-${role}`;
            const oldP = oldParticipantsMap.get(key);
            const newChamp = champion || "";
            const oldChamp = oldP?.championName || "";

            if (newChamp !== oldChamp) {
                 if (newChamp && !oldChamp) changes.push(`Enemy ${role}: Picked ${newChamp}`);
                 else if (!newChamp && oldChamp) changes.push(`Enemy ${role}: Removed ${oldChamp}`);
                 else if (newChamp && oldChamp) changes.push(`Enemy ${role}: Swapped ${oldChamp} -> ${newChamp}`);
            }

            if (champion) {
                participantsToCreate.push({
                    matchId: params.id,
                    position: role as any,
                    championName: champion,
                    isEnemy: true,
                });
            }
        }
    }

    // NOW delete and recreate
    await prisma.matchParticipant.deleteMany({
      where: { matchId: params.id }
    });

    if (participantsToCreate.length > 0) {
      await prisma.matchParticipant.createMany({
        data: participantsToCreate
      });
    }

    const logDetails = changes.length > 0 ? changes.join(", ") : "Updated Scrim details (No specific changes detected)";
    
    // Create log
    await createLog(
      session.user.id,
      "UPDATE",
      "MATCH",
      match.id,
      logDetails
    );

    return new NextResponse("Updated", { status: 200 });
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
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const match = await prisma.match.findUnique({
        where: { id: params.id },
        include: { participants: { include: { playerProfile: true } } }
    });
  
    if (!match) return new NextResponse("Match not found", { status: 404 });

    // Permission Check
    let canDelete = false;
    if (session.user.role === "ADMIN" || session.user.role === "COACH") {
        canDelete = true;
    } else if (match.type === "SOLOQ") {
        // Player can delete their own SoloQ match
        const participant = match.participants.find(p => p.playerProfileId);
        if (participant?.playerProfile?.userId === session.user.id) {
            canDelete = true;
        }
    }

    if (!canDelete) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    // Delete related data first using a transaction to ensure consistency
    await prisma.$transaction([
      prisma.matchAnalysis.deleteMany({ where: { matchId: params.id } }),
      prisma.matchParticipant.deleteMany({ where: { matchId: params.id } }),
      prisma.comment.deleteMany({ where: { matchId: params.id } }),
      prisma.match.delete({ where: { id: params.id } }),
    ]);

    await createLog(
      session.user.id,
      "DELETE",
      "MATCH",
      match.id, // Note: The entity is deleted, but the log remains. However, fetching logs by entityId won't work if we only query by entityId. But for audit, it's fine.
      `Deleted match of type ${match.type}`
    );

    return new NextResponse("Deleted", { status: 200 });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
