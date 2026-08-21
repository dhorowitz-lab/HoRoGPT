import Link from "next/link";

import {
  getSleeperData,
  buildLeagueTeams,
  HORO_ROSTER_ID,
} from "../../lib/sleeper";

import { getFantasyCalcValues } from "../../lib/fantasycalc";

import { buildLeaguePositionRankings } from "../../lib/analysis";

const POSITIONS = ["QB", "RB", "WR", "TE"];

export default async function TradesPage() {
  const { rosters, users, players } = await getSleeperData();

  const teams = buildLeagueTeams(rosters, users);

  let fantasyCalcValues = {};

  try {
    fantasyCalcValues = await getFantasyCalcValues();
  } catch (error) {
    console.error("FantasyCalc unavailable:", error);
  }

  const analysis = buildLeaguePositionRankings({
    rosters,
    players,
    teams,
    valueMap: fantasyCalcValues,
    horoRosterId: HORO_ROSTER_ID,
  });

  const needs = POSITIONS.map((position) => {
    const data = analysis.horo[position];

    return {
      position,
      rank: data?.rank || teams.length,
      leagueSize: data?.leagueSize || teams.length,
      status: data?.status || "UNKNOWN",
    };
  }).sort((a, b) => b.rank - a.rank);

  const biggestNeed = needs[0];
  const targetPosition = biggestNeed.position;

  const positionRanking =
    analysis.rankings[targetPosition] || [];

  const tradePartners = positionRanking
    .filter(
      (team) =>
        Number(team.rosterId) !== Number(HORO_ROSTER_ID)
    )
    .filter((team) => (team.players || []).length >= 2)
    .slice(0, 5);

  const tradeTargets = [];

  tradePartners.forEach((team) => {
    const rosterPlayers = team.players || [];

    // Skip the team's top player at the position and
    // look for more realistic secondary targets.
    const candidates =
      rosterPlayers.length > 1
        ? rosterPlayers.slice(1, 4)
        : rosterPlayers;

    candidates.forEach((player) => {
      if (!player.dynastyValue) return;

      tradeTargets.push({
        ...player,
        ownerTeam: team.teamName,
        ownerName: team.ownerName,
        teamPositionRank: team.rank,
      });
    });
  });

  tradeTargets.sort(
    (a, b) =>
      (b.dynastyValue || 0) -
      (a.dynastyValue || 0)
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fa",
        fontFamily: "Arial, sans-serif",
        color: "#172033",
        paddingBottom: "90px",
      }}
    >
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          padding: "18px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "760px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
            }}
          >
            HoRoGPT
          </div>

          <div
            style={{
              color: "#687386",
              fontSize: "14px",
              marginTop: "3px",
            }}
          >
            Dynasty Football War Room
          </div>
        </div>
      </header>

      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          padding: "20px",
        }}
      >
        <section
          style={{
            background: "#172033",
            color: "white",
            borderRadius: "18px",
            padding: "22px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              opacity: ".7",
              fontWeight: "700",
            }}
          >
            HORO TRADE CENTER
          </div>

          <h1
            style={{
              margin: "7px 0 0",
              fontSize: "29px",
            }}
          >
            Find the next upgrade
          </h1>

          <div
            style={{
              marginTop: "8px",
              opacity: ".82",
              lineHeight: "1.5",
            }}
          >
            HoRo&apos;s biggest current need is{" "}
            <strong>{targetPosition}</strong>.
          </div>
        </section>

        <section
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "16px",
            padding: "18px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              color: "#b91c1c",
              fontSize: "12px",
              fontWeight: "700",
            }}
          >
            🎯 TRADE PRIORITY
          </div>

          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              marginTop: "6px",
            }}
          >
            Upgrade {targetPosition}
          </div>

          <div
            style={{
              color: "#687386",
              marginTop: "6px",
              lineHeight: "1.5",
            }}
          >
            HoRo ranks #{biggestNeed.rank} of{" "}
            {biggestNeed.leagueSize} at {targetPosition}.
          </div>
        </section>

        <h2
          style={{
            fontSize: "21px",
            marginBottom: "5px",
          }}
        >
          Best Teams To Call
        </h2>

        <div
          style={{
            color: "#687386",
            fontSize: "14px",
            marginBottom: "12px",
          }}
        >
          These teams have some of the strongest{" "}
          {targetPosition} rooms in the league.
        </div>

        <div
          style={{
            display: "grid",
            gap: "9px",
            marginBottom: "28px",
          }}
        >
         {tradePartners.map((team) => (
  <Link
    key={team.rosterId}
    href={`/teams/${team.rosterId}`}
    style={{
      background: "white",
      border: "1px solid #e5e7eb",
      borderRadius: "14px",
      padding: "15px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      textDecoration: "none",
      color: "#172033",
    }}
  >
    <div>
      <div
        style={{
          fontWeight: "700",
        }}
      >
        {team.teamName}
      </div>

      <div
        style={{
          color: "#687386",
          fontSize: "13px",
          marginTop: "3px",
        }}
      >
        {team.ownerName}
      </div>
    </div>

    <div
      style={{
        textAlign: "right",
      }}
    >
      <div
        style={{
          color: "#166534",
          fontWeight: "700",
        }}
      >
        #{team.rank} {targetPosition}
      </div>

      <div
        style={{
          color: "#687386",
          fontSize: "12px",
          marginTop: "3px",
        }}
      >
        {team.playerCount} players • View roster →
      </div>
    </div>
  </Link>
))}
        </div>

        <h2
          style={{
            fontSize: "21px",
            marginBottom: "5px",
          }}
        >
          Recommended Targets
        </h2>

        <div
          style={{
            color: "#687386",
            fontSize: "14px",
            lineHeight: "1.5",
            marginBottom: "12px",
          }}
        >
          Secondary players on teams with strong{" "}
          {targetPosition} depth, ranked by FantasyCalc value.
        </div>

        <div
          style={{
            display: "grid",
            gap: "9px",
          }}
        >
          {tradeTargets.slice(0, 10).map((player, index) => (
            <div
              key={`${player.ownerTeam}-${player.id}`}
              style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "14px",
                padding: "15px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      background: "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      fontSize: "12px",
                    }}
                  >
                    {index + 1}
                  </div>

                  <div>
                    <div
                      style={{
                        fontWeight: "700",
                        fontSize: "17px",
                      }}
                    >
                      {player.name}
                    </div>

                    <div
                      style={{
                        color: "#687386",
                        fontSize: "13px",
                        marginTop: "3px",
                      }}
                    >
                      {player.position} • {player.team}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    textAlign: "right",
                  }}
                >
                  <div
                    style={{
                      color: "#166534",
                      fontWeight: "700",
                      fontSize: "17px",
                    }}
                  >
                    {Number(
                      player.dynastyValue
                    ).toLocaleString()}
                  </div>

                  <div
                    style={{
                      color: "#687386",
                      fontSize: "10px",
                    }}
                  >
                    FC VALUE
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: "11px",
                  paddingTop: "10px",
                  borderTop: "1px solid #f0f1f3",
                  color: "#687386",
                  fontSize: "13px",
                }}
              >
                Owned by{" "}
                <strong style={{ color: "#172033" }}>
                  {player.ownerTeam}
                </strong>{" "}
                • #{player.teamPositionRank} league{" "}
                {targetPosition} room
              </div>
            </div>
          ))}
        </div>

        {tradeTargets.length === 0 && (
          <div
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "14px",
              padding: "16px",
              color: "#687386",
            }}
          >
            No trade targets found.
          </div>
        )}
      </div>

      <nav
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          background: "white",
          borderTop: "1px solid #e5e7eb",
          padding: "10px 8px",
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: "760px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            textAlign: "center",
            fontSize: "12px",
            fontWeight: "700",
          }}
        >
          <Link
            href="/"
            style={{
              color: "#172033",
              textDecoration: "none",
            }}
          >
            🏠
            <br />
            War Room
          </Link>

          <Link
            href="/team"
            style={{
              color: "#172033",
              textDecoration: "none",
            }}
          >
            🏈
            <br />
            My Team
          </Link>

          <Link
            href="/trades"
            style={{
              color: "#166534",
              textDecoration: "none",
            }}
          >
            🔄
            <br />
            Trades
          </Link>

          <Link
            href="/free-agents"
            style={{
              color: "#172033",
              textDecoration: "none",
            }}
          >
            ➕
            <br />
            Free Agents
          </Link>
        </div>
      </nav>
    </main>
  );
}
