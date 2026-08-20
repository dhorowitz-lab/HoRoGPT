import Link from "next/link";

import {
  getSleeperData,
  buildHoroPlayers,
} from "../../lib/sleeper";

export default async function TeamPage() {
  const { rosters, players } = await getSleeperData();
  const horoPlayers = buildHoroPlayers(rosters, players);

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

          <div style={{ fontSize: "27px", fontWeight: "700" }}>
            {horoPlayers.length} Players
          </div>

          <div style={{ opacity: ".8", marginTop: "5px" }}>
            {starters.length} starters • {bench.length} bench
          </div>
        </section>

        <h2 style={{ fontSize: "20px" }}>Starting Lineup</h2>

        <div
          style={{
            display: "grid",
            gap: "10px",
            marginBottom: "28px",
          }}
        >
          {starters.map((player) => (
            <PlayerRow key={player.id} player={player} starter />
          ))}
        </div>

        <h2 style={{ fontSize: "20px" }}>Bench</h2>

        <div
          style={{
            display: "grid",
            gap: "10px",
            marginBottom: "28px",
          }}
        >
          {bench.map((player) => (
            <PlayerRow key={player.id} player={player} />
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
            style={{ color: "#166534", textDecoration: "none" }}
          >
            🏈
            <br />
            My Team
          </Link>

          <div>
            🔄
            <br />
            Trades
          </div>

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
          <div style={{ fontWeight: "700" }}>{player.name}</div>

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

      {starter && (
        <div
          style={{
            color: "#166534",
            fontSize: "11px",
            fontWeight: "700",
          }}
        >
          START
        </div>
      )}
    </div>
  );
}