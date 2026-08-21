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
  const { league, rosters, users, players } = await getSleeperData();

  const teams = buildLeagueTeams(rosters, users);

  let fantasyCalcValues = {};

  try {
    fantasyCalcValues = await getFantasyCalcValues();
  } catch (error) {
    console.error("FantasyCalc unavailable:", error);
  }

  const leagueAnalysis = buildLeaguePositionRankings({
    rosters,
    players,
    teams,
    valueMap: fantasyCalcValues,
    horoRosterId: HORO_ROSTER_ID,
  });

  const positionSnapshot = POSITIONS.map((position) => {
    const data = leagueAnalysis.horo[position] || {};

    return {
      position,
      rank: data.rank || teams.length,
      leagueSize: data.leagueSize || teams.length,
      status: data.status || "UNKNOWN",
    };
  }).sort((a, b) => b.rank - a.rank);

  const biggestNeed = positionSnapshot[0];
  const strongestPosition =
    [...positionSnapshot].sort((a, b) => a.rank - b.rank)[0] ||
    positionSnapshot[0];

  const targetPosition = biggestNeed.position;

  const tradeTargets = buildTradeTargets({
    targetPosition,
    leagueAnalysis,
  }).slice(0, 10);

  const partnerTeams = buildPartnerTeams({
    targetPosition,
    leagueAnalysis,
  }).slice(0, 5);

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
            Trade Center
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
              marginBottom: "7px",
            }}
          >
            LIVE TRADE BOARD
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "29px",
            }}
          >
            Trade Center
          </h1>

          <div
            style={{
              marginTop: "7px",
              opacity: ".8",
              lineHeight: "1.4",
            }}
          >
            Find teams with depth where HoRo needs help.
          </div>

          <div
            style={{
              marginTop: "18px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            <SummaryBox
              label="Biggest Need"
              value={targetPosition}
              subtext={`#${biggestNeed.rank} of ${biggestNeed.leagueSize}`}
            />

            <SummaryBox
              label="Best Strength"
              value={strongestPosition.position}
              subtext={`#${strongestPosition.rank} of ${strongestPosition.leagueSize}`}
            />
          </div>
        </section>

        <section
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "16px",
            padding: "18px",
            marginBottom: "22px",
          }}
        >
          <div
            style={{
              color: "#b91c1c",
              fontSize: "12px",
              fontWeight: "700",
            }}
          >
            🎯 CURRENT TRADE PRIORITY
          </div>

          <div
            style={{
              fontSize: "23px",
              fontWeight: "700",
              marginTop: "6px",
            }}
          >
            Upgrade {targetPosition}
          </div>

          <div
            style={{
              color: "#687386",
              fontSize: "14px",
              lineHeight: "1.5",
              marginTop: "6px",
            }}
          >
            HoRo currently ranks #{biggestNeed.rank} of{" "}
            {biggestNeed.leagueSize} at {targetPosition}. Start by
            calling teams that have strong depth at this position.
          </div>
        </section>

        <section
          style={{
            marginBottom: "28px",
          }}
        >
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
            Teams with some of the strongest {targetPosition} rooms
            in the league.
          </div>

          <div
            style={{
              display: "grid",
              gap: "9px",
            }}
          >
            {partnerTeams.map((team) => (
              <PartnerCard
                key={team.rosterId}
                team={team}
                position={targetPosition}
              />
            ))}
          </div>
        </section>

        <section
          style={{
            marginBottom: "28px",
          }}
        >
          <h2
            style={{
              fontSize: "21px",
              marginBottom: "5px",
            }}
          >
            Recommended {targetPosition} Targets
          </h2>

          <div
            style={{
              color: "#687386",
              fontSize: "14px",
              lineHeight: "1.45",
              marginBottom: "12px",
            }}
          >
            These are players on teams with depth at {targetPosition}.
            HoRoGPT favors secondary players rather than automatically
            targeting another team's most valuable cornerstone.
          </div>

          {tradeTargets.length > 0 ? (
            <div
              style={{
                display: "grid",
                gap: "9px",
              }}
            >
              {tradeTargets.map((target, index) => (
                <TargetCard
                  key={`${target.rosterId}-${target.id}`}
                  target={target}
                  number={index + 1}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "14px",
                padding: "16px",
                color: "#687386",
              }}
            >
              No ranked trade targets are available right now.
            </div>
          )}
        </section>

        <section
          style={{
            background: "#ecfdf3",
            border: "1px solid #bbf7d0",
            borderRadius: "16px",
            padding: "18px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "#166534",
              fontWeight: "700",
            }}
          >
            💡 HOW TO USE THIS
          </div>

          <div
            style={{
              marginTop: "7px",
              fontWeight: "700",
              fontSize: "18px",
            }}
          >
            Target depth, not just stars.
          </div>

          <div
            style={{
              color: "#4b5563",
              fontSize: "14px",
              lineHeight: "1.5",
              marginTop: "6px",
            }}
          >
            A team that is deep at {targetPosition} may be more willing
            to move its second or third option. FantasyCalc value gives
            us a starting point for comparing trade value.
          </div>
        </section>

        <section
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "18px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "#687386",
              fontWeight: "700",
            }}
          >
            VERSION 1 TRADE ENGINE
          </div>

          <div
            style={{
              marginTop: "7px",
              fontWeight: "700",
              fontSize: "18px",
            }}
          >
            Target finder is live.
          </div>

          <div
            style={{
              color: "#687386",
              fontSize: "14px",
              lineHeight: "1.5",
              marginTop: "6px",
            }}
          >
            The next upgrade can add actual trade packages using HoRo
            players and draft picks. For now, this page identifies who
            to target and which teams are most logical to approach.
          </div>
        </section>
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

