import Link from "next/link";

import { getSleeperData } from "../../lib/sleeper";

export default async function FreeAgentsPage() {
  const { rosters, players } = await getSleeperData();

  // Build a set containing every player currently rostered
  // anywhere in the St. Jude Heroes league.
  const rosteredPlayerIds = new Set();

  rosters.forEach((roster) => {
    (roster.players || []).forEach((playerId) => {
      rosteredPlayerIds.add(playerId);
    });
  });

  // Find active NFL skill-position players who are not rostered.
  const freeAgents = Object.entries(players)
    .filter(([playerId, player]) => {
      const fantasyPositions = ["QB", "RB", "WR", "TE"];

      return (
        !rosteredPlayerIds.has(playerId) &&
        fantasyPositions.includes(player.position) &&
        player.active
      );
    })
    .map(([playerId, player]) => ({
      id: playerId,
      name:
        player.full_name ||
        `${player.first_name || ""} ${player.last_name || ""}`.trim(),
      position: player.position || "",
      team: player.team || "FA",
      age: player.age || null,
    }))
    .sort((a, b) => {
      const positionOrder = {
        QB: 1,
        RB: 2,
        WR: 3,
        TE: 4,
      };

      return (
        (positionOrder[a.position] || 99) -
        (positionOrder[b.position] || 99)
      );
    });

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
            Free Agents
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
            LIVE SLEEPER AVAILABILITY
          </div>

          <div style={{ fontSize: "27px", fontWeight: "700" }}>
            Free Agent Center
          </div>

          <div style={{ opacity: ".8", marginTop: "5px" }}>
            {freeAgents.length} available QB/RB/WR/TE players
          </div>
        </section>

        <h2 style={{ fontSize: "20px" }}>HoRoGPT Recommendations</h2>

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
            Add / Drop + FAAB
          </div>

          <p style={{ color: "#687386", marginBottom: 0 }}>
            Next we&apos;ll rank these players for HoRo as Win Now,
            Dynasty Value and Stash/Upside targets and recommend the
            corresponding drop and FAAB bid.
          </p>
        </section>

        <h2 style={{ fontSize: "20px" }}>Available Players</h2>

        <div
          style={{
            display: "grid",
            gap: "10px",
            marginBottom: "28px",
          }}
        >
          {freeAgents.slice(0, 100).map((player) => (
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
                  {player.age ? ` • Age ${player.age}` : ""}
                </div>
              </div>

              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#166534",
                }}
              >
                AVAILABLE
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
            style={{ color: "#172033", textDecoration: "none" }}
          >
            🔄
            <br />
            Trades
          </Link>

          <Link
            href="/free-agents"
            style={{ color: "#166534", textDecoration: "none" }}
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