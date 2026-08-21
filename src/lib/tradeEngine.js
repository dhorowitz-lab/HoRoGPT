/*
 * HoRoGPT Trade Engine
 *
 * Dynasty trade engine for the HoRo / St. Jude Heroes league.
 *
 * PRIMARY OBJECTIVES
 * ------------------
 * 1. Identify realistic trade targets based on roster surplus.
 * 2. Protect HoRo's core players.
 * 3. Prioritize 2027 draft capital over 2028.
 * 4. Estimate future pick quality from the original owner's roster strength.
 * 5. Never use 2029+ picks.
 * 6. Never offer more than one player.
 * 7. Never offer more than one pick.
 * 8. Prefer clean, realistic trades over mathematical value matching.
 * 9. When acquiring a QB, NEVER offer a HoRo QB.
 */

const STAGE_RULES = {
  opening: {
    minimum: 0.65,
    maximum: 0.82,
    ideal: 0.75,
  },

  likely: {
    minimum: 0.82,
    maximum: 1.00,
    ideal: 0.91,
  },

  maximum: {
    minimum: 0.95,
    maximum: 1.08,
    ideal: 1.02,
  },
};


/*
 * ==================================================
 * BUILD TRADE TARGETS
 * ==================================================
 */

export function buildTradeTargets({
  rosters,
  players,
  teams,
  valueMap,
  horoRosterId,
  targetPosition,
  horoPlayers = [],
}) {
  const horoAtPosition = horoPlayers
    .filter(
      (player) =>
        player.position === targetPosition &&
        Number(player.dynastyValue || 0) > 0
    )
    .sort(
      (a, b) =>
        Number(b.dynastyValue || 0) -
        Number(a.dynastyValue || 0)
    );

  const horoBest =
    Number(horoAtPosition[0]?.dynastyValue || 0);

  const horoSecond =
    Number(horoAtPosition[1]?.dynastyValue || 0);

  const targets = [];

  rosters.forEach((roster) => {
    if (
      Number(roster.roster_id) ===
      Number(horoRosterId)
    ) {
      return;
    }

    const team = teams.find(
      (item) =>
        Number(item.rosterId) ===
        Number(roster.roster_id)
    );

    const positionPlayers =
      (roster.players || [])
        .map((playerId) => {
          const player = players[playerId];

          if (
            !player ||
            player.position !== targetPosition
          ) {
            return null;
          }

          const dynasty =
            valueMap[String(playerId)];

          if (!dynasty?.value) {
            return null;
          }

          return {
            id: playerId,

            name:
              player.full_name ||
              `${player.first_name || ""} ${
                player.last_name || ""
              }`.trim(),

            position: player.position,

            nflTeam:
              player.team || "FA",

            age:
              player.age ?? null,

            rosterId:
              roster.roster_id,

            teamName:
              team?.teamName ||
              `Team ${roster.roster_id}`,

            ownerName:
              team?.ownerName ||
              `Roster ${roster.roster_id}`,

            starter:
              roster.starters?.includes(playerId) ||
              false,

            dynastyValue:
              Number(dynasty.value),

            dynastyRank:
              dynasty.overallRank ?? null,
          };
        })
        .filter(Boolean)
        .sort(
          (a, b) =>
            b.dynastyValue -
            a.dynastyValue
        );

    positionPlayers.forEach((player, index) => {
      const depthRank = index + 1;
      const positionDepth =
        positionPlayers.length;

      const availabilityScore =
        getAvailabilityScore({
          positionDepth,
          depthRank,
          starter: player.starter,
        });

      const upgradeScore =
        getUpgradeScore({
          value: player.dynastyValue,
          horoBest,
          horoSecond,
        });

      const qualityScore =
        getQualityScore(
          player.dynastyValue
        );

      const ageScore =
        getAgeScore(
          player.age,
          targetPosition
        );

      const realismPenalty =
        getRealismPenalty(
          player.dynastyValue
        );

      const totalScore =
        availabilityScore +
        upgradeScore +
        qualityScore +
        ageScore -
        realismPenalty;

      const tier =
        determineTier({
          value: player.dynastyValue,
          totalScore,
          positionDepth,
          depthRank,
          starter: player.starter,
        });

      targets.push({
        ...player,

        depthRank,
        positionDepth,

        availabilityScore,
        upgradeScore,
        qualityScore,
        ageScore,

        totalScore,

        tier,
      });
    });
  });

  return targets.sort((a, b) => {
    const tierOrder = {
      "BEST FIT": 1,
      AGGRESSIVE: 2,
      "CHEAP DEPTH": 3,
      "LONG SHOT": 4,
    };

    const aTier =
      tierOrder[a.tier] || 99;

    const bTier =
      tierOrder[b.tier] || 99;

    if (aTier !== bTier) {
      return aTier - bTier;
    }

    return b.totalScore - a.totalScore;
  });
}


