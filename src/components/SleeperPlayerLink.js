export default function SleeperPlayerLink({ player }) {
  const id = String(player?.id || "");
  const name = player?.name || "Unknown Player";

  // Team defenses do not have normal individual player pages.
  const isDefense =
    player?.position === "DEF" ||
    /^[A-Z]{2,3}$/.test(id);

  if (!id || isDefense) {
    return <span>{name}</span>;
  }

  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const url =
    `https://sleeper.com/nfl/players/${slug}-${id}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: "#166534",
        fontWeight: "700",
        textDecoration: "underline",
        textUnderlineOffset: "2px",
      }}
      title={`View ${name} on Sleeper`}
    >
      {name}
    </a>
  );
}
