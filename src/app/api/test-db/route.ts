import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("Testing DB connection...");
    
    // Intentar una consulta simple
    const userCount = await prisma.user.count();
    
    // Intentar buscar el admin específico
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@team.gg' },
      select: { id: true, email: true, role: true }
    });

    return NextResponse.json({
      status: "success",
      message: "Database connection successful",
      userCount,
      adminFound: !!admin,
      adminDetails: admin,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error: any) {
    console.error("DB Test Error:", error);
    return NextResponse.json({
      status: "error",
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    }, { status: 500 });
  }
}
