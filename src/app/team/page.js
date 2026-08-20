import Link from "next/link";

import {
  getSleeperData,
  buildLeagueTeams,
  buildHoroPlayers,
  HORO_ROSTER_ID,
} from "../../lib/sleeper";

import {
  getFantasyCalcValues,
  addFantasyCalcValues,
} from "../../lib/fantasycalc";

import {
  buildLeaguePositionRankings,
} from "../../lib/analysis";

export default async function TeamPage() {
  const { rosters, users, players } = await getSleeperData();

  const teams = buildLeagueTeams(rosters, users);

  const fantasyCalcValues = await getFantasyCalcValues();

  const horoPlayersBase = buildHoroPlayers(rosters, players);

  const horoPlayers = addFantasyCalcValues(
    horoPlayersBase,
    fantasyCalcValues
  );

  const leagueAnalysis = buildLeaguePositionRankings({
    rosters,
    players,
    teams,
    valueMap: fantasyCalcValues,
    horoRosterId: HORO_ROSTER_ID,
  });

  const starters = horoPlayers.filter((player) => player.starter);
  const bench = horoPlayers.filter((player) => !player.starter);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fa",
        fontFamily: "Arial, sans-serif",
        color: "#172033",
      }}
    >
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          padding: "18px 20px",
        }}
      >
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
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
            My Team
          </div>
        </div>
      </header>

      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          padding: "20px",
        }}
      >
        <section
          style={{
            background: "#172033",
            color: "white",
            borderRadius: "18px",
            padding: "20px",
            marginBottom: "22px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              opacity: ".7",
              marginBottom: "6px",
            }}
          >
            HORO ROSTER
          </div>

          <div
            style={{
              fontSize: "27px",
              fontWeight: "700",
            }}
          >
            {horoPlayers.length} Players
          </div>

          <div
            style={{
              opacity: ".8",
              marginTop: "5px",
            }}
          >
            {starters.length} starters • {bench.length} bench
          </div>
        </section>

        <h2 style={{ fontSize: "20px" }}>
          Position Analysis
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "10px",
            marginBottom: "28px",
          }}
        >
          {["QB", "RB", "WR", "TE"].map((position) => {
            const group = leagueAnalysis.horo[position];

            return (
              <div
                key={position}
                style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "14px",
                  padding: "14px",
                }}
              >
                <div
                  style={{
                    fontWeight: "700",
                    fontSize: "14px",
                  }}
                >
                  {position}
                </div>

                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    marginTop: "6px",
                    color:
                      group.status === "ELITE"
                        ? "#166534"
                        : group.status === "STRONG"
                        ? "#166534"
                        : group.status === "NEEDS HELP"
                        ? "#b91c1c"
                        : "#9a6700",
                  }}
                >
                  {group.status}
                </div>

                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    marginTop: "5px",
                  }}
                >
                  #{group.rank} of {group.leagueSize}
                </div>

                <div
                  style={{
                    color: "#687386",
                    fontSize: "13px",
                    marginTop: "4px",
                  }}
                >
                  {group.playerCount} players
                </div>
              </div>
            );
          })}
        </div>

        <h2 style={{ fontSize: "20px" }}>
          Starting Lineup
        </h2>

        <div
          style={{
            display: "grid",
            gap: "10px",
            marginBottom: "28px",
          }}
        >
          {starters.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              starter
            />
          ))}
        </div>

        <h2 style={{ fontSize: "20px" }}>
          Bench
        </h2>

        <div
          style={{
            display: "grid",
            gap: "10px",
            marginBottom: "28px",
          }}
        >
          {bench.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
            />
          ))}
        </div>
      </div>

      <nav
        style={{
          position: "sticky",
          bottom: 0,
          background: "white",
          borderTop: "1px solid #e5e7eb",
          padding: "10px 8px",
        }}
      >
        <div
          style={{
            maxWidth: "700px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "6px",
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
              color: "#166534",
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
              color: "#172033",
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

function PlayerRow({ player, starter = false }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            background: "#eef1f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "700",
            fontSize: "12px",
          }}
        >
          {player.position}
        </div>

        <div>
          <div style={{ fontWeight: "700" }}>
            {player.name}
          </div>

          <div
            style={{
              color: "#687386",
              fontSize: "14px",
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
          marginLeft: "12px",
        }}
      >
        {player.dynastyValue ? (
          <>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "700",
              }}
            >
              {player.dynastyValue.toLocaleString()}
            </div>

            <div
              style={{
                color: "#687386",
                fontSize: "11px",
                marginTop: "2px",
              }}
            >
              Dynasty Value
            </div>
          </>
        ) : (
          <div
            style={{
              color: "#687386",
              fontSize: "11px",
            }}
          >
            No value
          </div>
        )}

        {starter && (
          <div
            style={{
              color: "#166534",
              fontSize: "10px",
              fontWeight: "700",
              marginTop: "5px",
            }}
          >
            START
          </div>
        )}
      </div>
    </div>
  );
}