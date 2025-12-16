import { getChampionDetail } from '@/lib/stats';
import ChampionDetailView from './ChampionDetailView';

export const dynamic = 'force-dynamic';

export default async function ChampionDetailPage({ params }: { params: Promise<{ champion: string }> }) {
  const { champion } = await params;
  const championName = decodeURIComponent(champion);
  const data = await getChampionDetail(championName);
  
  // Serialize data to avoid "Date object" warning in Client Component
  const serializedData = JSON.parse(JSON.stringify(data));

  return <ChampionDetailView championName={championName} initialData={serializedData} />;
}
