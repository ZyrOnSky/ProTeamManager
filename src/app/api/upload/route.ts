import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Convert to Base64 Data URI
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'image/png'; // Default to png if type is missing
    const dataUri = `data:${mimeType};base64,${base64}`;
    
    return NextResponse.json({ 
      url: dataUri,
      success: true 
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Error uploading file." }, { status: 500 });
  }
}