function buildPartnerTeams({
  targetPosition,
  leagueAnalysis,
}) {
  const ranking =
    leagueAnalysis.rankings[targetPosition] || [];

  return ranking
    .filter(
      (team) =>
        Number(team.rosterId) !== Number(HORO_ROSTER_ID)
    )
    .filter((team) => (team.players || []).length >= 2)
    .map((team) => ({
      rosterId: team.rosterId,
      teamName: team.teamName,
      ownerName: team.ownerName,
      rank: team.rank,
      playerCount: team.playerCount,
      coreValue: team.coreValue || 0,
    }))
    .sort((a, b) => a.rank - b.rank);
}

function buildTradeTargets({
  targetPosition,
  leagueAnalysis,
}) {
  const ranking =
    leagueAnalysis.rankings[targetPosition] || [];

  const targets = [];

  ranking
    .filter(
      (team) =>
        Number(team.rosterId) !== Number(HORO_ROSTER_ID)
    )
    .forEach((team) => {
      const players = team.players || [];

      let candidates = [];

      if (targetPosition === "QB") {
        candidates = players.slice(1, 3);
      } else if (targetPosition === "RB") {
        candidates = players.slice(2, 5);
      } else if (targetPosition === "WR") {
        candidates = players.slice(2, 5);
      } else if (targetPosition === "TE") {
        candidates = players.slice(1, 3);
      }

      candidates.forEach((player, depthIndex) => {
        if (!player.dynastyValue) return;

        targets.push({
          ...player,
          rosterId: team.rosterId,
          teamName: team.teamName,
          ownerName: team.ownerName,
          positionRank: team.rank,
          depthIndex: depthIndex + 1,
        });
      });
    });

  return targets.sort((a, b) => {
    const rankDifference =
      a.positionRank - b.positionRank;

    if (rankDifference !== 0) {
      return rankDifference;
    }

    return (
      (b.dynastyValue || 0) -
      (a.dynastyValue || 0)
    );
  });
}

function SummaryBox({
  label,
  value,
  subtext,
}) {
  return (
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
        {label}
      </div>

      <div
        style={{
          marginTop: "4px",
          fontWeight: "700",
          fontSize: "20px",
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: "3px",
          opacity: ".72",
          fontSize: "12px",
        }}
      >
        {subtext}
      </div>
    </div>
  );
}

function PartnerCard({
  team,
  position,
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "15px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div>
        <div
          style={{
            fontWeight: "700",
            fontSize: "16px",
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
          flexShrink: 0,
        }}
      >
        <div
          style={{
            color: "#166534",
            fontWeight: "700",
          }}
        >
          #{team.rank} {position}
        </div>

        <div
          style={{
            color: "#687386",
            fontSize: "12px",
            marginTop: "3px",
          }}
        >
          {team.playerCount} players
        </div>
      </div>
    </div>
  );
}

function TargetCard({
  target,
  number,
}) {
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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "11px",
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
              flexShrink: 0,
            }}
          >
            {number}
          </div>

          <div>
            <div
              style={{
                fontWeight: "700",
                fontSize: "17px",
              }}
            >
              {target.name}
            </div>

            <div
              style={{
                color: "#687386",
                fontSize: "13px",
                marginTop: "3px",
              }}
            >
              {target.position} • {target.team}
            </div>
          </div>
        </div>

        <div
          style={{
            textAlign: "right",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              color: "#166534",
              fontWeight: "700",
              fontSize: "17px",
            }}
          >
            {formatValue(target.dynastyValue)}
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
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          fontSize: "13px",
        }}
      >
        <div style={{ color: "#687386" }}>
          Owned by{" "}
          <strong style={{ color: "#172033" }}>
            {target.teamName}
          </strong>
        </div>

        <div style={{ color: "#687386" }}>
          Team ranks{" "}
          <strong style={{ color: "#172033" }}>
            #{target.positionRank}
          </strong>{" "}
          at {target.position}
        </div>
      </div>
    </div>
  );
}

function formatValue(value) {
  if (!value) return "—";

  return Number(value).toLocaleString();
}
