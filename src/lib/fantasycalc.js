const FANTASYCALC_URL =
  "https://api.fantasycalc.com/values/current?isDynasty=true&numQbs=2&numTeams=14&ppr=1";

export async function getFantasyCalcValues() {
  const response = await fetch(FANTASYCALC_URL, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Could not load FantasyCalc dynasty values.");
  }

  const data = await response.json();

  const valueMap = {};

  data.forEach((entry) => {
    const sleeperId =
      entry?.player?.sleeperId ||
      entry?.player?.sleeper_id ||
      entry?.sleeperId ||
      null;

    if (!sleeperId) return;

    valueMap[String(sleeperId)] = {
      value: entry.value ?? null,
      overallRank:
        entry.overallRank ??
        entry.rank ??
        null,
      positionRank:
        entry.positionRank ??
        entry.positionalRank ??
        null,
      trend:
        entry.trend ??
        entry.valueTrend ??
        null,
      playerName:
        entry?.player?.name ??
        entry?.name ??
        null,
    };
  });

  return valueMap;
}

export function addFantasyCalcValues(players, valueMap) {
  return players.map((player) => {
    const dynasty = valueMap[String(player.id)];

    return {
      ...player,
      dynastyValue: dynasty?.value ?? null,
      dynastyRank: dynasty?.overallRank ?? null,
      positionRank: dynasty?.positionRank ?? null,
      valueTrend: dynasty?.trend ?? null,
    };
  });
}