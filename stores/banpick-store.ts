import { create } from "zustand";

export type TeamSide = "blue" | "red";
export type DraftType = "pick" | "ban";
export const NONE_BAN_TOKEN = "__NONE_BAN__";

export type DraftTurn = {
  team: TeamSide;
  type: DraftType;
  slotIndex: number;
};

type TeamSlots = {
  picks: Array<string | null>;
  bans: Array<string | null>;
};

type BanPickState = {
  selections: {
    blue: TeamSlots;
    red: TeamSlots;
  };
  blue: TeamSlots;
  red: TeamSlots;
  currentTurn: number;
  draftOrder: DraftTurn[];
  disabledChampions: string[];
  /** 그리드에서 클릭만 한 상태(확정 전) */
  pendingChampion: string | null;
  banStatus: Record<
    string,
    {
      isConfirmed: boolean;
      isNoBan: boolean;
      timeoutOccurred: boolean;
    }
  >;
  setPendingChampion: (championId: string) => void;
  confirmSelection: (options?: { isManual?: boolean }) => void;
  resolveTurn: (
    championId: string | null,
    options?: { isManual?: boolean },
  ) => void;
  undoLastTurn: () => void;
  swapTeamPicks: (team: TeamSide, fromIndex: number, toIndex: number) => void;
  resetDraft: () => void;
};

const createTeamSlots = (): TeamSlots => ({
  picks: Array.from({ length: 5 }, () => null),
  bans: Array.from({ length: 5 }, () => null),
});

const DRAFT_ORDER: DraftTurn[] = [
  { team: "blue", type: "ban", slotIndex: 0 },
  { team: "red", type: "ban", slotIndex: 0 },
  { team: "blue", type: "ban", slotIndex: 1 },
  { team: "red", type: "ban", slotIndex: 1 },
  { team: "blue", type: "ban", slotIndex: 2 },
  { team: "red", type: "ban", slotIndex: 2 },
  { team: "blue", type: "pick", slotIndex: 0 },
  { team: "red", type: "pick", slotIndex: 0 },
  { team: "red", type: "pick", slotIndex: 1 },
  { team: "blue", type: "pick", slotIndex: 1 },
  { team: "blue", type: "pick", slotIndex: 2 },
  { team: "red", type: "pick", slotIndex: 2 },
  { team: "red", type: "ban", slotIndex: 3 },
  { team: "blue", type: "ban", slotIndex: 3 },
  { team: "red", type: "ban", slotIndex: 4 },
  { team: "blue", type: "ban", slotIndex: 4 },
  { team: "red", type: "pick", slotIndex: 3 },
  { team: "blue", type: "pick", slotIndex: 3 },
  { team: "blue", type: "pick", slotIndex: 4 },
  { team: "red", type: "pick", slotIndex: 4 },
];

const putChampionInSlot = (
  teamSlots: TeamSlots,
  type: DraftType,
  slotIndex: number,
  championId: string,
): TeamSlots => {
  const key = type === "pick" ? "picks" : "bans";
  if (slotIndex < 0 || slotIndex >= teamSlots[key].length) {
    return teamSlots;
  }
  if (teamSlots[key][slotIndex] !== null) {
    return teamSlots;
  }

  const cloned = [...teamSlots[key]];
  cloned[slotIndex] = championId;

  return {
    ...teamSlots,
    [key]: cloned,
  };
};

const putNoneBanInSlot = (teamSlots: TeamSlots, slotIndex: number): TeamSlots => {
  if (slotIndex < 0 || slotIndex >= teamSlots.bans.length) {
    return teamSlots;
  }
  if (teamSlots.bans[slotIndex] !== null) {
    return teamSlots;
  }

  const cloned = [...teamSlots.bans];
  cloned[slotIndex] = NONE_BAN_TOKEN;
  return {
    ...teamSlots,
    bans: cloned,
  };
};

const clearSlot = (
  teamSlots: TeamSlots,
  type: DraftType,
  slotIndex: number,
): TeamSlots => {
  const key = type === "pick" ? "picks" : "bans";
  if (slotIndex < 0 || slotIndex >= teamSlots[key].length) return teamSlots;

  const cloned = [...teamSlots[key]];
  cloned[slotIndex] = null;
  return {
    ...teamSlots,
    [key]: cloned,
  };
};

