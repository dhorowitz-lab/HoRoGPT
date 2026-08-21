import Link from "next/link";
import {
  getSleeperData,
  buildLeagueTeams,
  HORO_ROSTER_ID,
} from "../../lib/sleeper";

function countPositions(roster, players) {
  const counts = {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
  };

  for (const playerId of roster?.players || []) {
    const player = players[playerId];

    if (!player) continue;

    if (counts[player.position] !== undefined) {
      counts[player.position] += 1;
    }
  }

  return counts;
}

function getPositionStatus(position, count) {
  const thresholds = {
    QB: { strong: 3, okay: 2 },
    RB: { strong: 5, okay: 4 },
    WR: { strong: 6, okay: 5 },
    TE: { strong: 3, okay: 2 },
  };

  const threshold = thresholds[position];

  if (!threshold) return "MONITOR";

  if (count >= threshold.strong) return "STRONG";
  if (count >= threshold.okay) return "SOLID";

  return "NEED";
}

function statusColor(status) {
  if (status === "STRONG") return "#166534";
  if (status === "SOLID") return "#92400e";
  return "#b91c1c";
}

function statusBackground(status) {
  if (status === "STRONG") return "#ecfdf5";
  if (status === "SOLID") return "#fffbeb";
  return "#fef2f2";
}

