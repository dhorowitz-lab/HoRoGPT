import Link from "next/link";
import SleeperPlayerLink from "../../components/SleeperPlayerLink";
import { getSleeperData } from "../../lib/sleeper";
import { getFantasyCalcValues } from "../../lib/fantasycalc";

export default async function FreeAgentsPage() {
  const { rosters, players } = await getSleeperData();

  let fantasyCalcValues = {};

  try {
    fantasyCalcValues = await getFantasyCalcValues();
  } catch (error) {
    console.error("FantasyCalc unavailable:", error);
  }

  // Every player currently owned anywhere in the league.
  const rosteredPlayerIds = new Set();

  rosters.forEach((roster) => {
    (roster.players || []).forEach((playerId) => {
      rosteredPlayerIds.add(String(playerId));
    });
  });

  // Only show:
  // 1. Unrostered players
  // 2. QB/RB/WR/TE
  // 3. Active players
  // 4. Players currently attached to an NFL team
  const freeAgents = Object.entries(players)
    .filter(([playerId, player]) => {
      const fantasyPositions = ["QB", "RB", "WR", "TE"];

      return (
        !rosteredPlayerIds.has(String(playerId)) &&
        fantasyPositions.includes(player.position) &&
        player.active === true &&
        player.team
      );
    })
    .map(([playerId, player]) => {
      const dynasty = fantasyCalcValues[String(playerId)] || {};

      return {
        id: playerId,

        name:
          player.full_name ||
          `${player.first_name || ""} ${player.last_name || ""}`.trim(),

        position: player.position || "",
        team: player.team || "",
        age: player.age || null,

        dynastyValue: dynasty.value ?? null,
        dynastyRank: dynasty.overallRank ?? null,
        positionRank: dynasty.positionRank ?? null,
      };
    })
    .sort((a, b) => {
      // Best FantasyCalc dynasty values first.
      if (
        a.dynastyValue !== null &&
        b.dynastyValue !== null
      ) {
        return b.dynastyValue - a.dynastyValue;
      }

      if (a.dynastyValue !== null) return -1;
      if (b.dynastyValue !== null) return 1;

      if (
        a.dynastyRank !== null &&
        b.dynastyRank !== null
      ) {
        return a.dynastyRank - b.dynastyRank;
      }

      return a.name.localeCompare(b.name);
    });

  const positions = ["QB", "RB", "WR", "TE"];

  const positionGroups = positions.map((position) => ({
    position,

    players: freeAgents
      .filter((player) => player.position === position)
      .slice(0, 15),

    total: freeAgents.filter(
      (player) => player.position === position
    ).length,
  }));

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
        <div
          style={{
            maxWidth: "700px",
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

          <div
            style={{
              fontSize: "27px",
              fontWeight: "700",
            }}
          >
            Free Agent Center
          </div>

          <div
            style={{
              opacity: ".8",
              marginTop: "5px",
            }}
          >
            {freeAgents.length} available NFL players
          </div>
        </section>

        <section
          style={{
            background: "#ecfdf3",
            border: "1px solid #bbf7d0",
            borderRadius: "16px",
            padding: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              fontWeight: "700",
              color: "#166534",
            }}
          >
            HoRoGPT Free Agent Board
          </div>

          <div
            style={{
              color: "#4b5563",
              fontSize: "14px",
              marginTop: "6px",
              lineHeight: "1.4",
            }}
          >
            Only active players currently on an NFL team are
            shown. Players are ranked using FantasyCalc dynasty
            value.
          </div>
        </section>

        {positionGroups.map((group) => (
          <section
            key={group.position}
            style={{
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <h2
                style={{
                  fontSize: "21px",
                  margin: 0,
                }}
              >
                {group.position}
              </h2>

              <div
                style={{
                  color: "#687386",
                  fontSize: "13px",
                }}
              >
                {group.total} available
              </div>
            </div>

            {group.players.length === 0 ? (
              <div
                style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "14px",
                  padding: "15px",
                  color: "#687386",
                }}
              >
                No available {group.position}s found.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: "8px",
                }}
              >
                {group.players.map((player, index) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    number={index + 1}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
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
              color: "#166534",
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

function PlayerCard({ player, number }) {
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
        gap: "12px",
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
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: "700",
            flexShrink: 0,
          }}
        >
          {number}
        </div>

        <div>
          <div
            style={{
              fontWeight: "700",
            }}
          >
            <SleeperPlayerLink player={player} />
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
      </div>

      <div
        style={{
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {player.dynastyValue !== null ? (
          <>
            <div
              style={{
                fontWeight: "700",
                color: "#166534",
              }}
            >
              {player.dynastyValue.toLocaleString()}
            </div>

            <div
              style={{
                fontSize: "10px",
                color: "#687386",
                marginTop: "2px",
              }}
            >
              FC VALUE
            </div>
          </>
        ) : (
          <div
            style={{
              fontSize: "11px",
              color: "#687386",
            }}
          >
            UNRANKED
          </div>
        )}
      </div>
    </div>
  );
}
