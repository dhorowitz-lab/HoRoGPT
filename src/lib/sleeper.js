const LEAGUE_ID = "1322264688641216512";
const HORO_ROSTER_ID = 11;

export async function getSleeperData() {
  const [leagueRes, rostersRes, usersRes, playersRes] = await Promise.all([
    fetch(`https://api.sleeper.app/v1/league/${LEAGUE_ID}`, {
      cache: "no-store",
    }),
    fetch(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/rosters`, {
      cache: "no-store",
    }),
    fetch(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/users`, {
      cache: "no-store",
    }),
    fetch("https://api.sleeper.app/v1/players/nfl", {
      cache: "no-store",
    }),
  ]);

  if (
    !leagueRes.ok ||
    !rostersRes.ok ||
    !usersRes.ok ||
    !playersRes.ok
  ) {
    throw new Error("Could not load Sleeper data.");
  }

  return {
    league: await leagueRes.json(),
    rosters: await rostersRes.json(),
    users: await usersRes.json(),
    players: await playersRes.json(),
  };
}

export function buildLeagueTeams(rosters, users) {
  const userMap = Object.fromEntries(
    users.map((user) => [user.user_id, user])
  );

  return rosters.map((roster) => {
    const owner = userMap[roster.owner_id];

    return {
      rosterId: roster.roster_id,
      ownerName:
        owner?.display_name ||
        owner?.username ||
        `Roster ${roster.roster_id}`,
      teamName:
        owner?.metadata?.team_name ||
        owner?.metadata?.team_name_update ||
        `Team ${roster.roster_id}`,
      playerCount: roster.players?.length || 0,
    };
  });
}

export function buildHoroPlayers(rosters, players) {
  const horoRoster = rosters.find(
    (roster) => roster.roster_id === HORO_ROSTER_ID
  );

  return (horoRoster?.players || [])
    .filter((playerId) => players[playerId])
    .map((playerId) => {
      const player = players[playerId];

      return {
        id: playerId,
        name:
          player.full_name ||
          `${player.first_name || ""} ${player.last_name || ""}`.trim(),
        position: player.position || "",
        team: player.team || "FA",
        starter: horoRoster?.starters?.includes(playerId) || false,
      };
    })
    .sort((a, b) => {
      if (a.starter !== b.starter) return a.starter ? -1 : 1;
      return a.position.localeCompare(b.position);
    });
}

export { HORO_ROSTER_ID, LEAGUE_ID };
export async function getHoroDraftPicks() {
  const response = await fetch(
    `https://api.sleeper.app/v1/league/${LEAGUE_ID}/traded_picks`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch traded picks: ${response.status}`
    );
  }

  const tradedPicks = await response.json();

  const currentYear = new Date().getFullYear();

  /*
   * Start with HoRo's original future picks.
   *
   * We know HoRo is roster 11, and an original pick
   * belongs to its original roster unless Sleeper tells
   * us it was traded away.
   */
  const picks = [];

  for (let year = currentYear + 1; year <= currentYear + 3; year++) {
    for (let round = 1; round <= 7; round++) {
      picks.push({
        year,
        round,
        originalOwnerId: HORO_ROSTER_ID,
        ownerId: HORO_ROSTER_ID,
        source: "original",
      });
    }
  }

  /*
   * Apply every traded-pick record.
   *
   * If HoRo currently owns the pick, add it.
   * If HoRo traded away its original pick, remove it.
   */
  for (const trade of tradedPicks) {
    const year = Number(trade.season);
    const round = Number(trade.round);
    const originalOwnerId = Number(trade.roster_id);
    const ownerId = Number(trade.owner_id);

    if (
      !Number.isFinite(year) ||
      !Number.isFinite(round) ||
      !Number.isFinite(originalOwnerId) ||
      !Number.isFinite(ownerId)
    ) {
      continue;
    }

    if (year <= currentYear) {
      continue;
    }

    /*
     * If this is HoRo's original pick and it was traded away,
     * remove the original-pick placeholder.
     */
    if (
      originalOwnerId === HORO_ROSTER_ID
    ) {
      const index = picks.findIndex(
        (pick) =>
          pick.year === year &&
          pick.round === round &&
          pick.originalOwnerId === HORO_ROSTER_ID
      );

      if (index !== -1) {
        picks.splice(index, 1);
      }
    }

    /*
     * If HoRo currently owns this traded pick,
     * add it to the inventory.
     */
    if (ownerId === HORO_ROSTER_ID) {
      picks.push({
        year,
        round,
        originalOwnerId,
        ownerId,
        previousOwnerId:
          trade.previous_owner_id != null
            ? Number(trade.previous_owner_id)
            : null,
        source:
          originalOwnerId === HORO_ROSTER_ID
            ? "original"
            : "acquired",
      });
    }
  }

  return picks.sort((a, b) => {
    if (a.year !== b.year) {
      return a.year - b.year;
    }

    if (a.round !== b.round) {
      return a.round - b.round;
    }

    return (
      a.originalOwnerId -
      b.originalOwnerId
    );
  });
}