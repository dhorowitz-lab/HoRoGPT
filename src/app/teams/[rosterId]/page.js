import Link from "next/link";
import SleeperPlayerLink from "../../../components/SleeperPlayerLink";
import { notFound } from "next/navigation";

import {
  getSleeperData,
  buildLeagueTeams,
} from "../../../lib/sleeper";

import { getFantasyCalcValues } from "../../../lib/fantasycalc";



export default async function LeagueTeamPage({ params }) {
  const { rosterId } = await params;

  const selectedRosterId = Number(rosterId);

  if (!Number.isInteger(selectedRosterId)) {
    notFound();
  }

  const { rosters, users, players } =
    await getSleeperData();

  const roster = rosters.find(
    (item) =>
      Number(item.roster_id) === selectedRosterId
  );

  if (!roster) {
    notFound();
  }

  const teams = buildLeagueTeams(rosters, users);

  const team = teams.find(
    (item) =>
      Number(item.rosterId) === selectedRosterId
  );

  let fantasyCalcValues = {};

  try {
    fantasyCalcValues =
      await getFantasyCalcValues();
  } catch (error) {
    console.error(
      "FantasyCalc unavailable:",
      error
    );
  }

  const starterIds = new Set(
    (roster.starters || []).map(String)
  );

  const irIds = new Set(
    (roster.reserve || []).map(String)
  );

  const farmIds = new Set(
    (roster.taxi || []).map(String)
  );

  const rosterPlayers = (roster.players || [])
    .map((playerId) => {
      const id = String(playerId);
      const sleeperPlayer = players[id];
      const dynasty =
        fantasyCalcValues[id];

      const isDefense =
        !sleeperPlayer &&
        /^[A-Z]{2,3}$/.test(id);

      return {
        id,

        name:
          sleeperPlayer?.full_name ||
          (isDefense
            ? `${id} Defense`
            : id),

        position:
          sleeperPlayer?.position ||
          (isDefense ? "DEF" : ""),

        team:
          sleeperPlayer?.team ||
          (isDefense ? id : "FA"),

        dynastyValue:
          dynasty?.value ?? null,

        dynastyRank:
          dynasty?.overallRank ?? null,

        starter: starterIds.has(id),

        ir: irIds.has(id),

        farm: farmIds.has(id),
      };
    });

  const starters = rosterPlayers
    .filter(
      (player) =>
        player.starter &&
        !player.ir &&
        !player.farm
    )
    .sort(sortPlayers);

  const bench = rosterPlayers
    .filter(
      (player) =>
        !player.starter &&
        !player.ir &&
        !player.farm
    )
    .sort(sortPlayers);

  const ir = rosterPlayers
    .filter((player) => player.ir)
    .sort(sortPlayers);

  const farm = rosterPlayers
    .filter((player) => player.farm)
    .sort(sortPlayers);

  const totalDynastyValue =
    rosterPlayers.reduce(
      (total, player) =>
        total +
        (Number(player.dynastyValue) || 0),
      0
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
            League Team Roster
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
        <Link
          href="/trades"
          style={{
            display: "inline-block",
            marginBottom: "16px",
            color: "#166534",
            fontWeight: "700",
            textDecoration: "none",
          }}
        >
          ← Back to Trade Center
        </Link>

        <section
          style={{
            background: "#172033",
            color: "white",
            borderRadius: "18px",
            padding: "22px",
            marginBottom: "22px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              opacity: ".7",
              fontWeight: "700",
            }}
          >
            TEAM #{selectedRosterId}
          </div>

          <h1
            style={{
              margin: "7px 0 0",
              fontSize: "28px",
            }}
          >
            {team?.teamName ||
              `Team ${selectedRosterId}`}
          </h1>

          <div
            style={{
              marginTop: "5px",
              opacity: ".8",
            }}
          >
            {team?.ownerName}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, 1fr)",
              gap: "10px",
              marginTop: "18px",
            }}
          >
            <SummaryBox
              label="Roster"
              value={`${rosterPlayers.length} players`}
            />

            <SummaryBox
              label="Total FC Value"
              value={totalDynastyValue.toLocaleString()}
            />
          </div>
        </section>

        <RosterSection
          title="Starting Lineup"
          players={starters}
        />

        <RosterSection
          title={`Bench (${bench.length})`}
          players={bench}
        />

        <RosterSection
          title={`IR (${ir.length})`}
          players={ir}
          emptyText="No players currently on IR."
        />

        <RosterSection
          title={`Farm (${farm.length})`}
          players={farm}
          emptyText="No players currently on Farm."
        />
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
            gridTemplateColumns:
              "repeat(4, 1fr)",
            textAlign: "center",
            fontSize: "12px",
            fontWeight: "700",
          }}
        >
          <Link
            href="/"
            style={navStyle}
          >
            🏠
            <br />
            War Room
          </Link>

          <Link
            href="/team"
            style={navStyle}
          >
            🏈
            <br />
            My Team
          </Link>

          <Link
            href="/trades"
            style={{
              ...navStyle,
              color: "#166534",
            }}
          >
            🔄
            <br />
            Trades
          </Link>

          <Link
            href="/free-agents"
            style={navStyle}
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

function RosterSection({
  title,
  players,
  emptyText = "No players.",
}) {
  return (
    <section
      style={{
        marginBottom: "28px",
      }}
    >
      <h2
        style={{
          fontSize: "20px",
        }}
      >
        {title}
      </h2>

      {players.length === 0 ? (
        <div
          style={{
            color: "#687386",
          }}
        >
          {emptyText}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "9px",
          }}
        >
          {players.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function PlayerRow({ player }) {
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
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontWeight: "700",
          }}
        >
          <SleeperPlayerLink
            player={player}
          />
        </div>

        <div
          style={{
            color: "#687386",
            fontSize: "13px",
            marginTop: "4px",
          }}
        >
          {player.position || "—"} •{" "}
          {player.team}
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
            fontWeight: "700",
            fontSize: "16px",
          }}
        >
          {player.dynastyValue !== null
            ? Number(
                player.dynastyValue
              ).toLocaleString()
            : "—"}
        </div>

        <div
          style={{
            color: "#687386",
            fontSize: "10px",
            marginTop: "2px",
          }}
        >
          FC VALUE
        </div>
      </div>
    </div>
  );
}

function SummaryBox({
  label,
  value,
}) {
  return (
    <div
      style={{
        background:
          "rgba(255,255,255,.09)",
        borderRadius: "12px",
        padding: "12px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          opacity: ".65",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontWeight: "700",
          fontSize: "18px",
          marginTop: "4px",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function sortPlayers(a, b) {
  const positionOrder = {
    QB: 1,
    RB: 2,
    WR: 3,
    TE: 4,
    K: 5,
    DEF: 6,
  };

  const aPosition =
    positionOrder[a.position] || 99;

  const bPosition =
    positionOrder[b.position] || 99;

  if (aPosition !== bPosition) {
    return aPosition - bPosition;
  }

  return (
    (Number(b.dynastyValue) || 0) -
    (Number(a.dynastyValue) || 0)
  );
}

const navStyle = {
  color: "#172033",
  textDecoration: "none",
};
