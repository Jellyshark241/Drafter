/**
 * 포지션 필터(ALL 제외)와 Data Dragon `tags`를 정합성 있게 매핑합니다.
 * Riot 클라이언트의 역할 태그(Fighter, Tank, Mage, Assassin, Marksman, Support)만 제공되므로
 * 보조 라인 후보를 추론하고, 챔피언 ID 오버라이드로 정밀 보정합니다.
 */

export type LaneFilter = "TOP" | "JUNGLE" | "MID" | "ADC" | "SUP";

/** 명시적 보정: 추론보다 우선합니다. */
const POSITION_OVERRIDES: Partial<Record<string, LaneFilter[]>> = {
  // 탑 전사/탱커 (SUP 오분류 방지 + 라인 고정 예시)
  Darius: ["TOP"],
  Renekton: ["TOP"],
  Garen: ["TOP"],
  Nasus: ["TOP"],
  Illaoi: ["TOP"],
  Yorick: ["TOP"],
  Trundle: ["TOP", "JUNGLE"],
  // 대표 정글 전용에 가까운 챔피언
  MasterYi: ["JUNGLE"],
  Warwick: ["JUNGLE"],
  Zac: ["JUNGLE"],
  FiddleSticks: ["JUNGLE"],
  // 원딜 고정
  Draven: ["ADC"],
  Ashe: ["ADC"],
};

function inferPositionsFromTags(tags: string[]): LaneFilter[] {
  const s = new Set<LaneFilter>();

  if (tags.includes("Marksman")) {
    s.add("ADC");
  }

  if (tags.includes("Support")) {
    s.add("SUP");
  }

  if (tags.includes("Assassin")) {
    s.add("JUNGLE");
    s.add("MID");
  }

  if (tags.includes("Mage") && !tags.includes("Marksman")) {
    s.add("MID");
    if (tags.includes("Tank")) {
      s.add("TOP");
    }
  }

  if (tags.includes("Fighter")) {
    s.add("TOP");
    s.add("JUNGLE");
    s.add("MID");
  }

  if (tags.includes("Tank")) {
    s.add("TOP");
    s.add("JUNGLE");
    // 탱커 단독으로 SUP에 넣지 않음 — Support 태그가 있을 때만 서포터로 간주
    if (tags.includes("Support")) {
      s.add("SUP");
    }
  }

  if (s.size === 0) {
    return ["TOP", "JUNGLE", "MID", "ADC", "SUP"];
  }

  return Array.from(s);
}

export function getChampionPositions(
  championId: string,
  tags: string[],
): LaneFilter[] {
  const id = championId;
  const override = POSITION_OVERRIDES[id];
  if (override && override.length > 0) {
    return [...override];
  }
  return inferPositionsFromTags(tags);
}
