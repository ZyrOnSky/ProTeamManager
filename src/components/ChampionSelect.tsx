"use client";

import { useState, useEffect, useRef } from "react";

interface Champion {
  id: string;
  name: string;
}

interface ChampionSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ChampionSelect({ value, onChange, placeholder = "Campeón", className, disabled = false }: ChampionSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchChampions = async () => {
      try {
        // Fetch latest version first
        const versionRes = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
        const versions = await versionRes.json();
        const latestVersion = versions[0];

        const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/es_ES/champion.json`);
        const data = await res.json();
        const champList = Object.values(data.data).map((c: any) => ({
          id: c.id,
          name: c.name
        })).sort((a: any, b: any) => a.name.localeCompare(b.name));
        
        setChampions(champList);
      } catch (error) {
        console.error("Failed to fetch champions", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChampions();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync query with value prop
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const filteredChampions = query === ""
    ? champions
    : champions.filter((champ) =>
        champ.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .includes(query.toLowerCase().replace(/[^a-z0-9]/g, ""))
      );

  const handleSelect = (champName: string) => {
    onChange(champName);
    setQuery(champName);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <input
        ref={inputRef}
        type="text"
        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm focus:border-blue-500 outline-none text-slate-200 placeholder-slate-600"
        placeholder={placeholder}
        value={query}
        disabled={disabled}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          onChange(event.target.value); // Allow typing custom values or partials
        }}
        onFocus={() => !disabled && setOpen(true)}
        onClick={() => !disabled && setOpen(true)}
      />

      {open && !disabled && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-slate-900 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-slate-800">
          {loading ? (
            <li className="relative cursor-default select-none py-2 pl-3 pr-9 text-slate-500">Cargando...</li>
          ) : filteredChampions.length === 0 ? (
            <li className="relative cursor-default select-none py-2 pl-3 pr-9 text-slate-500">No se encontraron resultados.</li>
          ) : (
            filteredChampions.map((champ) => (
              <li
                key={champ.id}
                className={`relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-slate-800 ${value === champ.name ? 'text-blue-400' : 'text-slate-200'}`}
                onClick={() => handleSelect(champ.name)}
              >
                <span className={`block truncate ${value === champ.name ? 'font-semibold' : 'font-normal'}`}>
                  {champ.name}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
