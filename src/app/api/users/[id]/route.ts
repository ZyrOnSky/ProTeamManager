import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

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
    const { name, realName, nationality, email, phone, discordId, role, assignedLineupId, opggUrl, position } = body;

    // Basic validation
    if (!name || !email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // If user is COACH, they can't make someone ADMIN or edit an ADMIN
    if (session.user.role === "COACH") {
      if (role === "ADMIN") {
        return NextResponse.json({ error: "Unauthorized to assign ADMIN role" }, { status: 403 });
      }
      
      const targetUser = await prisma.user.findUnique({ where: { id: params.id } });
      if (targetUser?.role === "ADMIN") {
        return NextResponse.json({ error: "Unauthorized to edit ADMIN" }, { status: 403 });
      }
    }

    const updateData: any = {
      name,
      realName,
      nationality,
      email,
      phone,
      discordId,
      role,
      assignedLineupId: assignedLineupId || null,
    };

    // Update playerProfile if opggUrl or position is provided
    if (opggUrl !== undefined || position !== undefined) {
      updateData.playerProfile = {
        update: {
          ...(opggUrl !== undefined && { opggUrl }),
          ...(position !== undefined && { position }),
        },
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}