/*
 * ==================================================
 * BUILD COMPLETE NEGOTIATION PLAN
 * ==================================================
 */

export function recommendTradePlan({
  target,
  horoPlayers = [],
  draftPicks = [],
  targetPosition,
  rosters = [],
}) {
  if (!target?.dynastyValue) {
    return null;
  }

  const targetValue = Number(target.dynastyValue);

  /*
   * When acquiring a QB, HoRo QBs are never offered.
   * We also protect the top two players at each position
   * and high-value cornerstone assets.
   */
  const eligiblePlayers = horoPlayers
    .filter(
      (player) =>
        Number(player.dynastyValue || 0) > 0
    )
    .filter(
      (player) =>
        !isCoreHoroPlayer(
          player,
          horoPlayers,
          player.position
        )
    )
    .filter(
      (player) =>
        isTradeableHoroPlayer(
          player,
          targetPosition,
          horoPlayers
        )
    )
    .sort(
      (a, b) =>
        Number(a.dynastyValue || 0) -
        Number(b.dynastyValue || 0)
    );

  /*
   * Only 2027 and 2028 picks are eligible.
   * 2027 is intentionally preferred over 2028.
   */
  const eligiblePicks = normalizePicks(
    draftPicks,
    rosters
  );

  /*
   * Build a negotiation ladder:
   *
   * Opening = cheapest credible offer.
   * Likely  = next realistic step upward.
   * Maximum = final price we are willing to pay.
   *
   * Each stage excludes the exact package used by the
   * previous stage, so the UI does not show the same
   * offer three times.
   */
  const openingOffer = findBestPackage({
    players: eligiblePlayers,
    picks: eligiblePicks,
    targetValue,
    targetPosition,
    stage: "opening",
    excludedOffers: [],
  });

  const likelyOffer = findBestPackage({
    players: eligiblePlayers,
    picks: eligiblePicks,
    targetValue,
    targetPosition,
    stage: "likely",
    excludedOffers: [openingOffer],
  });

  const maximumOffer = findBestPackage({
    players: eligiblePlayers,
    picks: eligiblePicks,
    targetValue,
    targetPosition,
    stage: "maximum",
    excludedOffers: [openingOffer, likelyOffer],
  });

  return {
    target,
    targetValue,

    openingOffer,
    likelyOffer,
    maximumOffer,

    verdict: getTradeVerdict({
      target,
      openingOffer,
      likelyOffer,
    }),

    recommendation: getRecommendationText({
      target,
      openingOffer,
      likelyOffer,
    }),
  };
}


/*
 * ==================================================
 * BACKWARDS COMPATIBILITY
 * ==================================================
 */

export function recommendPlayerOffer({
  target,
  horoPlayers = [],
  targetPosition,
}) {
  const plan =
    recommendTradePlan({
      target,
      horoPlayers,
      draftPicks: [],
      targetPosition,
      rosters: [],
    });

  if (!plan?.openingOffer) {
    return null;
  }

  return {
    target,

    offeredPlayers:
      plan.openingOffer.players,

    offeredPicks:
      plan.openingOffer.picks,

    targetValue:
      plan.targetValue,

    offerValue:
      plan.openingOffer.totalValue,

    valueDifference:
      plan.openingOffer.totalValue -
      plan.targetValue,

    valueRatio:
      plan.openingOffer.totalValue /
      plan.targetValue,

    verdict:
      plan.verdict,
  };
}