export default async function Home() {
  const { league, rosters, users, players } = await getSleeperData();

  const teams = buildLeagueTeams(rosters, users);

  const horoRoster = rosters.find(
    (roster) => Number(roster.roster_id) === Number(HORO_ROSTER_ID)
  );

  const horoTeam = teams.find(
    (team) => Number(team.rosterId) === Number(HORO_ROSTER_ID)
  );

  const counts = countPositions(horoRoster, players);

  const positions = [
    {
      key: "QB",
      label: "Quarterback",
      short: "QB",
      count: counts.QB,
    },
    {
      key: "RB",
      label: "Running Back",
      short: "RB",
      count: counts.RB,
    },
    {
      key: "WR",
      label: "Wide Receiver",
      short: "WR",
      count: counts.WR,
    },
    {
      key: "TE",
      label: "Tight End",
      short: "TE",
      count: counts.TE,
    },
  ].map((position) => ({
    ...position,
    status: getPositionStatus(position.key, position.count),
  }));

  const needs = positions
    .filter((position) => position.status === "NEED")
    .map((position) => position.key);

  /*
   * HoRo strategy:
   *
   * 1. Protect 2027 capital.
   * 2. Use 2027 picks to acquire cornerstone players.
   * 3. Use 2028 picks as secondary trade currency.
   * 4. Do not recommend 2029 picks in the trade engine.
   */

  const primaryNeed =
    needs.length > 0
      ? needs[0]
      : counts.RB <= 4
        ? "RB"
        : counts.QB <= 2
          ? "QB"
          : "RB";

  const needDescriptions = {
    QB:
      "Quarterback depth matters even more in HoRo because of the SuperFlex format.",
    RB:
      "Running back depth and young upside should be the first roster-building priority.",
    WR:
      "Add young WR depth and look for players whose value can grow over multiple seasons.",
    TE:
      "Look for a young TE with long-term starting potential rather than paying for a marginal veteran.",
  };

  const primaryNeedLabel =
    primaryNeed === "QB"
      ? "Quarterback"
      : primaryNeed === "RB"
        ? "Running Back"
        : primaryNeed === "WR"
          ? "Wide Receiver"
          : "Tight End";

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
      {/* HEADER */}
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
        {/* HERO */}
        <section
          style={{
            background: "#172033",
            color: "white",
            borderRadius: "18px",
            padding: "24px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              opacity: ".7",
              marginBottom: "7px",
              letterSpacing: ".04em",
            }}
          >
            HO RO DECISION CENTER
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "30px",
              lineHeight: "1.15",
            }}
          >
            War Room
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              opacity: ".82",
              fontSize: "16px",
              lineHeight: "1.5",
            }}
          >
            What should HoRo do next?
          </p>

          <div
            style={{
              marginTop: "18px",
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "10px",
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,.09)",
                borderRadius: "12px",
                padding: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  opacity: ".65",
                  textTransform: "uppercase",
                }}
              >
                Team
              </div>

              <div
                style={{
                  marginTop: "4px",
                  fontWeight: "700",
                }}
              >
                {horoTeam?.teamName || "HoRo"}
              </div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,.09)",
                borderRadius: "12px",
                padding: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  opacity: ".65",
                  textTransform: "uppercase",
                }}
              >
                League
              </div>

              <div
                style={{
                  marginTop: "4px",
                  fontWeight: "700",
                }}
              >
                {teams.length} teams
              </div>
            </div>
          </div>
        </section>

        {/* CURRENT STRATEGY */}
        <section
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: "700",
              color: "#687386",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            Current Strategy
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: "21px",
            }}
          >
            Build around 2027
          </h2>

          <p
            style={{
              color: "#687386",
              lineHeight: "1.55",
              marginBottom: 0,
            }}
          >
            HoRo should prioritize 2027 draft capital when pursuing meaningful
            dynasty upgrades. 2028 picks are secondary currency. Avoid using
            future capital for marginal upgrades.
          </p>
        </section>

        {/* TEAM ASSESSMENT */}
        <section style={{ marginBottom: "22px" }}>
          <h2
            style={{
              fontSize: "21px",
              marginBottom: "5px",
            }}
          >
            Team Assessment
          </h2>

          <p
            style={{
              color: "#687386",
              marginTop: 0,
              marginBottom: "14px",
            }}
          >
            Where the roster stands right now.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "10px",
            }}
          >
            {positions.map((position) => (
              <div
                key={position.key}
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
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "700",
                      fontSize: "16px",
                    }}
                  >
                    {position.short}
                  </div>

                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: statusColor(position.status),
                      background: statusBackground(position.status),
                      padding: "4px 7px",
                      borderRadius: "6px",
                    }}
                  >
                    {position.status}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "8px",
                    color: "#687386",
                    fontSize: "14px",
                  }}
                >
                  {position.count} players
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BIGGEST NEED */}
        <section
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: "700",
              color: "#687386",
              textTransform: "uppercase",
            }}
          >
            Biggest Current Need
          </div>

          <h2
            style={{
              margin: "7px 0 5px",
              fontSize: "24px",
            }}
          >
            {primaryNeedLabel}
          </h2>

          <p
            style={{
              margin: 0,
              color: "#687386",
              lineHeight: "1.5",
            }}
          >
            {needDescriptions[primaryNeed]}
          </p>
        </section>

        {/* RECOMMENDED ACTIONS */}
        <section style={{ marginBottom: "22px" }}>
          <h2
            style={{
              fontSize: "21px",
              marginBottom: "5px",
            }}
          >
            Recommended Actions
          </h2>

          <p
            style={{
              color: "#687386",
              marginTop: 0,
              marginBottom: "14px",
            }}
          >
            The next moves I would investigate.
          </p>

          <div
            style={{
              display: "grid",
              gap: "10px",
            }}
          >
            <Link
              href="/trades"
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "14px",
                  padding: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: "700",
                      fontSize: "17px",
                    }}
                  >
                    1. Explore Trade Targets
                  </div>

                  <div
                    style={{
                      color: "#687386",
                      fontSize: "14px",
                      marginTop: "4px",
                    }}
                  >
                    Prioritize meaningful upgrades using 2027 capital first.
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "22px",
                  }}
                >
                  →
                </div>
              </div>
            </Link>

            <Link
              href="/free-agents"
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "14px",
                  padding: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: "700",
                      fontSize: "17px",
                    }}
                  >
                    2. Review Free Agents
                  </div>

                  <div
                    style={{
                      color: "#687386",
                      fontSize: "14px",
                      marginTop: "4px",
                    }}
                  >
                    Look for young players who can improve the roster.
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "22px",
                  }}
                >
                  →
                </div>
              </div>
            </Link>

            <Link
              href="/team"
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "14px",
                  padding: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: "700",
                      fontSize: "17px",
                    }}
                  >
                    3. Review My Team
                  </div>

                  <div
                    style={{
                      color: "#687386",
                      fontSize: "14px",
                      marginTop: "4px",
                    }}
                  >
                    Review the detailed roster, IR and Farm/Taxi.
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "22px",
                  }}
                >
                  →
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* DRAFT CAPITAL PHILOSOPHY */}
        <section
          style={{
            background: "#eef2f7",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "22px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: "700",
              color: "#687386",
              textTransform: "uppercase",
            }}
          >
            Draft Capital Rules
          </div>

          <div
            style={{
              display: "grid",
              gap: "9px",
              marginTop: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <strong>2027</strong>
              <span style={{ color: "#687386" }}>
                Primary trade currency
              </span>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <strong>2028</strong>
              <span style={{ color: "#687386" }}>
                Secondary trade currency
              </span>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <strong>2029</strong>
              <span style={{ color: "#687386" }}>
                Do not use for current recommendations
              </span>
            </div>
          </div>
        </section>

        {/* QUICK LINKS */}
        <section>
          <h2
            style={{
              fontSize: "21px",
              marginBottom: "12px",
            }}
          >
            HoRo Tools
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px",
            }}
          >
            <Link
              href="/team"
              style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "13px 8px",
                textAlign: "center",
                textDecoration: "none",
                color: "#172033",
                fontWeight: "700",
                fontSize: "13px",
              }}
            >
              🏈
              <br />
              My Team
            </Link>

            <Link
              href="/trades"
              style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "13px 8px",
                textAlign: "center",
                textDecoration: "none",
                color: "#172033",
                fontWeight: "700",
                fontSize: "13px",
              }}
            >
              🔄
              <br />
              Trades
            </Link>

            <Link
              href="/free-agents"
              style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "13px 8px",
                textAlign: "center",
                textDecoration: "none",
                color: "#172033",
                fontWeight: "700",
                fontSize: "13px",
              }}
            >
              ➕
              <br />
              Free Agents
            </Link>
          </div>
        </section>
      </div>

      {/* NAVIGATION */}
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