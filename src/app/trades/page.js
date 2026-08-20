import Link from "next/link";

import {
  getSleeperData,
  buildLeagueTeams,
  buildHoroPlayers,
} from "../../lib/sleeper";

export default async function TradesPage() {
  const { rosters, users, players } = await getSleeperData();

  const teams = buildLeagueTeams(rosters, users);
  const horoPlayers = buildHoroPlayers(rosters, players);

  const otherTeams = teams.filter((team) => team.rosterId !== 11);

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
          <div style={{ fontSize: "24px", fontWeight: "700" }}>
            HoRoGPT
          </div>

          <div
            style={{
              color: "#687386",
              fontSize: "14px",
              marginTop: "3px",
            }}
          >
            Trade Center
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
            TRADE FINDER
          </div>

          <div style={{ fontSize: "27px", fontWeight: "700" }}>
            Find the best deal for HoRo
          </div>

          <div style={{ opacity: ".8", marginTop: "5px" }}>
            {horoPlayers.length} HoRo players • {otherTeams.length} possible trade partners
          </div>
        </section>

        <h2 style={{ fontSize: "20px" }}>Trade Finder</h2>

        <section
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "18px",
            border: "1px solid #e5e7eb",
            marginBottom: "22px",
          }}
        >
          <div style={{ fontWeight: "700" }}>
            Automatic trade recommendations
          </div>

          <p style={{ color: "#687386", marginBottom: 0 }}>
            HoRoGPT will compare every team&apos;s roster needs and identify
            realistic trade opportunities.
          </p>
        </section>

        <h2 style={{ fontSize: "20px" }}>Trade Analyzer</h2>

        <section
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "18px",
            border: "1px solid #e5e7eb",
            marginBottom: "22px",
          }}
        >
          <div style={{ fontWeight: "700" }}>
            Build a trade manually
          </div>

          <p style={{ color: "#687386", marginBottom: 0 }}>
            Choose players and draft picks from HoRo and another team, then
            evaluate the deal.
          </p>
        </section>

        <h2 style={{ fontSize: "20px" }}>League Trade Partners</h2>

        <div
          style={{
            display: "grid",
            gap: "10px",
            marginBottom: "28px",
          }}
        >
          {otherTeams.map((team) => (
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
                {team.ownerName} • Roster {team.rosterId}
              </div>
            </div>
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
            style={{ color: "#172033", textDecoration: "none" }}
          >
            🏠
            <br />
            War Room
          </Link>

          <Link
            href="/team"
            style={{ color: "#172033", textDecoration: "none" }}
          >
            🏈
            <br />
            My Team
          </Link>

          <Link
            href="/trades"
            style={{ color: "#166534", textDecoration: "none" }}
          >
            🔄
            <br />
            Trades
          </Link>

          <div>
            ➕
            <br />
            Free Agents
          </div>
        </div>
      </nav>
    </main>
  );
}