/*
 * ==================================================
 * FIND BEST PACKAGE
 * ==================================================
 *
 * HARD RULES:
 *
 * - Maximum 1 player
 * - Maximum 1 pick
 * - Only 2027 / 2028
 */

function findBestPackage({
  players,
  picks,
  targetValue,
  targetPosition,
  stage,
  excludedOffers = [],
}) {
  const candidates = [];

  const rules =
    STAGE_RULES[stage] ||
    STAGE_RULES.likely;

  /*
   * --------------------------------------------------
   * PLAYER ONLY
   * --------------------------------------------------
   */

  players.forEach((player) => {
    const value = Number(player.dynastyValue || 0);

    if (value <= 0) {
      return;
    }

    const ratio = value / targetValue;

    if (
      ratio < rules.minimum ||
      ratio > rules.maximum
    ) {
      return;
    }

    candidates.push({
      players: [player],
      picks: [],
      totalValue: value,
      packageScore: scoreTradePackage({
        players: [player],
        picks: [],
        totalValue: value,
        targetValue,
        targetPosition,
        stage,
      }),
    });
  });

  /*
   * --------------------------------------------------
   * PICK ONLY
   * --------------------------------------------------
   */

  picks.forEach((pick) => {
    const value = Number(pick.value || 0);

    if (value <= 0) {
      return;
    }

    const ratio = value / targetValue;

    const is2027First =
      Number(pick.year) === 2027 &&
      Number(pick.round) === 1;

    /*
     * A 2027 1st is our preferred opening currency.
     * It can be used slightly above the normal opening
     * ceiling because it is the most valuable pick
     * HoRo owns in the allowed window.
     */
    const maximumAllowedRatio =
      stage === "opening" && is2027First
        ? 0.82
        : rules.maximum;

    if (
      ratio < rules.minimum ||
      ratio > maximumAllowedRatio
    ) {
      return;
    }

    if (!isStrongEnoughPick(pick, targetValue)) {
      return;
    }

    candidates.push({
      players: [],
      picks: [pick],
      totalValue: value,
      packageScore: scoreTradePackage({
        players: [],
        picks: [pick],
        totalValue: value,
        targetValue,
        targetPosition,
        stage,
      }),
    });
  });

  /*
   * --------------------------------------------------
   * PLAYER + ONE PICK
   * --------------------------------------------------
   */

  players.forEach((player) => {
    picks.forEach((pick) => {
      const totalValue =
        Number(player.dynastyValue || 0) +
        Number(pick.value || 0);

      const ratio = totalValue / targetValue;

      if (
        ratio < rules.minimum ||
        ratio > rules.maximum
      ) {
        return;
      }

      /*
       * Do not use a player+pick package for the opening
       * if a clean 2027 1st is already available. The
       * opening should stay simple and cheap.
       */
      if (
        stage === "opening" &&
        Number(pick.year) === 2027 &&
        Number(pick.round) === 1
      ) {
        return;
      }

      candidates.push({
        players: [player],
        picks: [pick],
        totalValue,
        packageScore: scoreTradePackage({
          players: [player],
          picks: [pick],
          totalValue,
          targetValue,
          targetPosition,
          stage,
        }),
      });
    });
  });

  /*
   * Remove packages already used by an earlier stage.
   */
  const freshCandidates = candidates.filter(
    (candidate) =>
      !excludedOffers.some((excluded) =>
        sameOffer(candidate, excluded)
      )
  );

  if (!freshCandidates.length) {
    /*
     * If there is no new package at this stage, allow the
     * prior package rather than returning a misleading offer.
     */
    return null;
  }

  /*
   * --------------------------------------------------
   * STAGE-SPECIFIC SELECTION
   * --------------------------------------------------
   *
   * Opening:
   *   Prefer a clean 2027 1st when it qualifies.
   *
   * Likely:
   *   Prefer the next credible package above opening,
   *   with 2027 capital strongly preferred.
   *
   * Maximum:
   *   Prefer the strongest realistic package while
   *   staying below the maximum price ceiling.
   */
  freshCandidates.sort((a, b) => {
    const aRatio =
      a.totalValue / targetValue;

    const bRatio =
      b.totalValue / targetValue;

    const a2027 =
      has2027Pick(a);

    const b2027 =
      has2027Pick(b);

    if (stage === "opening") {
      const a2027First =
        isPreferred2027Package(a);
      const b2027First =
        isPreferred2027Package(b);

      if (a2027First !== b2027First) {
        return a2027First ? -1 : 1;
      }

      /*
       * For an opening offer, cheaper is better.
       */
      if (Math.abs(aRatio - bRatio) > 0.04) {
        return aRatio - bRatio;
      }
    }

    if (stage === "likely") {
      /*
       * Favor 2027 packages, then packages near the
       * likely target value.
       */
      if (a2027 !== b2027) {
        return a2027 ? -1 : 1;
      }

      const aDistance =
        Math.abs(aRatio - rules.ideal);
      const bDistance =
        Math.abs(bRatio - rules.ideal);

      if (
        Math.abs(aDistance - bDistance) > 0.03
      ) {
        return aDistance - bDistance;
      }
    }

    if (stage === "maximum") {
      /*
       * Maximum should be the strongest package we can
       * justify, with 2027 still preferred.
       */
      if (a2027 !== b2027) {
        return a2027 ? -1 : 1;
      }

      if (
        Math.abs(aRatio - bRatio) > 0.025
      ) {
        return bRatio - aRatio;
      }
    }

    return (
      b.packageScore -
      a.packageScore
    );
  });

  return freshCandidates[0];
}