export const useBanPickStore = create<BanPickState>((set, get) => ({
  selections: {
    blue: createTeamSlots(),
    red: createTeamSlots(),
  },
  blue: createTeamSlots(),
  red: createTeamSlots(),
  currentTurn: 0,
  draftOrder: DRAFT_ORDER,
  disabledChampions: [],
  pendingChampion: null,
  banStatus: {},
  setPendingChampion: (championId) => {
    const { currentTurn, draftOrder, disabledChampions } = get();
    if (currentTurn >= draftOrder.length) return;
    if (disabledChampions.includes(championId)) return;
    set({ pendingChampion: championId });
  },
  confirmSelection: (options) => {
    const { pendingChampion, resolveTurn } = get();
    if (!pendingChampion) return;
    resolveTurn(pendingChampion, options);
  },
  resolveTurn: (championId, options) => {
    const isManual = options?.isManual ?? true;
    const {
      blue,
      red,
      currentTurn,
      draftOrder,
      disabledChampions,
      banStatus,
    } = get();
    if (currentTurn >= draftOrder.length) return;

    const active = draftOrder[currentTurn];
    if (active.type === "pick" && !championId) return;

    const useNoneBan = active.type === "ban" && !championId;
    const nextBlue =
      active.team === "blue"
        ? useNoneBan
          ? putNoneBanInSlot(blue, active.slotIndex)
          : putChampionInSlot(blue, active.type, active.slotIndex, championId as string)
        : blue;
    const nextRed =
      active.team === "red"
        ? useNoneBan
          ? putNoneBanInSlot(red, active.slotIndex)
          : putChampionInSlot(red, active.type, active.slotIndex, championId as string)
        : red;

    const nextDisabled =
      championId && championId !== NONE_BAN_TOKEN
        ? [...disabledChampions, championId]
        : disabledChampions;
    const nextBanStatus = { ...banStatus };
    if (active.type === "ban") {
      nextBanStatus[`${active.team}-${active.slotIndex}`] = {
        isConfirmed: true,
        isNoBan: useNoneBan,
        timeoutOccurred: useNoneBan && !isManual,
      };
    }

    set({
      selections: {
        blue: nextBlue,
        red: nextRed,
      },
      blue: nextBlue,
      red: nextRed,
      currentTurn: currentTurn + 1,
      disabledChampions: nextDisabled,
      pendingChampion: null,
      banStatus: nextBanStatus,
    });
  },
  undoLastTurn: () => {
    const { blue, red, currentTurn, draftOrder, disabledChampions, banStatus } =
      get();
    if (currentTurn <= 0) return;

    const prevTurnIndex = currentTurn - 1;
    const prevTurn = draftOrder[prevTurnIndex];
    if (!prevTurn) return;

    const teamSlots = prevTurn.team === "blue" ? blue : red;
    const slotArray = prevTurn.type === "pick" ? teamSlots.picks : teamSlots.bans;
    const championId = slotArray[prevTurn.slotIndex];

    const nextBlue =
      prevTurn.team === "blue" ? clearSlot(blue, prevTurn.type, prevTurn.slotIndex) : blue;
    const nextRed =
      prevTurn.team === "red" ? clearSlot(red, prevTurn.type, prevTurn.slotIndex) : red;

    let nextDisabled = disabledChampions;
    if (championId && championId !== NONE_BAN_TOKEN) {
      const idx = disabledChampions.lastIndexOf(championId);
      if (idx !== -1) {
        nextDisabled = [
          ...disabledChampions.slice(0, idx),
          ...disabledChampions.slice(idx + 1),
        ];
      }
    }

    const nextBanStatus = { ...banStatus };
    if (prevTurn.type === "ban") {
      delete nextBanStatus[`${prevTurn.team}-${prevTurn.slotIndex}`];
    }

    set({
      selections: {
        blue: nextBlue,
        red: nextRed,
      },
      blue: nextBlue,
      red: nextRed,
      currentTurn: prevTurnIndex,
      disabledChampions: nextDisabled,
      pendingChampion: null,
      banStatus: nextBanStatus,
    });
  },
  swapTeamPicks: (team, fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    const { blue, red } = get();
    const source = team === "blue" ? blue : red;
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= source.picks.length ||
      toIndex >= source.picks.length
    ) {
      return;
    }
    if (!source.picks[fromIndex] || !source.picks[toIndex]) return;

    const swappedPicks = [...source.picks];
    [swappedPicks[fromIndex], swappedPicks[toIndex]] = [
      swappedPicks[toIndex],
      swappedPicks[fromIndex],
    ];
    const updatedTeam = {
      ...source,
      picks: swappedPicks,
    };
    set({
      selections: {
        blue: team === "blue" ? updatedTeam : blue,
        red: team === "red" ? updatedTeam : red,
      },
      blue: team === "blue" ? updatedTeam : blue,
      red: team === "red" ? updatedTeam : red,
    });
  },
  resetDraft: () => {
    const nextBlue = createTeamSlots();
    const nextRed = createTeamSlots();
    set({
      selections: {
        blue: nextBlue,
        red: nextRed,
      },
      blue: nextBlue,
      red: nextRed,
      currentTurn: 0,
      disabledChampions: [],
      pendingChampion: null,
      banStatus: {},
    });
  },
}));
