import Link from "next/link";

import {
  getSleeperData,
  buildLeagueTeams,
  buildHoroPlayers,
  HORO_ROSTER_ID,
} from "../lib/sleeper";

export default async function Home() {
  const { league, rosters, users, players } = await getSleeperData();

  const teams = buildLeagueTeams(rosters, users);
  const horoPlayers = buildHoroPlayers(rosters, players);

  const horo = teams.find(
    (team) => team.rosterId === HORO_ROSTER_ID
  );

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
            Dynasty Football War Room
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
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              opacity: ".7",
              marginBottom: "6px",
            }}
          >
            LIVE FROM SLEEPER
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "27px",
            }}
          >
            {league.name}
          </h1>

          <p
            style={{
              marginBottom: 0,
              opacity: ".8",
            }}
          >
            {teams.length} teams • HoRo connected
          </p>
        </section>

        <h2 style={{ fontSize: "20px" }}>
          My Team
        </h2>

        <section
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "18px",
            border: "1px solid #e5e7eb",
            marginBottom: "22px",
          }}
        >
          <div
            style={{
              fontWeight: "700",
              fontSize: "18px",
            }}
          >
            {horo?.teamName}
          </div>

          <div
            style={{
              marginTop: "6px",
              color: "#687386",
            }}
          >
            Owner: {horo?.ownerName}
          </div>

          <div
            style={{
              marginTop: "6px",
              color: "#687386",
            }}
          >
            {horoPlayers.length} players
          </div>
        </section>

        <h2 style={{ fontSize: "20px" }}>
          My Roster
        </h2>

        <div
          style={{
            display: "grid",
            gap: "10px",
            marginBottom: "28px",
          }}
        >
          {horoPlayers.map((player) => (
            <div
              key={player.id}
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

              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: player.starter
                    ? "#166534"
                    : "#687386",
                }}
              >
                {player.starter
                  ? "STARTER"
                  : "BENCH"}
              </div>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: "20px" }}>
          League Teams
        </h2>

        <div
          style={{
            display: "grid",
            gap: "10px",
          }}
        >
          {teams.map((team) => (
            <div
              key={team.rosterId}
              style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "14px",
                padding: "14px",
              }}
            >
              <div style={{ fontWeight: "700" }}>
                {team.teamName}
              </div>

              <div
                style={{
                  color: "#687386",
                  fontSize: "14px",
                  marginTop: "3px",
                }}
              >
                {team.ownerName} • Roster{" "}
                {team.rosterId} •{" "}
                {team.playerCount} players
              </div>
            </div>
          ))}
        </div>
      </div>

      <nav
        style={{
          position: "sticky",
          bottom: 0,
          marginTop: "28px",
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
              color: "#166534",
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