function sameOffer(a, b) {
  if (!a || !b) {
    return false;
  }

  const aPlayers =
    (a.players || [])
      .map((p) => String(p.id))
      .sort()
      .join(",");

  const bPlayers =
    (b.players || [])
      .map((p) => String(p.id))
      .sort()
      .join(",");

  const aPicks =
    (a.picks || [])
      .map(
        (p) =>
          `${p.year}-${p.round}-${p.originalOwnerId ?? ""}`
      )
      .sort()
      .join(",");

  const bPicks =
    (b.picks || [])
      .map(
        (p) =>
          `${p.year}-${p.round}-${p.originalOwnerId ?? ""}`
      )
      .sort()
      .join(",");

  return (
    aPlayers === bPlayers &&
    aPicks === bPicks
  );
}


function has2027Pick(offer) {
  return (offer?.picks || []).some(
    (pick) => Number(pick.year) === 2027
  );
}


/*
 * ==================================================
 * PREFER 2027 PACKAGE
 * ================================================== */



function isPreferred2027Package(
  offer
) {
  if (
    offer.picks?.length !== 1
  ) {
    return false;
  }

  return (
    Number(
      offer.picks[0].year
    ) === 2027 &&
    Number(
      offer.picks[0].round
    ) === 1
  );
}


/*
 * ==================================================
 * SCORE TRADE PACKAGE
 * ==================================================
 */

