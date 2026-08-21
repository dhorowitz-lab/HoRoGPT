import Link from "next/link";
import {
  getSleeperData,
  buildLeagueTeams,
  HORO_ROSTER_ID,
} from "../lib/sleeper";

import {
  getFantasyCalcValues,
} from "../lib/fantasycalc";

import {
  buildLeaguePositionRankings,
} from "../lib/analysis";

export default async function Home() {
  const { league, rosters, users, players } = await getSleeperData();

  const teams = buildLeagueTeams(rosters, users);
  const fantasyCalcValues = await getFantasyCalcValues();

  const leagueAnalysis = buildLeaguePositionRankings({
    rosters,
    players,
    teams,
    valueMap: fantasyCalcValues,
    horoRosterId: HORO_ROSTER_ID,
  });

  const positions = ["QB", "RB", "WR", "TE"];

  const positionGroups = positions.map((position) => {
    const group = leagueAnalysis.horo[position] || {};

    return {
      position,
      rank: group.rank,
      leagueSize: group.leagueSize || teams.length,
      status: group.status || "UNKNOWN",
    };
  });

  const rankedPositions = [...positionGroups]
    .filter((group) => group.rank)
    .sort((a, b) => a.rank - b.rank);

  const strongest =
    rankedPositions[0] || positionGroups[0];

  const weakest =
    rankedPositions[rankedPositions.length - 1] ||
    positionGroups[0];

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
            padding: "22px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              opacity: ".7",
              marginBottom: "6px",
              fontWeight: "700",
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
            HoRo War Room
          </h1>

          <div
            style={{
              marginTop: "7px",
              opacity: ".8",
              fontSize: "14px",
            }}
          >
            {league?.name} • {teams.length} teams
          </div>
        </section>

        <section
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "22px",
          }}
        >
          <div
            style={{
              color: "#b91c1c",
              fontSize: "12px",
              fontWeight: "700",
              marginBottom: "7px",
            }}
          >
            🚨 BIGGEST NEED
          </div>

          <div
            style={{
              fontSize: "28px",
              fontWeight: "700",
            }}
          >
            Upgrade {weakest.position}
          </div>

          <div
            style={{
              marginTop: "6px",
              color: "#687386",
            }}
          >
            HoRo ranks #{weakest.rank || "—"} of{" "}
            {weakest.leagueSize} at {weakest.position}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginTop: "18px",
            }}
          >
            <Link
              href="/free-agents"
              style={{
                background: "#166534",
                color: "white",
                textDecoration: "none",
                padding: "12px",
                borderRadius: "10px",
                textAlign: "center",
                fontWeight: "700",
                fontSize: "14px",
              }}
            >
              Find Free Agents
            </Link>

            <Link
              href="/trades"
              style={{
                background: "#172033",
                color: "white",
                textDecoration: "none",
                padding: "12px",
                borderRadius: "10px",
                textAlign: "center",
                fontWeight: "700",
                fontSize: "14px",
              }}
            >
              Find a Trade
            </Link>
          </div>
        </section>

        <h2 style={{ fontSize: "20px" }}>
          Position Snapshot
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "10px",
            marginBottom: "26px",
          }}
        >
          {positionGroups.map((group) => (
            <PositionCard
              key={group.position}
              group={group}
            />
          ))}
        </div>

        <section
          style={{
            background: "#ecfdf3",
            border: "1px solid #bbf7d0",
            borderRadius: "16px",
            padding: "18px",
            marginBottom: "26px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "#166534",
              fontWeight: "700",
            }}
          >
            💪 TEAM STRENGTH
          </div>

          <div
            style={{
              marginTop: "7px",
              fontSize: "20px",
              fontWeight: "700",
            }}
          >
            {strongest.position}
          </div>

          <div
            style={{
              marginTop: "5px",
              color: "#4b5563",
              fontSize: "14px",
            }}
          >
            #{strongest.rank || "—"} of{" "}
            {strongest.leagueSize} • {strongest.status}
          </div>
        </section>

        <h2 style={{ fontSize: "20px" }}>
          What Do You Want To Do?
        </h2>

        <div
          style={{
            display: "grid",
            gap: "10px",
            marginBottom: "26px",
          }}
        >
          <ActionCard
            href="/free-agents"
            icon="➕"
            title="Improve the Roster"
            text={`See available players, starting with ${weakest.position}.`}
          />

          <ActionCard
            href="/trades"
            icon="🔄"
            title="Explore Trades"
            text={`Look for trade opportunities that improve ${weakest.position}.`}
          />

          <ActionCard
            href="/team"
            icon="🏈"
            title="Review My Team"
            text="See the full roster, dynasty values and position analysis."
          />
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
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "6px",
            textAlign: "center",
            fontSize: "11px",
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
              <Link
  href="/news"
  style={{
    color: "#172033",
    textDecoration: "none",
  }}
>
  📰
  <br />
  News
</Link>
        </div>
      </nav>
    </main>
  );
}

function PositionCard({ group }) {
  let statusColor = "#9a6700";

  if (
    group.status === "ELITE" ||
    group.status === "STRONG"
  ) {
    statusColor = "#166534";
  }

  if (group.status === "NEEDS HELP") {
    statusColor = "#b91c1c";
  }

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "15px",
      }}
    >
      <div
        style={{
          fontSize: "14px",
          fontWeight: "700",
        }}
      >
        {group.position}
      </div>

      <div
        style={{
          marginTop: "6px",
          fontSize: "18px",
          fontWeight: "700",
          color: statusColor,
        }}
      >
        {group.status}
      </div>

      <div
        style={{
          marginTop: "5px",
          fontSize: "13px",
          color: "#687386",
        }}
      >
        #{group.rank || "—"} of {group.leagueSize}
      </div>
    </div>
  );
}

function ActionCard({
  href,
  icon,
  title,
  text,
}) {
  return (
    <Link
      href={href}
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "16px",
        textDecoration: "none",
        color: "#172033",
        display: "block",
      }}
    >
      <div
        style={{
          fontSize: "17px",
          fontWeight: "700",
        }}
      >
        {icon} {title}
      </div>

      <div
        style={{
          color: "#687386",
          fontSize: "14px",
          marginTop: "5px",
          lineHeight: "1.4",
        }}
      >
        {text}
      </div>
    </Link>
  );
}
