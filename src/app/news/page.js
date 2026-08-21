import Link from "next/link";

import {
  getSleeperData,
  buildHoroPlayers,
} from "../../lib/sleeper";

import {
  getRosterNews,
  getPlayerNews,
} from "../../lib/news";

export default async function NewsPage({
  searchParams,
}) {
  const params = await searchParams;

  const search =
    String(params?.q || "").trim();

  const {
    rosters,
    players,
  } = await getSleeperData();

  const horoPlayers =
    buildHoroPlayers(
      rosters,
      players
    );

  const playerNames =
    horoPlayers.map(
      (player) => player.name
    );

  let rosterNews = [];
  let searchNews = [];

  try {
    rosterNews =
      await getRosterNews(
        playerNames,
        {
          hours: 72,
          limit: 40,
        }
      );
  } catch (error) {
    console.error(
      "Could not load roster news:",
      error
    );
  }

  if (search) {
    try {
      searchNews =
        await getPlayerNews(
          search,
          {
            limit: 20,
          }
        );
    } catch (error) {
      console.error(
        "Could not load player search:",
        error
      );
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fa",
        fontFamily:
          "Arial, sans-serif",
        color: "#172033",
        paddingBottom: "90px",
      }}
    >
      <header
        style={{
          background: "white",
          borderBottom:
            "1px solid #e5e7eb",
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
            Player News
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
            📰 HORO NEWS CENTER
          </div>

          <h1
            style={{
              margin:
                "7px 0 0",
              fontSize: "29px",
            }}
          >
            What&apos;s happening
            with your players?
          </h1>

          <div
            style={{
              marginTop: "8px",
              opacity: ".82",
              lineHeight: "1.5",
            }}
          >
            Recent HoRo roster
            news plus player search.
          </div>
        </section>

        <section
          style={{
            background: "white",
            border:
              "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "18px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              fontWeight: "700",
              fontSize: "18px",
              marginBottom: "10px",
            }}
          >
            Search Player News
          </div>

          <form
            action="/news"
            method="GET"
            style={{
              display: "flex",
              gap: "8px",
            }}
          >
            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder="Enter player name"
              style={{
                flex: 1,
                minWidth: 0,
                border:
                  "1px solid #d1d5db",
                borderRadius:
                  "10px",
                padding:
                  "12px 13px",
                fontSize: "16px",
              }}
            />

            <button
              type="submit"
              style={{
                border: 0,
                borderRadius:
                  "10px",
                padding:
                  "12px 16px",
                background:
                  "#166534",
                color: "white",
                fontWeight:
                  "700",
                cursor: "pointer",
              }}
            >
              Search
            </button>
          </form>
        </section>

        {search && (
          <section
            style={{
              marginBottom:
                "32px",
            }}
          >
            <h2
              style={{
                fontSize: "21px",
                marginBottom:
                  "4px",
              }}
            >
              Latest news for{" "}
              {search}
            </h2>

            <div
              style={{
                color:
                  "#687386",
                fontSize: "14px",
                marginBottom:
                  "12px",
              }}
            >
              Latest available
              articles.
            </div>

            <NewsList
              articles={
                searchNews
              }
              emptyText={`No recent articles found for ${search}.`}
            />
          </section>
        )}

        <section>
          <h2
            style={{
              fontSize: "21px",
              marginBottom: "4px",
            }}
          >
            HoRo News
          </h2>

          <div
            style={{
              color: "#687386",
              fontSize: "14px",
              marginBottom: "12px",
            }}
          >
            News mentioning
            players on your
            current Sleeper
            roster during the
            last 72 hours.
          </div>

          <NewsList
            articles={rosterNews}
            emptyText="No HoRo player news found in the last 72 hours."
            showPlayers
          />
        </section>
      </div>

      <nav
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          background: "white",
          borderTop:
            "1px solid #e5e7eb",
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
              "repeat(5, 1fr)",
            gap: "4px",
            textAlign: "center",
            fontSize: "11px",
            fontWeight: "700",
          }}
        >
          <NavItem
            href="/"
            icon="🏠"
            label="War Room"
          />

          <NavItem
            href="/team"
            icon="🏈"
            label="My Team"
          />

          <NavItem
            href="/trades"
            icon="🔄"
            label="Trades"
          />

          <NavItem
            href="/free-agents"
            icon="➕"
            label="Free Agents"
          />

          <NavItem
            href="/news"
            icon="📰"
            label="News"
            active
          />
        </div>
      </nav>
    </main>
  );
}

function NewsList({
  articles,
  emptyText,
  showPlayers = false,
}) {
  if (
    !articles ||
    articles.length === 0
  ) {
    return (
      <div
        style={{
          background: "white",
          border:
            "1px solid #e5e7eb",
          borderRadius: "14px",
          padding: "16px",
          color: "#687386",
        }}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "9px",
      }}
    >
      {articles.map(
        (article, index) => (
          <article
            key={`${article.link}-${index}`}
            style={{
              background:
                "white",
              border:
                "1px solid #e5e7eb",
              borderRadius:
                "14px",
              padding: "15px",
            }}
          >
            {showPlayers &&
              article.players
                ?.length > 0 && (
                <div
                  style={{
                    color:
                      "#166534",
                    fontSize:
                      "12px",
                    fontWeight:
                      "700",
                    marginBottom:
                      "6px",
                  }}
                >
                  {article.players.join(
                    " • "
                  )}
                </div>
              )}

            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color:
                  "#172033",
                fontWeight:
                  "700",
                fontSize:
                  "16px",
                lineHeight:
                  "1.35",
                textDecoration:
                  "none",
              }}
            >
              {article.title}
            </a>

            <div
              style={{
                color:
                  "#687386",
                fontSize:
                  "13px",
                marginTop:
                  "7px",
              }}
            >
              {article.source ||
                "News"}{" "}
              •{" "}
              {formatTime(
                article.publishedAt
              )}
            </div>
          </article>
        )
      )}
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  active = false,
}) {
  return (
    <Link
      href={href}
      style={{
        color: active
          ? "#166534"
          : "#172033",
        textDecoration: "none",
      }}
    >
      {icon}
      <br />
      {label}
    </Link>
  );
}

function formatTime(dateValue) {
  const date =
    new Date(dateValue);

  const diff =
    Date.now() -
    date.getTime();

  const hours =
    Math.max(
      0,
      Math.floor(
        diff /
          (1000 * 60 * 60)
      )
    );

  if (hours < 1) {
    return "Less than 1 hour ago";
  }

  if (hours < 24) {
    return `${hours} hour${
      hours === 1
        ? ""
        : "s"
    } ago`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  if (days <= 7) {
    return `${days} day${
      days === 1
        ? ""
        : "s"
    } ago`;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}