function scoreTradePackage({
  players,
  picks,
  totalValue,
  targetValue,
  targetPosition,
  stage,
}) {
  let score = 0;

  const ratio =
    totalValue / targetValue;

  const rules =
    STAGE_RULES[stage] ||
    STAGE_RULES.likely;

  /*
   * VALUE FIT
   */

  const distance =
    Math.abs(
      ratio - rules.ideal
    );

  score += Math.max(
    0,
    100 - distance * 180
  );


  /*
   * SIMPLE PACKAGE BONUS
   */

  if (
    players.length === 0 &&
    picks.length === 1
  ) {
    score += 35;
  }

  if (
    players.length === 1 &&
    picks.length === 0
  ) {
    score += 30;
  }

  if (
    players.length === 1 &&
    picks.length === 1
  ) {
    score += 20;
  }


  /*
   * PLAYER QUALITY
   */

  players.forEach((player) => {
    const value =
      Number(player.dynastyValue || 0);

    if (value >= 5000) {
      score += 12;
    } else if (value >= 4000) {
      score += 10;
    } else if (value >= 3000) {
      score += 8;
    } else if (value >= 2000) {
      score += 5;
    } else {
      score += 1;
    }

    /*
     * When acquiring a QB,
     * non-QB assets are preferred.
     */

    if (
      targetPosition === "QB" &&
      player.position !== "QB"
    ) {
      score += 12;
    }
  });


  /*
   * PICK QUALITY
   */

  picks.forEach((pick) => {
    score +=
      getPickQualityScore(pick);
  });


  /*
   * 2027 PRIORITY
   */

  if (
    picks.length === 1
  ) {
    if (
      Number(picks[0].year) === 2027
    ) {
      score += 45;
    } else {
      score -= 15;
    }
  }


  /*
   * QB-SPECIFIC LOGIC
   */

  if (
    targetPosition === "QB"
  ) {
    if (
      players.length === 0 &&
      picks.length === 1
    ) {
      score += 35;
    }

    if (
      players.length === 1 &&
      picks.length === 1
    ) {
      score += 5;
    }
  }


  /*
   * OPENING
   */

  if (
    stage === "opening"
  ) {
    /*
     * Don't punish a good 2027 1st
     * simply because it is close to market.
     */

    if (
      picks.length === 1 &&
      Number(picks[0].year) === 2027 &&
      Number(picks[0].round) === 1
    ) {
      score += 35;
    }

    /*
     * We prefer a 2027 1st over a
     * cheaper 2028 1st.
     */

    if (
      picks.length === 1 &&
      Number(picks[0].year) === 2028
    ) {
      score -= 20;
    }
  }


  /*
   * LIKELY
   */

  if (
    stage === "likely"
  ) {
    if (
      players.length === 0 &&
      picks.length === 1
    ) {
      score += 20;
    }
  }


  /*
   * MAXIMUM
   */

  if (
    stage === "maximum"
  ) {
    if (
      players.length === 1 &&
      picks.length === 1
    ) {
      score += 15;
    }

    if (
      picks.length === 1 &&
      Number(picks[0].year) === 2027
    ) {
      score += 20;
    }
  }


  /*
   * OVERPAY PENALTY
   */

  if (ratio > 1) {
    score -=
      (ratio - 1) * 140;
  }

  if (ratio > 1.05) {
    score -= 25;
  }

  if (ratio > 1.10) {
    score -= 50;
  }

  return score;
}


/*
 * ==================================================
 * PICK QUALITY
 * ==================================================
 */

function getPickQualityScore(
  pick
) {
  const year =
    Number(pick.year);

  const round =
    Number(pick.round);

  if (year >= 2029) {
    return -1000;
  }

  const base =
    getBasePickScore(round);

  const yearMultiplier =
    year === 2027
      ? 1.00
      : 0.78;

  const projectedSlot =
    Number(
      pick.projectedSlot || 7
    );

  let slotMultiplier = 1.00;

  if (projectedSlot <= 3) {
    slotMultiplier = 1.25;
  } else if (projectedSlot <= 6) {
    slotMultiplier = 1.12;
  } else if (projectedSlot <= 10) {
    slotMultiplier = 1.00;
  } else {
    slotMultiplier = 0.88;
  }

  return Math.round(
    base *
    yearMultiplier *
    slotMultiplier
  );
}


/*
 * ==================================================
 * BASE PICK SCORE
 * ==================================================
 */

function getBasePickScore(
  round
) {
  const values = {
    1: 4200,
    2: 2300,
    3: 1200,
    4: 700,
    5: 450,
    6: 300,
    7: 200,
  };

  return (
    values[Number(round)] ||
    100
  );
}


