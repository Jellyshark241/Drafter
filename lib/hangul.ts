/**
 * 한글 초성 검색 · 정규화 유틸 (Data Dragon 한국어 이름 기준)
 */

/** 한글 음절 → 초성 (19자, 유니코드 분해 순서와 동일) */
const CHOSUNG_JAMO = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
] as const;

const CHOSUNG_INPUT_SET = new Set<string>(CHOSUNG_JAMO);

/** 검색어·이름 공통: 공백 제거 + 영문 소문자 */
export function normalizeForSearch(text: string): string {
  return text.replace(/\s+/g, "").toLowerCase();
}

/** 음절마다 초성만 이어붙임 (예: 가렌 → ㄱㄹ, 리 신 → ㄹㅅ) */
export function getChosungString(text: string): string {
  const compact = text.replace(/\s+/g, "");
  let out = "";
  for (const ch of compact) {
    const code = ch.codePointAt(0);
    if (code === undefined) continue;
    if (code >= 0xac00 && code <= 0xd7a3) {
      const idx = Math.floor((code - 0xac00) / 588);
      if (idx >= 0 && idx < CHOSUNG_JAMO.length) {
        out += CHOSUNG_JAMO[idx];
      }
    }
  }
  return out;
}

/** 입력이 ㄱ~ㅎ 계열만으로 이루어졌는지 (초성 전용 검색으로 간주) */
export function isChosungOnlyQuery(text: string): boolean {
  const compact = normalizeForSearch(text);
  if (compact.length === 0) return false;
  for (const ch of compact) {
    if (!CHOSUNG_INPUT_SET.has(ch)) return false;
  }
  return true;
}

/** id → 별칭 (한글/영문 혼용 검색 보강) */
const CHAMPION_SEARCH_ALIASES: Record<string, string[]> = {
  LeeSin: ["리신", "리 신"],
  MonkeyKing: ["손오공", "원숭이", "wukong"],
  AurelionSol: ["아우솔", "별드래곤"],
  JarvanIV: ["자르반", "자4"],
  XinZhao: ["신짜오", "짜오"],
  TwistedFate: ["트페", "tf"],
  MissFortune: ["미포", "mf"],
  Nunu: ["누누"],
};

function matchesAlias(id: string, normalizedQuery: string): boolean {
  const list = CHAMPION_SEARCH_ALIASES[id];
  if (!list?.length) return false;
  return list.some((alias) => normalizeForSearch(alias).includes(normalizedQuery));
}

export type ChampionSearchFields = {
  id: string;
  nameKr: string;
  nameEn: string;
  /** 미리 계산된 초성 문자열 (선택, 없으면 nameKr에서 계산) */
  chosungKr?: string;
};

/**
 * 다중 매칭: (1) 전체 부분일치 (2) 초성 일치 (3) 별칭
 * 우선순위는 OR이며, 필터와는 별도로 검색만 담당합니다.
 */
export function matchesChampionSearch(
  champion: ChampionSearchFields,
  queryRaw: string,
): boolean {
  const q = normalizeForSearch(queryRaw);
  if (q.length === 0) return true;

  const kr = normalizeForSearch(champion.nameKr);
  const en = normalizeForSearch(champion.nameEn);

  if (kr.includes(q) || en.includes(q)) return true;

  if (isChosungOnlyQuery(q)) {
    const chs = champion.chosungKr ?? getChosungString(champion.nameKr);
    if (chs.length === 0) return false;
    return chs.includes(q);
  }

  if (matchesAlias(champion.id, q)) return true;

  return false;
}
