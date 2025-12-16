import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const patches = await prisma.patch.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { matches: true, tierLists: true }
        }
      }
    });
    return NextResponse.json(patches);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { version, description, startDate, officialLink } = body;

    if (!version) {
      return new NextResponse("Version is required", { status: 400 });
    }

    let parsedDate = null;
    if (startDate) {
      parsedDate = new Date(startDate);
      if (isNaN(parsedDate.getTime())) {
        return new NextResponse("Invalid Date format", { status: 400 });
      }
    }

    const patch = await prisma.patch.create({
      data: {
        version,
        description: description || null,
        startDate: parsedDate,
        officialLink: officialLink || null
      }
    });

    return NextResponse.json(patch);
  } catch (error: any) {
    console.error("Error creating patch:", error);
    
    if (error.code === 'P2002') {
      return new NextResponse(JSON.stringify({ error: "Esta versión ya existe." }), { status: 409 });
    }

    return new NextResponse(JSON.stringify({ error: error.message || "Internal Error" }), { status: 500 });
  }
}