/*
 * ==================================================
 * STRONG ENOUGH PICK
 * ==================================================
 */

function isStrongEnoughPick(
  pick,
  targetValue
) {
  if (!pick?.value) {
    return false;
  }

  const year =
    Number(pick.year);

  const round =
    Number(pick.round);

  /*
   * Only 2027 / 2028.
   */

  if (
    year !== 2027 &&
    year !== 2028
  ) {
    return false;
  }


  /*
   * 2027 FIRST
   */

  if (
    round === 1 &&
    year === 2027
  ) {
    return (
      pick.value >=
      targetValue * 0.60
    );
  }


  /*
   * 2028 FIRST
   */

  if (
    round === 1 &&
    year === 2028
  ) {
    return (
      pick.value >=
      targetValue * 0.65
    );
  }


  /*
   * 2027 SECOND
   */

  if (
    round === 2 &&
    year === 2027
  ) {
    return (
      pick.value >=
      targetValue * 0.55
    );
  }


  /*
   * 2028 SECOND
   */

  if (
    round === 2 &&
    year === 2028
  ) {
    return (
      pick.value >=
      targetValue * 0.60
    );
  }

  return false;
}


/*
 * ==================================================
 * NORMALIZE PICKS
 * ==================================================
 */

function normalizePicks(
  picks,
  rosters
) {
  return (
    picks || []
  )
    .map((pick) => {
      const year =
        pick.year ??
        pick.season ??
        pick.season_year;

      const round =
        pick.round ??
        pick.round_number;

      if (!year || !round) {
        return null;
      }

      if (
        Number(year) !== 2027 &&
        Number(year) !== 2028
      ) {
        return null;
      }

      const originalOwnerId =
        Number(
          pick.originalOwnerId ??
          pick.owner_id ??
          pick.original
        );

      const projectedSlot =
        estimateProjectedSlot({
          originalOwnerId,
          rosters,
        });

      return {
        year: Number(year),

        round: Number(round),

        originalOwnerId:
          Number.isFinite(
            originalOwnerId
          )
            ? originalOwnerId
            : null,

        projectedSlot,

        projectedRange:
          getProjectedRange(
            projectedSlot
          ),

        value:
          getPickValue({
            year,
            round,
            projectedSlot,
          }),
      };
    })
    .filter(Boolean);
}


/*
 * ==================================================
 * ESTIMATE PROJECTED DRAFT SLOT
 * ==================================================
 */

function estimateProjectedSlot({
  originalOwnerId,
  rosters,
}) {
  if (
    !Number.isFinite(
      originalOwnerId
    )
  ) {
    return 7;
  }

  const roster =
    (rosters || []).find(
      (item) =>
        Number(item.roster_id) ===
        originalOwnerId
    );

  if (!roster) {
    return 7;
  }

  const strength =
    calculateRosterStrength(
      roster
    );

  const allStrengths =
    (rosters || [])
      .map(
        (item) =>
          calculateRosterStrength(
            item
          )
      )
      .sort(
        (a, b) =>
          a - b
      );

  if (!allStrengths.length) {
    return 7;
  }

  let rank = 1;

  allStrengths.forEach(
    (value) => {
      if (value < strength) {
        rank++;
      }
    }
  );

  return Math.max(
    1,
    Math.min(
      allStrengths.length,
      rank
    )
  );
}


/*
 * ==================================================
 * CALCULATE ROSTER STRENGTH
 * ==================================================
 */

function calculateRosterStrength(
  roster
) {
  const settings =
    roster?.settings || {};

  const wins =
    Number(settings.wins || 0);

  const losses =
    Number(settings.losses || 0);

  const ties =
    Number(settings.ties || 0);

  const fpts =
    Number(settings.fpts || 0);

  const games =
    wins + losses + ties;

  const winPct =
    games > 0
      ? wins / games
      : 0.5;

  const pointsComponent =
    fpts > 0
      ? Math.min(
          1,
          fpts / 3000
        )
      : 0.5;

  return (
    winPct * 0.65 +
    pointsComponent * 0.35
  );
}


