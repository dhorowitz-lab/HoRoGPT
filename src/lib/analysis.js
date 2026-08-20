export function buildLeaguePositionRankings({
  rosters,
  players,
  teams,
  valueMap,
  horoRosterId,
}) {
  const positions = ["QB", "RB", "WR", "TE"];

  const rosterAnalyses = rosters.map((roster) => {
    const team = teams.find(
      (team) => team.rosterId === roster.roster_id
    );

    const rosterPlayers = (roster.players || [])
      .filter((playerId) => players[playerId])
      .map((playerId) => {
        const player = players[playerId];
        const dynasty = valueMap[String(playerId)];

        return {
          id: playerId,
          name:
            player.full_name ||
            `${player.first_name || ""} ${player.last_name || ""}`.trim(),
          position: player.position || "",
          team: player.team || "FA",
          starter:
            roster.starters?.includes(playerId) || false,
          dynastyValue: dynasty?.value || 0,
        };
      });

    const positionData = {};

    positions.forEach((position) => {
      const positionPlayers = rosterPlayers
        .filter((player) => player.position === position)
        .sort(
          (a, b) =>
            (b.dynastyValue || 0) -
            (a.dynastyValue || 0)
        );

      const depthCount = getRelevantDepth(position);

      const corePlayers = positionPlayers.slice(
        0,
        depthCount
      );

      const coreValue = corePlayers.reduce(
        (sum, player) =>
          sum + (player.dynastyValue || 0),
        0
      );

      const totalValue = positionPlayers.reduce(
        (sum, player) =>
          sum + (player.dynastyValue || 0),
        0
      );

      const starterValue = positionPlayers
        .filter((player) => player.starter)
        .reduce(
          (sum, player) =>
            sum + (player.dynastyValue || 0),
          0
        );

      positionData[position] = {
        position,
        players: positionPlayers,
        playerCount: positionPlayers.length,
        coreValue,
        totalValue,
        starterValue,
      };
    });

    return {
      rosterId: roster.roster_id,
      teamName:
        team?.teamName ||
        `Team ${roster.roster_id}`,
      ownerName:
        team?.ownerName ||
        `Roster ${roster.roster_id}`,
      positionData,
    };
  });

  const rankings = {};

  positions.forEach((position) => {
    const ranked = rosterAnalyses
      .map((team) => ({
        rosterId: team.rosterId,
        teamName: team.teamName,
        ownerName: team.ownerName,
        ...team.positionData[position],
      }))
      .sort(
        (a, b) =>
          b.coreValue - a.coreValue
      )
      .map((team, index) => ({
        ...team,
        rank: index + 1,
      }));

    rankings[position] = ranked;
  });

  const horo = {};

  positions.forEach((position) => {
    const leagueRanking =
      rankings[position];

    const horoPosition =
      leagueRanking.find(
        (team) =>
          team.rosterId === horoRosterId
      );

    horo[position] = {
      ...horoPosition,
      leagueSize: leagueRanking.length,
      status: getRelativeStatus(
        horoPosition?.rank,
        leagueRanking.length
      ),
    };
  });

  return {
    rankings,
    horo,
    rosterAnalyses,
  };
}

function getRelevantDepth(position) {
  const depth = {
    QB: 2,
    RB: 4,
    WR: 5,
    TE: 2,
  };

  return depth[position] || 3;
}

function getRelativeStatus(rank, leagueSize) {
  if (!rank || !leagueSize) {
    return "UNKNOWN";
  }

  const percentile = rank / leagueSize;

  if (percentile <= 0.25) {
    return "ELITE";
  }

  if (percentile <= 0.5) {
    return "STRONG";
  }

  if (percentile <= 0.75) {
    return "ADEQUATE";
  }

  return "NEEDS HELP";
}