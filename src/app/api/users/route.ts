import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "COACH")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, realName, nationality, email, password, phone, discordId, role, position, lineupId } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse("User already exists", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const user = await prisma.user.create({
      data: {
        name,
        realName,
        nationality,
        email,
        password: hashedPassword,
        phone,
        discordId,
        role,
        // If it's staff/coach, assign lineup directly
        assignedLineupId: (role === "COACH" || role === "STAFF") && lineupId ? lineupId : null,
      },
    });

    // If Player, create Profile
    if (role === "PLAYER") {
      await prisma.playerProfile.create({
        data: {
          userId: user.id,
          position: position || "MID",
          lineupId: lineupId || null,
        },
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
