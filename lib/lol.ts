import { getChampionMainRoles, type LaneFilter } from "@/lib/champion-roles";
import { getSplashPosition } from "@/lib/champion-splash-positions";
import { getChosungString } from "@/lib/hangul";

export type ChampionCard = {
  id: string;
  nameKr: string;
  nameEn: string;
  tags: string[];
  /** ALL 제외: TOP, JUNGLE, MID, ADC, SUP */
  positions: LaneFilter[];
  /** 한글 이름 기준 초성 연속 문자열 (검색용) */
  chosungKr: string;
  image: string;
  loadingImage: string;
  splashImage: string;
  /** 와이드 스플래시 프레임용 CSS object-position (예: "50% 22%") */
  splashPosition: string;
};

const DATA_DRAGON_BASE = "https://ddragon.leagueoflegends.com";

type DataDragonChampion = {
  id: string;
  name: string;
  tags: string[];
  image: {
    full: string;
  };
};

type DataDragonChampionResponse = {
  data: Record<string, DataDragonChampion>;
};

export const fetchAllChampions = async (): Promise<ChampionCard[]> => {
  const versionsRes = await fetch(`${DATA_DRAGON_BASE}/api/versions.json`, {
    cache: "no-store",
  });
  const versions = (await versionsRes.json()) as string[];
  const latest = versions[0];

  const championsRes = await fetch(
    `${DATA_DRAGON_BASE}/cdn/${latest}/data/ko_KR/champion.json`,
    { cache: "no-store" },
  );
  const championJson =
    (await championsRes.json()) as DataDragonChampionResponse;

  const champions = Object.values(championJson.data).map((champion) => ({
    id: champion.id,
    nameKr: champion.name,
    nameEn: champion.id,
    tags: champion.tags,
    positions: getChampionMainRoles(champion.id),
    chosungKr: getChosungString(champion.name),
    image: `${DATA_DRAGON_BASE}/cdn/${latest}/img/champion/${champion.image.full}`,
    loadingImage: `${DATA_DRAGON_BASE}/cdn/img/champion/loading/${champion.id}_0.jpg`,
    splashImage: `${DATA_DRAGON_BASE}/cdn/img/champion/splash/${champion.id}_0.jpg`,
    splashPosition: getSplashPosition(champion.id),
  }));

  return champions.sort((a, b) =>
    a.nameKr.localeCompare(b.nameKr, "ko-KR", { sensitivity: "base" }),
  );
};
