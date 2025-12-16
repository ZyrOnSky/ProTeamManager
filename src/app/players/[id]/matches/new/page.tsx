import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import NewSoloQMatchForm from "./NewSoloQMatchForm";

export const dynamic = 'force-dynamic';

export default async function NewSoloQMatchPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const player = await prisma.user.findUnique({
    where: { id: params.id },
    include: { playerProfile: true },
  });

  if (!player || !player.playerProfile) {
    notFound();
  }

  // Check permissions: Owner or Admin/Coach
  const isOwner = session.user.id === player.id;
  const isAdminOrCoach = session.user.role === "ADMIN" || session.user.role === "COACH";

  if (!isOwner && !isAdminOrCoach) {
    redirect("/players/" + params.id);
  }

  return (
    <NewSoloQMatchForm 
      playerProfileId={player.playerProfile.id} 
      userId={player.id}
      playerName={player.name}
    />
  );
}
