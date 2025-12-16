'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { HelpCircle } from 'lucide-react';

interface ChampionIconProps extends Omit<ImageProps, 'src' | 'alt'> {
  championName: string;
}

export default function ChampionIcon({ championName, ...props }: ChampionIconProps) {
  const [error, setError] = useState(false);

  // Handle special cases for DDragon IDs
  let ddragonId = championName;
  if (championName === 'Wukong') ddragonId = 'MonkeyKing';
  if (championName === 'Renata Glasc') ddragonId = 'Renata';
  if (championName === 'Nunu & Willump') ddragonId = 'Nunu';
  
  // Remove spaces and special characters for some names might help, 
  // but DDragon is usually CaseSensitive and specific.
  // e.g. "Dr. Mundo" -> "DrMundo", "Kog'Maw" -> "KogMaw"
  ddragonId = ddragonId.replace(/[^a-zA-Z0-9]/g, '');
  
  // Specific overrides after regex if needed (e.g. if regex breaks something)
  // But usually removing spaces and ' works for most (Kai'Sa -> KaiSa, Kha'Zix -> KhaZix)
  // Let's refine the mapping logic if needed. 
  // Actually, DDragon IDs are usually just the name with no spaces/punctuation, capitalized.
  // Except for Wukong (MonkeyKing), Renata (Renata), etc.
  
  // Let's stick to the raw name first, and if it fails, maybe try the sanitized version?
  // For now, let's just use the raw name but sanitized for common cases if the user input has spaces.
  // But wait, the database might have "Dr. Mundo". DDragon needs "DrMundo".
  
  const sanitizedId = ddragonId.replace(/[^a-zA-Z0-9]/g, '');
  // Let's try to use the sanitized ID as it covers most cases (LeBlanc, ChoGath, KaiSa)
  // But we need to be careful. "Wukong" -> "MonkeyKing" is a manual map.

  if (error) {
    return (
      <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center text-slate-500 p-1">
        <HelpCircle className="w-1/2 h-1/2 mb-1" />
        <span className="text-[10px] text-center leading-none break-all">{championName}</span>
      </div>
    );
  }

  // We try the sanitized ID. If the user has "Yunara", it stays "Yunara".
  // If it's "Zahem", it stays "Zahem".
  // If they are typos, they will still fail, but now we show the fallback.

  return (
    <Image
      {...props}
      src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${sanitizedId}.png`}
      alt={championName}
      onError={() => setError(true)}
    />
  );
}