/*
 * ==================================================
 * PROJECTED PICK RANGE
 * ==================================================
 */

function getProjectedRange(
  slot
) {
  if (slot <= 3) {
    return "Projected early 1st";
  }

  if (slot <= 6) {
    return "Projected early-mid 1st";
  }

  if (slot <= 10) {
    return "Projected mid 1st";
  }

  return "Projected late 1st";
}


/*
 * ==================================================
 * PICK VALUE
 * ==================================================
 */

function getPickValue({
  year,
  round,
  projectedSlot = 7,
}) {
  const baseValues = {
    1: 4200,
    2: 2300,
    3: 1200,
    4: 700,
    5: 450,
    6: 300,
    7: 200,
  };

  const base =
    baseValues[
      Number(round)
    ] || 100;

  const yearMultiplier =
    Number(year) === 2027
      ? 1.00
      : Number(year) === 2028
        ? 0.78
        : 0;

  let slotMultiplier = 1.00;

  if (
    Number(round) === 1
  ) {
    if (projectedSlot <= 3) {
      slotMultiplier = 1.25;
    } else if (projectedSlot <= 6) {
      slotMultiplier = 1.12;
    } else if (projectedSlot <= 10) {
      slotMultiplier = 1.00;
    } else {
      slotMultiplier = 0.88;
    }
  }

  return Math.round(
    base *
    yearMultiplier *
    slotMultiplier
  );
}


/*
 * ==================================================
 * TRADE VERDICT
 * ==================================================
 */

function getTradeVerdict({
  target,
  openingOffer,
  likelyOffer,
}) {
  if (!openingOffer) {
    return "NO CLEAN OFFER";
  }

  if (!likelyOffer) {
    return "DIFFICULT DEAL";
  }

  const openingRatio =
    openingOffer.totalValue /
    target.dynastyValue;

  const likelyRatio =
    likelyOffer.totalValue /
    target.dynastyValue;

  if (
    target.positionDepth >= 5 &&
    likelyRatio <= 1.05
  ) {
    return "PURSUE";
  }

  if (
    likelyRatio <= 1.05
  ) {
    return "WORTH EXPLORING";
  }

  if (
    openingRatio <= 0.85 &&
    likelyRatio <= 1.15
  ) {
    return "NEGOTIATE";
  }

  return "BE CAREFUL";
}


/*
 * ==================================================
 * RECOMMENDATION TEXT
 * ==================================================
 */

function getRecommendationText({
  target,
  openingOffer,
  likelyOffer,
}) {
  if (!openingOffer) {
    return (
      "No clean opening offer using HoRo's available assets."
    );
  }

  if (!likelyOffer) {
    return (
      "Target is attractive, but the acquisition cost is difficult to model."
    );
  }

  if (
    target.positionDepth >= 5
  ) {
    return `${target.teamName} has a major ${target.position} surplus. Start below market value and negotiate upward only if necessary.`;
  }

  if (
    target.positionDepth >= 4
  ) {
    return `${target.teamName} has meaningful ${target.position} depth. This is worth exploring, but expect resistance if the player is a starter.`;
  }

  return (
    "The player is attractive, but the owner's roster does not create an obvious trade-pressure situation."
  );
}


/*
 * ==================================================
 * PROTECT HORO CORE PLAYERS
 * ==================================================
 */

function isCoreHoroPlayer(
  player,
  horoPlayers,
  targetPosition
) {
  const samePosition =
    horoPlayers
      .filter(
        (item) =>
          item.position ===
          targetPosition
      )
      .sort(
        (a, b) =>
          Number(
            b.dynastyValue || 0
          ) -
          Number(
            a.dynastyValue || 0
          )
      );

  const topTwo =
    samePosition
      .slice(0, 2)
      .map(
        (item) =>
          item.id
      );

  return topTwo.includes(
    player.id
  );
}


/*
 * ==================================================
 * DETERMINE WHETHER HORO PLAYER IS TRADEABLE
 * ==================================================
 */

