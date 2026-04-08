import { create } from "zustand";

export type SeriesType = "BO3" | "BO5";
export type DraftMode = "HARD" | "SOFT" | "TOURNAMENT";
export type WinnerSide = "blue" | "red";

type SettingsState = {
  blueTeamName: string;
  redTeamName: string;
  seriesType: SeriesType;
  draftMode: DraftMode;
  isTimerEnabled: boolean;
  isSetupComplete: boolean;
  currentSet: number;
  score: {
    blue: number;
    red: number;
  };
  usedChampionsByBlue: string[];
  usedChampionsByRed: string[];
  allUsedChampions: string[];
  pendingWinner: WinnerSide | null;
  seriesWinner: WinnerSide | null;
  setBlueTeamName: (name: string) => void;
  setRedTeamName: (name: string) => void;
  setSeriesType: (type: SeriesType) => void;
  setDraftMode: (mode: DraftMode) => void;
  setIsTimerEnabled: (enabled: boolean) => void;
  selectSetWinner: (winner: WinnerSide) => void;
  advanceToNextSet: (payload: { bluePicks: string[]; redPicks: string[] }) => void;
  resetSeries: () => void;
  startDraft: () => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  blueTeamName: "",
  redTeamName: "",
  seriesType: "BO5",
  draftMode: "SOFT",
  isTimerEnabled: true,
  isSetupComplete: false,
  currentSet: 1,
  score: { blue: 0, red: 0 },
  usedChampionsByBlue: [],
  usedChampionsByRed: [],
  allUsedChampions: [],
  pendingWinner: null,
  seriesWinner: null,
  setBlueTeamName: (name) => set({ blueTeamName: name }),
  setRedTeamName: (name) => set({ redTeamName: name }),
  setSeriesType: (type) => set({ seriesType: type }),
  setDraftMode: (mode) => set({ draftMode: mode }),
  setIsTimerEnabled: (enabled) => set({ isTimerEnabled: enabled }),
  selectSetWinner: (winner) => set({ pendingWinner: winner }),
  advanceToNextSet: ({ bluePicks, redPicks }) =>
    set((state) => {
      if (!state.pendingWinner || state.seriesWinner) return state;

      const nextScore = {
        ...state.score,
        [state.pendingWinner]: state.score[state.pendingWinner] + 1,
      };
      const needWins = state.seriesType === "BO3" ? 2 : 3;
      const nextSeriesWinner =
        nextScore.blue >= needWins ? "blue" : nextScore.red >= needWins ? "red" : null;

      const nextBlueUsed = Array.from(new Set([...state.usedChampionsByBlue, ...bluePicks]));
      const nextRedUsed = Array.from(new Set([...state.usedChampionsByRed, ...redPicks]));
      const nextAllUsed = Array.from(new Set([...nextBlueUsed, ...nextRedUsed]));

      return {
        score: nextScore,
        usedChampionsByBlue: nextBlueUsed,
        usedChampionsByRed: nextRedUsed,
        allUsedChampions: nextAllUsed,
        currentSet: state.currentSet + 1,
        pendingWinner: null,
        seriesWinner: nextSeriesWinner,
      };
    }),
  resetSeries: () =>
    set({
      isSetupComplete: false,
      currentSet: 1,
      score: { blue: 0, red: 0 },
      usedChampionsByBlue: [],
      usedChampionsByRed: [],
      allUsedChampions: [],
      pendingWinner: null,
      seriesWinner: null,
    }),
  startDraft: () =>
    set({
      isSetupComplete: true,
      currentSet: 1,
      score: { blue: 0, red: 0 },
      usedChampionsByBlue: [],
      usedChampionsByRed: [],
      allUsedChampions: [],
      pendingWinner: null,
      seriesWinner: null,
    }),
}));
