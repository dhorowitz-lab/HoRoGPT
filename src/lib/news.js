const GOOGLE_NEWS_URL =
  "https://news.google.com/rss/search";

export async function getPlayerNews(
  playerName,
  options = {}
) {
  const {
    hours = null,
    limit = 20,
  } = options;

  if (!playerName) {
    return [];
  }

  const query = `"${playerName}" NFL`;

  return getGoogleNews(query, {
    hours,
    limit,
  });
}

export async function getRosterNews(
  playerNames,
  options = {}
) {
  const {
    hours = 72,
    limit = 40,
  } = options;

  const cleanNames = [
    ...new Set(
      playerNames
        .map((name) => String(name || "").trim())
        .filter(Boolean)
    ),
  ];

  if (cleanNames.length === 0) {
    return [];
  }

  // Google News works better with smaller OR searches,
  // so break the roster into groups.
  const batches = chunk(cleanNames, 5);

  const results = await Promise.all(
    batches.map(async (names) => {
      const query =
        names
          .map((name) => `"${name}"`)
          .join(" OR ") + " NFL";

      try {
        return await getGoogleNews(query, {
          hours,
          limit: 20,
        });
      } catch (error) {
        console.error(
          "Roster news batch failed:",
          error
        );

        return [];
      }
    })
  );

  const combined = results.flat();

  const tagged = combined.map((article) => ({
    ...article,
    players: matchPlayers(
      article,
      cleanNames
    ),
  }));

  return dedupeArticles(tagged)
    .sort(
      (a, b) =>
        new Date(b.publishedAt) -
        new Date(a.publishedAt)
    )
    .slice(0, limit);
}

async function getGoogleNews(
  query,
  options = {}
) {
  const {
    hours = null,
    limit = 20,
  } = options;

  const url =
    `${GOOGLE_NEWS_URL}?q=` +
    encodeURIComponent(query) +
    "&hl=en-US&gl=US&ceid=US:en";

  const response = await fetch(url, {
    next: {
      revalidate: 900,
    },
    headers: {
      "User-Agent":
        "Mozilla/5.0 HoRoGPT News Reader",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Google News failed: ${response.status}`
    );
  }

  const xml = await response.text();

  let articles = parseGoogleNews(xml);

  if (hours) {
    const cutoff =
      Date.now() -
      hours * 60 * 60 * 1000;

    articles = articles.filter(
      (article) =>
        new Date(
          article.publishedAt
        ).getTime() >= cutoff
    );
  }

  return articles.slice(0, limit);
}

function parseGoogleNews(xml) {
  const itemMatches =
    xml.match(/<item>[\s\S]*?<\/item>/g) ||
    [];

  return itemMatches
    .map((item) => {
      const title = readTag(
        item,
        "title"
      );

      const link = readTag(
        item,
        "link"
      );

      const publishedAt = readTag(
        item,
        "pubDate"
      );

      const description = readTag(
        item,
        "description"
      );

      const sourceMatch = item.match(
        /<source[^>]*>([\s\S]*?)<\/source>/i
      );

      const source = sourceMatch
        ? decodeXml(sourceMatch[1])
        : "";

      return {
        title: cleanTitle(
          decodeXml(title),
          source
        ),

        link: decodeXml(link),

        source,

        publishedAt,

        description: stripHtml(
          decodeXml(description)
        ),
      };
    })
    .filter(
      (article) =>
        article.title &&
        article.link &&
        article.publishedAt
    );
}

function readTag(text, tag) {
  const match = text.match(
    new RegExp(
      `<${tag}>([\\s\\S]*?)<\\/${tag}>`,
      "i"
    )
  );

  if (!match) {
    return "";
  }

  return match[1]
    .replace(
      /^<!\[CDATA\[([\s\S]*?)\]\]>$/,
      "$1"
    )
    .trim();
}

function decodeXml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTitle(title, source) {
  if (!source) {
    return title;
  }

  const ending = ` - ${source}`;

  if (title.endsWith(ending)) {
    return title.slice(
      0,
      -ending.length
    );
  }

  return title;
}

function matchPlayers(
  article,
  playerNames
) {
  const text = normalize(
    `${article.title} ${article.description}`
  );

  const matches = playerNames.filter(
    (name) => {
      const full = normalize(name);

      if (text.includes(full)) {
        return true;
      }

      const parts = full.split(" ");

      const lastName =
        parts[parts.length - 1];

      return (
        lastName.length >= 5 &&
        text.includes(lastName)
      );
    }
  );

  return [...new Set(matches)];
}

function normalize(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeArticles(articles) {
  const seen = new Set();

  return articles.filter((article) => {
    const key = normalize(
      article.title
    );

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}

function chunk(array, size) {
  const output = [];

  for (
    let i = 0;
    i < array.length;
    i += size
  ) {
    output.push(
      array.slice(i, i + size)
    );
  }

  return output;
}
