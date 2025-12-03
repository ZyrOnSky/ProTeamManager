import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: Request,
  props: { params: Promise<{ entityId: string }> }
) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const logs = await prisma.changeLog.findMany({
      where: { entityId: params.entityId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, role: true }
        }
      }
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
