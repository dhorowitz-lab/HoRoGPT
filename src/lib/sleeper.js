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