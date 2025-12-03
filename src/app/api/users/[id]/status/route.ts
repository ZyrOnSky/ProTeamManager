import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createLog } from "@/lib/logger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { status } = await request.json();

    // Validar el estado
    if (!["ACTIVE", "INACTIVE", "DELETED", "SUBSTITUTE"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    // Obtener el usuario a modificar
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Verificar permisos según las reglas establecidas
    const currentUserRole = session.user.role;
    const currentUserId = session.user.id;

    // Solo los ADMIN pueden eliminar usuarios (DELETED)
    if (status === "DELETED" && currentUserRole !== "ADMIN") {
      return NextResponse.json({ 
        error: "Solo los administradores pueden eliminar usuarios" 
      }, { status: 403 });
    }

    // Coach o Staff pueden cambiar estado (ACTIVE/INACTIVE/DELETED/SUBSTITUTE) de jugadores
    if (targetUser.role === "PLAYER") {
      if (!["ADMIN", "COACH", "STAFF"].includes(currentUserRole)) {
        return NextResponse.json({ 
          error: "No tienes permisos para cambiar el estado de jugadores" 
        }, { status: 403 });
      }
    }

    // Un usuario puede cambiar su propio estado solo a ACTIVE, INACTIVE o SUBSTITUTE
    if (currentUserId === userId) {
      if (status === "DELETED") {
        return NextResponse.json({ 
          error: "No puedes eliminarte a ti mismo. Contacta a un administrador." 
        }, { status: 403 });
      }
    } else {
      // Para cambiar el estado de otros usuarios, necesita permisos elevados
      if (!["ADMIN", "COACH", "STAFF"].includes(currentUserRole)) {
        return NextResponse.json({ 
          error: "No tienes permisos para cambiar el estado de otros usuarios" 
        }, { status: 403 });
      }
    }

    const oldStatus = targetUser.status;

    // Actualizar el estado del usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    // Crear log del cambio
    await createLog(
      currentUserId,
      "UPDATE",
      "User",
      userId,
      `Cambió el estado de ${targetUser.name} de ${oldStatus} a ${status}`
    );

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}