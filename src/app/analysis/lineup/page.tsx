import { prisma } from "@/lib/prisma";
import { LineupPlanner } from "./LineupPlanner";

export default async function LineupPlannerPage() {
  // Fetch all active players with their profiles and match stats
  const players = await prisma.user.findMany({
    where: {
      status: {
        in: ["ACTIVE", "SUBSTITUTE"]
      },
      playerProfile: {
        isNot: null
      }
    },
    include: {
      playerProfile: {
        include: {
          matchParticipations: {
            include: {
              match: {
                select: {
                  result: true,
                  type: true,
                  ourSide: true,
                  duration: true
                }
              }
            }
          },
          evaluations: {
            orderBy: {
              date: 'desc'
            },
            take: 1
          }
        }
      }
    }
  });

  // Fetch all active lineups
  const lineups = await prisma.lineup.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  });

  // Fetch saved configurations
  // Note: If the table doesn't exist yet (migration pending), this might fail. 
  // We'll wrap it in a try-catch or assume the user ran the migration.
  let savedConfigs: any[] = [];
  try {
    savedConfigs = await prisma.lineupConfiguration.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { lineup: { select: { name: true } } }
    });
  } catch (e) {
    console.warn("LineupConfiguration table might not exist yet.");
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-blue-500">Planificador de Alineación</h1>
          <p className="text-slate-400">Diseña la composición ideal y evalúa el impacto de cada jugador.</p>
        </div>
      </div>
      
      <LineupPlanner players={players} lineups={lineups} savedConfigs={savedConfigs} />
    </div>
  );
}
