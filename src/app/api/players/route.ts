import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const players = await prisma.user.findMany({
      where: {
        role: "PLAYER",
      },
      include: {
        playerProfile: {
          include: {
            championPool: true,
          },
        },
      },
    });
    return NextResponse.json(players);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN" && session.user.role !== "COACH") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, password, position, secondaryPosition } = body;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario y perfil en una transacción
    const newUser = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "PLAYER",
        },
      });

      await tx.playerProfile.create({
        data: {
          userId: user.id,
          position,
          secondaryPosition,
        },
      });

      return user;
    });

    return NextResponse.json(newUser);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
