import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EditSoloQMatchForm from "./EditSoloQMatchForm";

interface EditMatchPageProps {
  params: Promise<{
    id: string;
    matchId: string;
  }>;
}

export default async function EditMatchPage(props: EditMatchPageProps) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const { id: userId, matchId } = params;

  // Fetch user and profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { playerProfile: true }
  });

  if (!user || !user.playerProfile) {
    notFound();
  }

  // Fetch match with participants
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      participants: true,
    },
  });

  if (!match) {
    notFound();
  }

  // Verify it's a SoloQ match
  if (match.type !== "SOLOQ") {
    // If it's a SCRIM, redirect to the Scrim Detail page
    if (match.type === "SCRIM") {
      redirect(`/scrims/${matchId}`);
    }
    redirect(`/players/${userId}`);
  }

  // Find the specific participant record for this player in this match
  const participant = match.participants.find((p: any) => p.playerProfileId === user.playerProfile!.id);

  if (!participant) {
    notFound();
  }

  // Permission check: User must be the player owner OR Admin/Coach
  const isOwner = user.id === session.user.id;
  const isAdminOrCoach = session.user.role === "ADMIN" || session.user.role === "COACH";

  if (!isOwner && !isAdminOrCoach) {
    redirect(`/players/${userId}`);
  }

  return (
    <EditSoloQMatchForm 
      match={match} 
      participant={participant}
      userId={userId}
      playerName={user.name}
      userRole={session.user.role}
      currentUserId={session.user.id}
    />
  );
}
