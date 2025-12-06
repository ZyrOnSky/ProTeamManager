import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, parseISO } from "date-fns";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lineupId = searchParams.get("lineupId");
  const dateParam = searchParams.get("date"); // ISO string or YYYY-MM

  if (!lineupId) {
    return NextResponse.json({ error: "Lineup ID is required" }, { status: 400 });
  }

  try {
    let startDate, endDate;
    
    if (dateParam) {
      const date = new Date(dateParam);
      startDate = startOfMonth(date);
      endDate = endOfMonth(date);
    } else {
      // Default to current month if not specified
      const now = new Date();
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    }

    // 1. Get all events in the period for the lineup
    const events: any[] = await prisma.scheduleEvent.findMany({
      where: {
        // @ts-ignore
        lineupId,
        type: {
          not: "ACTIVITY_LOG"
        },
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        attendances: {
          include: {
            user: true,
          },
        },
      },
    });

    // 2. Get all members of the lineup (to ensure we show 0% for those with no attendance)
    // We need to find users who are part of the lineup. 
    // Based on schema: Lineup has `players` (PlayerProfile) and `staff` (User).
    // We should probably look at PlayerProfiles linked to this lineup.
    const lineup = await prisma.lineup.findUnique({
      where: { id: lineupId },
      include: {
        players: {
          include: {
            user: true,
          },
        },
        staff: true,
      },
    });

    if (!lineup) {
      return NextResponse.json({ error: "Lineup not found" }, { status: 404 });
    }

    // Combine players and staff into a list of users to track
    const users = [
      ...lineup.players.map(p => p.user),
      ...lineup.staff
    ];
    
    // Remove duplicates if any (though staff and players should be distinct usually)
    const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values());

    // 3. Calculate Stats
    // Structure:
    // {
    //   eventCounts: { SCRIM: 5, TOURNAMENT: 2, ... },
    //   memberStats: [
    //     {
    //       userId: "...",
    //       name: "...",
    //       role: "...",
    //       stats: {
    //         SCRIM: { present: 4, total: 5, rate: 80 },
    //         ...
    //         OVERALL: { present: 10, total: 12, rate: 83 }
    //       }
    //     }
    //   ]
    // }

    const eventCounts: Record<string, number> = {};
    events.forEach(event => {
      eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
      eventCounts["ALL"] = (eventCounts["ALL"] || 0) + 1;
    });

    const memberStats = uniqueUsers.map(user => {
      const userStats: Record<string, { present: number; total: number; late: number; absent: number; excused: number }> = {};

      // Initialize for each event type found
      Object.keys(eventCounts).forEach(type => {
        if (type !== "ALL") {
          userStats[type] = { present: 0, total: 0, late: 0, absent: 0, excused: 0 };
        }
      });
      userStats["ALL"] = { present: 0, total: 0, late: 0, absent: 0, excused: 0 };

      events.forEach(event => {
        const attendance = event.attendances.find((a: any) => a.userId === user.id);
        const type = event.type;

        // Increment total for this event type
        if (userStats[type]) userStats[type].total++;
        userStats["ALL"].total++;

        if (attendance) {
          if (attendance.status === "PRESENT") {
            userStats[type].present++;
            userStats["ALL"].present++;
          } else if (attendance.status === "LATE") {
            userStats[type].late++;
            userStats["ALL"].late++;
          } else if (attendance.status === "ABSENT") {
            userStats[type].absent++;
            userStats["ALL"].absent++;
          } else if (attendance.status === "EXCUSED") {
            userStats[type].excused++;
            userStats["ALL"].excused++;
          }
        } else {
          // No attendance record implies? Maybe absent or just not marked.
          // Usually if they are in the lineup they should have an attendance record created when event is created
          // or when they are added. If missing, we might count as 'PENDING' or ignore.
          // For stats, let's assume if no record, it's not counted or treated as pending.
          // But if we want strict stats, maybe treat as unknown.
          // Let's stick to counting explicit statuses.
        }
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
        stats: userStats
      };
    });

    return NextResponse.json({
      period: { start: startDate, end: endDate },
      eventCounts,
      memberStats
    });

  } catch (error) {
    console.error("Error calculating stats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
