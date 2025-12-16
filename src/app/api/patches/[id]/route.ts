import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const body = await req.json();
    const { version, description, startDate, officialLink } = body;

    let parsedDate = null;
    if (startDate) {
      parsedDate = new Date(startDate);
      if (isNaN(parsedDate.getTime())) {
        return new NextResponse("Invalid Date format", { status: 400 });
      }
    }

    const patch = await prisma.patch.update({
      where: { id: params.id },
      data: {
        version,
        description: description || null,
        startDate: parsedDate,
        officialLink: officialLink || null
      }
    });

    return NextResponse.json(patch);
  } catch (error: any) {
    console.error("Error updating patch:", error);
    if (error.code === 'P2002') {
      return new NextResponse(JSON.stringify({ error: "Esta versión ya existe." }), { status: 409 });
    }
    return new NextResponse(JSON.stringify({ error: error.message || "Internal Error" }), { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    await prisma.patch.delete({
      where: { id: params.id }
    });
    return new NextResponse("Deleted", { status: 200 });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