function isTradeableHoroPlayer(
  player,
  targetPosition,
  horoPlayers
) {
  /*
   * NEVER trade a HoRo QB
   * when acquiring a QB.
   */

  if (
    targetPosition === "QB" &&
    player.position === "QB"
  ) {
    return false;
  }

  if (
    isCoreHoroPlayer(
      player,
      horoPlayers,
      player.position
    )
  ) {
    return false;
  }

  /*
   * Very high-value players are protected.
   */

  if (
    Number(
      player.dynastyValue || 0
    ) >= 7000
  ) {
    return false;
  }

  return true;
}


/*
 * ==================================================
 * TARGET SCORING
 * ==================================================
 */

function getAvailabilityScore({
  positionDepth,
  depthRank,
  starter,
}) {
  let score = 0;

  if (positionDepth >= 5) {
    score += 40;
  } else if (positionDepth >= 4) {
    score += 30;
  } else if (positionDepth >= 3) {
    score += 15;
  }

  if (depthRank >= 4) {
    score += 30;
  } else if (depthRank === 3) {
    score += 20;
  } else if (depthRank === 2) {
    score += 8;
  }

  if (!starter) {
    score += 15;
  }

  return score;
}


function getUpgradeScore({
  value,
  horoBest,
  horoSecond,
}) {
  if (!value) {
    return -30;
  }

  if (
    value >
    horoBest * 1.25
  ) {
    return 30;
  }

  if (
    value > horoBest
  ) {
    return 25;
  }

  if (
    value >
    horoSecond * 1.15
  ) {
    return 18;
  }

  if (
    value > horoSecond
  ) {
    return 12;
  }

  if (
    value >=
    horoSecond * 0.80
  ) {
    return 5;
  }

  return -10;
}


function getQualityScore(
  value
) {
  if (value >= 8000)
    return 35;

  if (value >= 7000)
    return 32;

  if (value >= 6000)
    return 28;

  if (value >= 5000)
    return 24;

  if (value >= 4000)
    return 20;

  if (value >= 3000)
    return 15;

  if (value >= 2000)
    return 10;

  return 5;
}


function getAgeScore(
  age,
  position
) {
  if (!age) {
    return 0;
  }

  if (position === "QB") {
    if (age <= 25)
      return 10;

    if (age <= 28)
      return 7;

    if (age <= 31)
      return 3;

    if (age >= 36)
      return -10;

    return 0;
  }

  if (position === "RB") {
    if (age <= 23)
      return 10;

    if (age <= 25)
      return 6;

    if (age >= 30)
      return -10;

    return 0;
  }

  if (position === "WR") {
    if (age <= 24)
      return 10;

    if (age <= 27)
      return 7;

    if (age >= 33)
      return -8;

    return 0;
  }

  if (position === "TE") {
    if (age <= 25)
      return 8;

    if (age <= 28)
      return 5;

    if (age >= 34)
      return -8;

    return 0;
  }

  return 0;
}


function getRealismPenalty(
  value
) {
  if (value >= 10000)
    return 35;

  if (value >= 8000)
    return 25;

  if (value >= 7000)
    return 18;

  if (value >= 6000)
    return 10;

  return 0;
}


/*
 * ==================================================
 * TARGET TIER
 * ==================================================
 */

function determineTier({
  value,
  totalScore,
  positionDepth,
  depthRank,
  starter,
}) {
  if (
    value >= 3500 &&
    value <= 7000 &&
    totalScore >= 50 &&
    (
      positionDepth >= 4 ||
      depthRank >= 2
    )
  ) {
    return "BEST FIT";
  }

  if (
    value >= 5500 &&
    totalScore >= 35
  ) {
    return "AGGRESSIVE";
  }

  if (
    value < 3500 &&
    totalScore >= 30 &&
    (
      positionDepth >= 4 ||
      depthRank >= 3 ||
      !starter
    )
  ) {
    return "CHEAP DEPTH";
  }

  return "LONG SHOT";
}