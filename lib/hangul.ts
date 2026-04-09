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
const DOUBLE_CONSONANTS: Record<string, string> = {
  ㄳ: "ㄱㅅ",
  ㄵ: "ㄴㅈ",
  ㄶ: "ㄴㅎ",
  ㄺ: "ㄹㄱ",
  ㄻ: "ㄹㅁ",
  ㄼ: "ㄹㅂ",
  ㄽ: "ㄹㅅ",
  ㄾ: "ㄹㅌ",
  ㄿ: "ㄹㅍ",
  ㅀ: "ㄹㅎ",
  ㅄ: "ㅂㅅ",
};

/** 검색어·이름 공통: 공백 제거 + 영문 소문자 */
export function normalizeForSearch(text: string): string {
  return text.replace(/\s+/g, "").toLowerCase();
}

/**
 * 겹자음(받침 클러스터 입력)을 낱자 초성 문자열로 펼칩니다.
 * 예) "ㄽ" -> "ㄹㅅ", "ㄶ" -> "ㄴㅎ"
 */
export function flattenDoubleConsonants(text: string): string {
  const compact = normalizeForSearch(text);
  let out = "";
  for (const ch of compact) {
    out += DOUBLE_CONSONANTS[ch] ?? ch;
  }
  return out;
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
  const flattened = flattenDoubleConsonants(text);
  if (flattened.length === 0) return false;
  for (const ch of flattened) {
    if (!CHOSUNG_INPUT_SET.has(ch)) return false;
  }
  return true;
}

/** id → 별칭 (한글/영문 혼용 검색 보강) */
export const CHAMPION_ALIASES: Record<string, string[]> = {
  LeeSin: ["리신", "리 신"],
  MonkeyKing: ["손오공", "원숭이", "오공", "wukong"],
  AurelionSol: ["아우솔", "아우렐리온솔", "별드래곤"],
  JarvanIV: ["자르반", "자4", "자르반4세"],
  XinZhao: ["신짜오", "짜오"],
  TwistedFate: ["트페", "tf"],
  MissFortune: ["미포", "mf"],
  Nunu: ["누누", "누누와윌럼프", "누누와 윌럼프"],
  Tristana: ["트타"],
  Blitzcrank: ["블츠", "블크", "블리츠"],
  Renata: ["레나타", "레나타글라스크", "레나타 글라스크"],
  Kaisa: ["카이사", "카사"],
  Khazix: ["카직스", "카직", "카직쓰"],
  Fiddlesticks: ["피들", "피들스틱"],
  TahmKench: ["탐켄치", "탐켄", "탐"],
  KogMaw: ["코그모", "코그"],
  Velkoz: ["벨코즈", "벨코", "벨"],
  Chogath: ["초가스", "초가", "초"],
  Heimerdinger: ["하이머딩거", "하이머", "딩거", "하딩"],
  Mordekaiser: ["모데카이저", "모데"],
  Malzahar: ["말자하", "말자"],
  Hecarim: ["헤카림", "헤카"],
  Graves: ["그레이브즈", "그브"],
  Volibear: ["볼리베어", "볼베"],
  Caitlyn: ["케이틀린", "케틀"],
  MasterYi: ["마스터이", "마이"],
  Cassiopeia: ["카시오페아", "카시"],
  Leblanc: ["르블랑", "르블"],
  Renekton: ["레넥톤", "렉톤"],
  Trundle: ["트런들", "트런"],
};

export type ChampionSearchFields = {
  id: string;
  nameKr: string;
  nameEn: string;
  /** 미리 계산된 초성 문자열 (선택, 없으면 nameKr에서 계산) */
  chosungKr?: string;
  /** 챔피언 별칭 배열 (선택) */
  alias?: string[];
};

function matchesAlias(champion: ChampionSearchFields, processedQuery: string): boolean {
  const mergedAliases = [...(champion.alias ?? []), ...(CHAMPION_ALIASES[champion.id] ?? [])];
  if (!mergedAliases.length) return false;
  return mergedAliases.some((a) =>
    flattenDoubleConsonants(normalizeForSearch(a)).includes(processedQuery),
  );
}

export function createChampionSearchPredicate(queryRaw: string) {
  // 1) Space-insensitive normalize first
  const q = normalizeForSearch(queryRaw);
  if (q.length === 0) {
    return () => true;
  }

  // 2) Decompose complex consonants for stable chosung matching
  const flattenedQ = flattenDoubleConsonants(q);
  const isChosungQuery = isChosungOnlyQuery(flattenedQ);
  const allowAliasMatch = flattenedQ.length >= 2;

  return (champion: ChampionSearchFields): boolean => {
    // 3) If query is consonant-only, compare against chosung string first.
    if (isChosungQuery) {
      const chs = champion.chosungKr ?? getChosungString(champion.nameKr);
      if (chs.length > 0 && chs.includes(flattenedQ)) return true;
      return allowAliasMatch && matchesAlias(champion, flattenedQ);
    }

    // 4) Otherwise perform full-text contains match (space-insensitive)
    const kr = normalizeForSearch(champion.nameKr);
    const en = normalizeForSearch(champion.nameEn);
    if (kr.includes(q) || en.includes(q)) return true;

    return allowAliasMatch && matchesAlias(champion, flattenedQ);
  };
}

/**
 * 다중 매칭: (1) 전체 부분일치 (2) 초성 일치 (3) 별칭
 * 우선순위는 OR이며, 필터와는 별도로 검색만 담당합니다.
 */
export function matchesChampionSearch(
  champion: ChampionSearchFields,
  queryRaw: string,
): boolean {
  return createChampionSearchPredicate(queryRaw)(champion);
}