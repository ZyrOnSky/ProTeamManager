import { getTeamScoutingReport } from "@/lib/scouting";
import { TeamReport } from "./TeamReport";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamScoutingPage({ params }: PageProps) {
  const { teamId } = await params;
  const report = await getTeamScoutingReport(teamId);

  if (!report) {
    notFound();
  }

  return <TeamReport report={report} />;
}
