"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, CircleSlash2, Mail, Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DraftActionButton } from "@/components/draft-action-button";
import { WinnerSelectionPanel } from "@/components/winner-selection-panel";
import { LaneIcon, type LaneIconVariant } from "@/components/lane-icon";
import { SetScoreBadge } from "@/components/set-score-badge";
import { DEFAULT_SPLASH_POSITION } from "@/lib/champion-splash-positions";
import { fetchAllChampions, type ChampionCard } from "@/lib/lol";
import { matchesChampionSearch } from "@/lib/hangul";
import { NONE_BAN_TOKEN, useBanPickStore } from "@/stores/banpick-store";
import { useSettingsStore } from "@/stores/settings-store";

const ROLES = ["ALL", "TOP", "JUNGLE", "MID", "ADC", "SUP"] as const;
const PICK_ROLES = ["TOP", "JUNGLE", "MID", "ADC", "SUP"] as const;
type PickRole = (typeof PICK_ROLES)[number];

const roleShortLabel: Record<PickRole, "TOP" | "JGL" | "MID" | "BOT" | "SPT"> = {
  TOP: "TOP",
  JUNGLE: "JGL",
  MID: "MID",
  ADC: "BOT",
  SUP: "SPT",
};

const pickRoleToLane: Record<PickRole, LaneIconVariant> = {
  TOP: "TOP",
  JUNGLE: "JGL",
  MID: "MID",
  ADC: "BOT",
  SUP: "SPT",
};

/** 필터 UI 표시용 (내부 값은 ROLES 그대로 유지) */
const roleFilterDisplayLabel: Record<(typeof ROLES)[number], string> = {
  ALL: "ALL",
  TOP: "TOP",
  JUNGLE: "JGL",
  MID: "MID",
  ADC: "ADC",
  SUP: "SUP",
};
const TURN_SECONDS = 30;

const draftModeDescription: Record<"SOFT" | "HARD" | "TOURNAMENT", string> = {
  SOFT: `이전 세트에서 우리 팀이 사용한 챔피언은 다시 선택할 수 없습니다.
상대 팀이 사용한 챔피언은 밴 방지를 위해 자동으로 비활성화되어,
불필요한 실수를 방지하고 전략적인 드래프트를 돕습니다.`,
  HARD: `양 팀이 이전 세트에서 사용한 모든 챔피언이 선택 목록에서 제외됩니다.
한 번 등장한 챔피언은 이후 세트에서 완전히 봉인되므로,
더욱 깊고 넓은 챔피언 폭을 활용한 극한의 전략이 요구됩니다.`,
  TOURNAMENT: `표준적인 밴픽 방식으로 진행되는 가장 대중적인 모드입니다.
이전 세트 기록에 구애받지 않고,
매 경기 자유로운 조합 구상과 전술 실험이 가능합니다.`,
};

const getTurnText = (
  current: { team: "blue" | "red"; type: "pick" | "ban"; slotIndex: number } | undefined,
) => {
  if (!current) return "밴픽이 완료되었습니다";
  const team = current.team === "blue" ? "블루팀" : "레드팀";
  const orderNo = current.slotIndex + 1;
  return current.type === "ban"
    ? `${team} ${orderNo}밴 차례입니다`
    : `${team} ${orderNo}픽 차례입니다`;
};

const draftModeMetaLabel: Record<"SOFT" | "HARD" | "TOURNAMENT", string> = {
  SOFT: "SOFT FEARLESS",
  HARD: "HARD FEARLESS",
  TOURNAMENT: "TOURNAMENT",
};

function MoebiusInfiniteLoop({ label = "[ NO TIME LIMIT ]" }: { label?: string }) {
  const infinityPathRef = useRef<SVGPathElement | null>(null);
  const [pathTotalLength, setPathTotalLength] = useState(0);
  const infinityPathD =
    "M8 22C8 12.0589 16.0589 4 26 4C35.9411 4 46 22 46 22C46 22 56.0589 40 66 40C75.9411 40 84 31.9411 84 22C84 12.0589 75.9411 4 66 4C56.0589 4 46 22 46 22C46 22 35.9411 40 26 40C16.0589 40 8 31.9411 8 22Z";

  useEffect(() => {
    if (!infinityPathRef.current) return;
    const totalLength = infinityPathRef.current.getTotalLength();
    if (Number.isFinite(totalLength) && totalLength > 0) {
      setPathTotalLength(totalLength);
    }
  }, []);

  const glowSweepLength = Math.max(pathTotalLength * 0.24, 26);
  const glowGapLength = Math.max(pathTotalLength - glowSweepLength, 1);

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center overflow-visible"
      style={{ overflow: "visible" }}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      <svg
        width="112"
        height="54"
        viewBox="-24 -18 140 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible [filter:blur(0.08px)]"
        style={{ overflow: "visible" }}
        aria-hidden
      >
        <path
          ref={infinityPathRef}
          d={infinityPathD}
          stroke="transparent"
          strokeWidth="1"
          fill="none"
        />
        <path
          d={infinityPathD}
          stroke="#FFFFFF"
          strokeOpacity="0.26"
          strokeWidth="4.6"
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.24))" }}
        />
        {pathTotalLength > 0 ? (
          <path
            key={pathTotalLength}
            d={infinityPathD}
            stroke="url(#infinite-comet-white)"
            strokeWidth="5.2"
            strokeLinecap="round"
            strokeDasharray={`${glowSweepLength} ${glowGapLength}`}
            strokeDashoffset={pathTotalLength}
            style={{
              filter:
                "drop-shadow(0 0 6px #FFFFFF) drop-shadow(0 0 16px rgba(100,200,255,0.85)) drop-shadow(0 0 32px rgba(255,100,100,0.62))",
            }}
          >
            <animate
              attributeName="stroke-dashoffset"
              from={String(pathTotalLength)}
              to="0"
              dur="6.7s"
              repeatCount="indefinite"
            />
          </path>
        ) : null}
        <defs>
          <linearGradient id="infinite-comet-white" x1="8" y1="4" x2="84" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.45)" />
            <stop offset="76%" stopColor="rgba(255,255,255,1)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
          </linearGradient>
        </defs>
      </svg>
      <span className="mt-1 font-mono text-[9px] font-extralight uppercase tracking-[0.7em] text-white [text-shadow:0_0_8px_rgba(255,255,255,0.35)] whitespace-nowrap">
        {label}
      </span>
    </motion.div>
  );
}

function SetupScreen() {
  const {
    blueTeamName,
    redTeamName,
    seriesType,
    draftMode,
    isTimerEnabled,
    setBlueTeamName,
    setRedTeamName,
    setSeriesType,
    setDraftMode,
    setIsTimerEnabled,
    startDraft,
  } = useSettingsStore();
  const tabItems: Array<{ key: "HARD" | "SOFT" | "TOURNAMENT"; label: string }> = [
    { key: "HARD", label: "하드 피어리스" },
    { key: "SOFT", label: "소프트 피어리스" },
    { key: "TOURNAMENT", label: "토너먼트 드래프트" },
  ];
  const transitionFast = { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const };
  const renderSeriesLabel = (type: "BO3" | "BO5") => (
    <span className="inline-flex items-baseline justify-center tracking-tighter">
      <span className="text-[17px] font-light leading-none">BO</span>
      <span className="-ml-[0.35px] text-[18px] font-light leading-none">
        {type.slice(2)}
      </span>
    </span>
  );

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-y-6 rounded-2xl border border-white/10 bg-slate-900/40 px-8 py-10 shadow-[0_0_28px_rgba(15,23,42,0.35)] backdrop-blur-2xl">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center"
      >
        <h1 className="text-center text-3xl font-light tracking-[0.4em] uppercase text-white">
          LOL MOCK BANPICK SIMULATOR
        </h1>
      </motion.div>

      <div className="mt-2 flex justify-center gap-6 text-base font-normal tracking-wide">
        {tabItems.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setDraftMode(tab.key)}
            className={cn(
              "relative px-1 pb-2 transition",
              draftMode === tab.key ? "text-cyan-200" : "text-[#f6f8ff]",
            )}
          >
            {tab.label}
            {draftMode === tab.key ? (
              <motion.span
                layoutId="draft-mode-glow"
                className="absolute -bottom-[2px] left-0 h-[3px] w-full rounded-full bg-cyan-300/90 shadow-[0_0_10px_rgba(34,211,238,0.9),0_0_22px_rgba(59,130,246,0.6)]"
                transition={transitionFast}
              />
            ) : null}
          </button>
        ))}
      </div>

      <div className="relative mt-6 mb-8 min-h-[78px] w-full">
        <AnimatePresence mode="wait">
          <motion.p
            key={draftMode}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 mx-auto flex max-w-[500px] flex-col items-center justify-center whitespace-pre-line text-center text-sm font-light leading-relaxed tracking-wide text-white/70"
          >
            <span className="mb-3 h-px w-8 bg-white/20" aria-hidden />
            {draftModeDescription[draftMode]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="grid w-full grid-cols-2 gap-4">
        <div className="flex flex-col items-center">
          <label className="mb-1.5 block text-center text-[12px] font-light tracking-[0.08em] text-slate-200">
            블루팀
          </label>
          <input
            value={blueTeamName}
            onChange={(e) => setBlueTeamName(e.target.value)}
            placeholder="BLUE TEAM NAME"
            className="h-9 w-full rounded-lg border border-cyan-300/35 border-l border-l-cyan-300/70 bg-gradient-to-r from-cyan-500/18 via-cyan-950/15 to-slate-950/60 px-4 text-center text-[13px] font-medium tracking-[0.08em] text-slate-100 outline-none backdrop-blur-md transition-all duration-500 placeholder:text-center placeholder:text-slate-300/85 focus:border-cyan-200/60 focus:border-l-cyan-200 focus:ring-0 focus:shadow-[0_0_18px_rgba(34,211,238,0.45)]"
          />
        </div>
        <div className="flex flex-col items-center">
          <label className="mb-1.5 block text-center text-[12px] font-light tracking-[0.08em] text-slate-200">
            레드팀
          </label>
          <input
            value={redTeamName}
            onChange={(e) => setRedTeamName(e.target.value)}
            placeholder="RED TEAM NAME"
            className="h-9 w-full rounded-lg border border-rose-300/35 border-l border-l-rose-300/70 bg-gradient-to-r from-rose-500/18 via-rose-950/15 to-slate-950/60 px-4 text-center text-[13px] font-medium tracking-[0.08em] text-slate-100 outline-none backdrop-blur-md transition-all duration-500 placeholder:text-center placeholder:text-slate-300/85 focus:border-rose-200/60 focus:border-l-rose-200 focus:ring-0 focus:shadow-[0_0_18px_rgba(244,63,94,0.45)]"
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <div className="relative h-10 w-[180px] overflow-visible">
          <div className="absolute inset-0 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md" />

          {/* Glow layer (outside clipping) */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={`glow-${seriesType}`}
              initial={{ x: seriesType === "BO5" ? "0%" : "100%" }}
              animate={{ x: seriesType === "BO5" ? "100%" : "0%" }}
              exit={{ x: seriesType === "BO5" ? "100%" : "0%" }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="pointer-events-none absolute inset-y-0 left-0 z-0 w-1/2 rounded-xl bg-cyan-500/20 shadow-[0_0_15px_2px_rgba(34,211,238,0.40),0_0_28px_6px_rgba(59,130,246,0.18)] will-change-transform"
            />
          </AnimatePresence>

          {/* Track layer (clips fill but not glow) */}
          <div className="relative flex h-full overflow-hidden rounded-xl">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={`fill-${seriesType}`}
                initial={{ x: seriesType === "BO5" ? "0%" : "100%" }}
                animate={{ x: seriesType === "BO5" ? "100%" : "0%" }}
                exit={{ x: seriesType === "BO5" ? "100%" : "0%" }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="pointer-events-none absolute inset-y-0 left-0 z-0 w-1/2 rounded-xl bg-cyan-500/20 will-change-transform"
              />
            </AnimatePresence>

            {(["BO3", "BO5"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSeriesType(type)}
                className={cn(
                  "relative z-10 flex h-full flex-1 items-center justify-center rounded-xl text-sm font-medium tracking-wide transition",
                  seriesType === type ? "text-white" : "text-slate-300/70",
                )}
              >
                {renderSeriesLabel(type)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-gradient-to-r from-slate-900/35 via-slate-900/25 to-slate-900/35 px-3 backdrop-blur-md">
          <button
            type="button"
            role="switch"
            aria-checked={isTimerEnabled}
            onClick={() => setIsTimerEnabled(!isTimerEnabled)}
            className={cn(
              "relative h-6 w-11 rounded-full border border-white/10 transition-all duration-300",
              isTimerEnabled
                ? "bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-600 shadow-[0_0_15px_5px_rgba(34,211,238,0.45)]"
                : "bg-slate-900/70",
            )}
          >
            <span
              className={cn(
                "absolute top-[2px] h-5 w-5 rounded-full bg-white/90 transition-all duration-300",
                isTimerEnabled ? "left-[21px]" : "left-[2px]",
              )}
            />
          </button>
          <span className="text-xs font-light tracking-wide text-slate-400">
            시간 제한 사용
          </span>
        </div>
        <button
          type="button"
          onClick={startDraft}
          className="group relative h-10 overflow-visible rounded-xl border border-white/10 bg-slate-900/45 bg-clip-border px-6 text-sm font-light tracking-[0.2em] text-slate-300 backdrop-blur-lg transition-[background-color,border-color,color,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-cyan-500"
        >
          <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-600 opacity-0 transition-[opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:opacity-100" />
          <span className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 shadow-[0_0_16px_0_rgba(34,211,238,0.58)] transition-[opacity,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:opacity-100 group-hover:shadow-[0_0_20px_0_rgba(34,211,238,0.62)]" />
          <span className="relative z-10 transition-[color] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-white">
            시작하기
          </span>
        </button>
      </div>
    </section>
  );
}

function TeamColumn({
  side,
  picks,
  bans,
  activeTurn,
  pendingChampion,
  championsById,
  banStatus,
  isSwapPhase,
  selectedSwapSlot,
  onSwapSelect,
}: {
  side: "blue" | "red";
  picks: Array<string | null>;
  bans: Array<string | null>;
  activeTurn?: { team: "blue" | "red"; type: "pick" | "ban"; slotIndex: number };
  pendingChampion: string | null;
  championsById: Record<string, ChampionCard>;
  banStatus: Record<
    string,
    {
      isConfirmed: boolean;
      isNoBan: boolean;
      timeoutOccurred: boolean;
    }
  >;
  isSwapPhase: boolean;
  selectedSwapSlot: { team: "blue" | "red"; index: number } | null;
  onSwapSelect: (team: "blue" | "red", index: number) => void;
}) {
  const [hoverSwapIndex, setHoverSwapIndex] = useState<number | null>(null);

  return (
    <section className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex shrink-0 gap-2 pl-10">
        {bans.map((champ, idx) => {
          const isActive =
            activeTurn?.team === side &&
            activeTurn.type === "ban" &&
            idx === activeTurn.slotIndex;
          const previewChampionId =
            isActive && !champ && pendingChampion ? pendingChampion : null;
          const imageChampionId = champ ?? previewChampionId;
          const isNoneBan = imageChampionId === NONE_BAN_TOKEN;
          const isPendingPreview = Boolean(previewChampionId);
          const slotBanStatus = banStatus[`${side}-${idx}`];
          const showNoBanFeedback = Boolean(
            slotBanStatus?.isConfirmed &&
              (slotBanStatus.isNoBan || slotBanStatus.timeoutOccurred),
          );
          const showChampionBanFeedback = Boolean(
            slotBanStatus?.isConfirmed && !slotBanStatus.isNoBan,
          );
          const showConfirmedBanFeedback = showNoBanFeedback || showChampionBanFeedback;
          return (
            <motion.div
              key={`${side}-ban-${idx}`}
              className={cn(
                "relative h-12 w-12 overflow-hidden rounded-lg border border-white/10 bg-gradient-to-b from-slate-900/55 to-black/80",
                isActive &&
                  "border-[#b84963] shadow-[0_0_0_1px_rgba(184,73,99,0.65),0_0_16px_rgba(184,73,99,0.45)]",
                isPendingPreview && "animate-[pulse_1.2s_ease-in-out_infinite]",
                showConfirmedBanFeedback &&
                  "border-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]",
              )}
              animate={
                showConfirmedBanFeedback
                  ? { backgroundColor: "rgba(69, 10, 10, 0.4)" }
                  : { backgroundColor: "rgba(2, 6, 23, 0)" }
              }
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              {imageChampionId && !isNoneBan ? (
                <>
                  <Image
                    src={championsById[imageChampionId]?.image ?? ""}
                    alt={imageChampionId}
                    fill
                    draggable={false}
                    sizes="48px"
                    className={cn(
                      "object-cover grayscale",
                      showChampionBanFeedback && "brightness-[0.7]",
                      !isPendingPreview && "animate-[ban-lock-in_240ms_ease-out]",
                      isPendingPreview && "opacity-60",
                    )}
                  />
                  <div
                    className={cn(
                      "absolute inset-0 bg-[#7c1023]/65",
                      isPendingPreview && "opacity-50",
                    )}
                  />
                  <AnimatePresence mode="wait">
                    {showChampionBanFeedback ? (
                      <motion.svg
                        key={`${side}-ban-${idx}-champion-x`}
                        className="absolute inset-0 z-20 h-full w-full p-[3px] text-red-500/80 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] [filter:drop-shadow(0_0_28px_rgba(239,68,68,0.35))]"
                        viewBox="0 0 100 100"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: [1.1, 1], opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        aria-hidden
                      >
                        <line
                          x1="10"
                          y1="10"
                          x2="90"
                          y2="90"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                        />
                        <line
                          x1="90"
                          y1="10"
                          x2="10"
                          y2="90"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                        />
                      </motion.svg>
                    ) : null}
                  </AnimatePresence>
                </>
              ) : (
                <div className="relative h-full w-full">
                  <AnimatePresence mode="wait">
                    {showNoBanFeedback ? (
                      <motion.div
                        key={`${side}-ban-${idx}-noban-x`}
                        className="absolute inset-0 z-20"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: [1.1, 1], opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-t from-red-950/20 via-transparent to-transparent"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                        <svg
                          className="absolute inset-0 z-20 h-full w-full p-[3px] text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] [filter:drop-shadow(0_0_28px_rgba(239,68,68,0.35))]"
                          viewBox="0 0 100 100"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden
                        >
                          <line
                            x1="10"
                            y1="10"
                            x2="90"
                            y2="90"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                          />
                          <line
                            x1="90"
                            y1="10"
                            x2="10"
                            y2="90"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`${side}-ban-${idx}-empty`}
                        className="relative flex h-full items-center justify-center text-[#7f8da6]"
                        initial={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.2, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                      >
                        <CircleSlash2 size={16} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              <AnimatePresence>
                {showConfirmedBanFeedback ? (
                  <motion.div
                    key={`${side}-ban-${idx}-confirmed-tint`}
                    className={cn(
                      "pointer-events-none absolute inset-0 z-10 bg-red-950/40",
                      showNoBanFeedback &&
                        "bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-red-900/20 to-transparent",
                    )}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                ) : null}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-0.5 flex min-h-0 flex-1 flex-col gap-2">
        {picks.map((champ, idx) => {
          const isActive =
            activeTurn?.team === side &&
            activeTurn.type === "pick" &&
            idx === activeTurn.slotIndex;
          const previewChampionId =
            isActive && !champ && pendingChampion ? pendingChampion : null;
          const imageChampionId = champ ?? previewChampionId;
          const isPendingPreview = Boolean(previewChampionId);
          const borderColor = side === "blue" ? "#2d73ff" : "#e6456a";
          const isSwapSource =
            isSwapPhase &&
            selectedSwapSlot?.team === side &&
            selectedSwapSlot.index === idx;
          const isSwapTargetHover =
            isSwapPhase &&
            selectedSwapSlot?.team === side &&
            selectedSwapSlot.index !== idx &&
            hoverSwapIndex === idx &&
            Boolean(imageChampionId);

          return (
            <motion.div
              layout
              key={`${side}-pick-${idx}`}
              className="group flex min-h-[52px] flex-1 items-stretch gap-2"
              onMouseEnter={() => {
                if (!isSwapPhase) return;
                if (selectedSwapSlot?.team !== side) return;
                if (selectedSwapSlot.index === idx) return;
                setHoverSwapIndex(idx);
              }}
              onMouseLeave={() => {
                setHoverSwapIndex((prev) => (prev === idx ? null : prev));
              }}
            >
              <span
                className={cn(
                  "flex w-10 shrink-0 flex-col items-center justify-center gap-1 self-stretch",
                  !isActive &&
                    "hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.22)]",
                  isActive &&
                    (side === "blue"
                      ? "drop-shadow-[0_0_8px_rgba(79,167,255,0.85)]"
                      : "drop-shadow-[0_0_8px_rgba(255,111,145,0.85)]"),
                )}
              >
                <LaneIcon
                  variant={pickRoleToLane[PICK_ROLES[idx]]}
                  className={cn(
                    isActive ? "text-white" : "text-white/90",
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-extrabold leading-none tracking-tight",
                    !isActive && "text-white/80",
                    isActive && "text-white",
                  )}
                >
                  {roleShortLabel[PICK_ROLES[idx]]}
                </span>
              </span>
              <motion.div
                layout
                className={cn(
                  "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border-t border-l border-r border-b border-t-white/20 border-l-white/15 border-r-white/5 border-b-white/10 bg-gradient-to-b from-slate-900/55 to-black/80 p-0 transition-all duration-500",
                  isSwapPhase && imageChampionId && "cursor-pointer",
                  side === "blue" && "shadow-[0_0_14px_rgba(34,211,238,0.12)]",
                  side === "red" && "shadow-[0_0_14px_rgba(244,63,94,0.12)]",
                  !isActive &&
                    side === "blue" &&
                    "group-hover:border-cyan-500/80 group-hover:shadow-[0_0_10px_rgba(6,182,212,0.4)]",
                  !isActive &&
                    side === "red" &&
                    "group-hover:border-rose-500/80 group-hover:shadow-[0_0_10px_rgba(244,63,106,0.4)]",
                  isSwapTargetHover &&
                    "border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.18)]",
                  isSwapSource &&
                    side === "blue" &&
                    "border-2 border-white shadow-[0_0_24px_rgba(34,211,238,0.78)]",
                  isSwapSource &&
                    side === "red" &&
                    "border-2 border-white shadow-[0_0_24px_rgba(244,63,94,0.78)]",
                  isActive && "border-transparent",
                )}
                style={
                  isActive
                    ? {
                        boxShadow: `0 0 0 1px ${borderColor} inset, 0 0 16px ${borderColor}`,
                      }
                    : undefined
                }
                animate={isSwapSource ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
                onClick={() => {
                  if (!isSwapPhase || !imageChampionId) return;
                  onSwapSelect(side, idx);
                }}
                transition={{
                  layout: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: {
                    duration: 1.05,
                    repeat: isSwapSource ? Infinity : 0,
                    ease: "easeInOut",
                  },
                }}
              >
                {imageChampionId ? (
                  <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden rounded-md">
                    <div className="relative min-h-0 flex-1 overflow-hidden bg-slate-950">
                      <Image
                        src={
                          championsById[imageChampionId]?.splashImage ??
                          championsById[imageChampionId]?.loadingImage ??
                          championsById[imageChampionId]?.image ??
                          ""
                        }
                        alt={imageChampionId}
                        fill
                        draggable={false}
                        sizes="(min-width: 1024px) 320px, 45vw"
                        className={cn(
                          "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
                          isPendingPreview && "animate-[pulse_1.2s_ease-in-out_infinite] opacity-60",
                        )}
                        style={{
                          objectPosition:
                            championsById[imageChampionId]?.splashPosition ??
                            DEFAULT_SPLASH_POSITION,
                        }}
                      />
                      <div
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_35%,_rgb(2_6_23)_100%)]"
                        aria-hidden
                      />
                    </div>
                    <p
                      className={cn(
                        "relative shrink-0 w-full truncate whitespace-nowrap border-t border-white/5 bg-slate-900/80 px-1 py-1 text-center text-[10px] font-light uppercase tracking-[0.15em] text-slate-300 backdrop-blur-md rounded-b-md transition-all duration-300",
                        !isActive &&
                          side === "blue" &&
                          "group-hover:bg-slate-800/60 group-hover:text-cyan-400",
                        !isActive &&
                          side === "red" &&
                          "group-hover:bg-slate-800/60 group-hover:text-rose-300",
                      )}
                    >
                      {championsById[imageChampionId]?.nameEn ?? imageChampionId}
                    </p>
                  </div>
                ) : (
                  <div
                    className="min-h-0 flex-1 rounded-md bg-slate-950/30"
                    aria-hidden
                  />
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export default function Home() {
  const {
    blue,
    red,
    currentTurn,
    draftOrder,
    disabledChampions,
    pendingChampion,
    banStatus,
    setPendingChampion,
    confirmSelection,
    swapTeamPicks,
    resetDraft,
  } = useBanPickStore();
  const {
    blueTeamName,
    redTeamName,
    seriesType,
    isSetupComplete,
    isTimerEnabled,
    draftMode,
    score,
    usedChampionsByBlue,
    usedChampionsByRed,
    allUsedChampions,
    currentSet,
    pendingWinner,
    seriesWinner,
    selectSetWinner,
    advanceToNextSet,
    resetSeries,
  } = useSettingsStore();
  const [activeRole, setActiveRole] = useState<(typeof ROLES)[number]>("ALL");
  const [search, setSearch] = useState("");
  const [champions, setChampions] = useState<ChampionCard[]>([]);
  const [loadingChampions, setLoadingChampions] = useState(true);
  const [championsLoadError, setChampionsLoadError] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);
  const [showSeriesOverlay, setShowSeriesOverlay] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showContactToast, setShowContactToast] = useState(false);
  const [isSwapPhase, setIsSwapPhase] = useState(false);
  const [selectedSwapSlot, setSelectedSwapSlot] = useState<{
    team: "blue" | "red";
    index: number;
  } | null>(null);
  const isProcessingTimeoutRef = useRef(false);
  const turnResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevTimeLeftRef = useRef(TURN_SECONDS);

  useEffect(() => {
    fetchAllChampions()
      .then((result) => {
        setChampions(result);
        setChampionsLoadError(false);
      })
      .catch(() => {
        setChampions([]);
        setChampionsLoadError(true);
      })
      .finally(() => setLoadingChampions(false));
  }, []);

  const championsById = useMemo(
    () =>
      champions.reduce<Record<string, ChampionCard>>((acc, champion) => {
        acc[champion.id] = champion;
        return acc;
      }, {}),
    [champions],
  );

  const activeTurn = draftOrder[currentTurn];
  const isSetFinished = currentTurn >= draftOrder.length;
  const isSeriesOver = Boolean(seriesWinner);
  const maxSets = seriesType === "BO5" ? 5 : 3;
  const winnerTeamNameRaw = seriesWinner === "blue" ? blueTeamName : redTeamName;
  const winnerTeamName = winnerTeamNameRaw?.trim()
    ? winnerTeamNameRaw.trim()
    : seriesWinner === "blue"
      ? "블루팀"
      : "레드팀";
  const supportEmail = "sh.park.works@gmail.com";

  useEffect(() => {
    if (!seriesWinner) {
      setShowSeriesOverlay(false);
      return;
    }
    const overlayDelay = setTimeout(() => {
      setShowSeriesOverlay(true);
    }, 500);
    return () => clearTimeout(overlayDelay);
  }, [seriesWinner]);

  useEffect(() => {
    if (!isSetFinished) {
      setIsSwapPhase(false);
      setSelectedSwapSlot(null);
      return;
    }
    setIsSwapPhase(true);
    setSelectedSwapSlot(null);
  }, [isSetFinished]);

  useEffect(() => {
    if (turnResetTimeoutRef.current) {
      clearTimeout(turnResetTimeoutRef.current);
      turnResetTimeoutRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (!isSetupComplete || !activeTurn || isSeriesOver) return;

    turnResetTimeoutRef.current = setTimeout(() => {
      setTimeLeft(TURN_SECONDS);
    }, 0);

    if (!isTimerEnabled) return;

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (turnResetTimeoutRef.current) {
        clearTimeout(turnResetTimeoutRef.current);
        turnResetTimeoutRef.current = null;
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [activeTurn, currentTurn, isSetupComplete, isTimerEnabled, isSeriesOver]);

  const timerUrgent = isTimerEnabled && timeLeft < 10;
  const isZeroTime = isTimerEnabled && timeLeft === 0;
  const showTimerPulse = timerUrgent;
  const isTurnResetTransition = prevTimeLeftRef.current === 0 && timeLeft === TURN_SECONDS;

  useEffect(() => {
    prevTimeLeftRef.current = timeLeft;
  }, [timeLeft]);

  const handleContactClick = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(supportEmail);
      }
    } catch {
      // no-op: keep interaction graceful even when clipboard permission is denied
    }
    setShowContactToast(true);
    setTimeout(() => setShowContactToast(false), 1500);
  };

  const handleSwapSelect = (team: "blue" | "red", index: number) => {
    if (!isSwapPhase) return;
    if (!selectedSwapSlot) {
      setSelectedSwapSlot({ team, index });
      return;
    }
    if (selectedSwapSlot.team !== team) {
      setSelectedSwapSlot({ team, index });
      return;
    }
    if (selectedSwapSlot.index === index) {
      setSelectedSwapSlot(null);
      return;
    }
    swapTeamPicks(team, selectedSwapSlot.index, index);
    setSelectedSwapSlot(null);
  };

  const selectedChampionIds = useMemo(() => {
    const disabled = new Set(disabledChampions);
    if (draftMode === "TOURNAMENT") return disabled;

    if (draftMode === "HARD") {
      allUsedChampions.forEach((id) => disabled.add(id));
      return disabled;
    }

    if (draftMode === "SOFT" && activeTurn) {
      const ownUsed =
        activeTurn.team === "blue" ? usedChampionsByBlue : usedChampionsByRed;
      const enemyUsed =
        activeTurn.team === "blue" ? usedChampionsByRed : usedChampionsByBlue;

      if (activeTurn.type === "pick") {
        ownUsed.forEach((id) => disabled.add(id));
      } else {
        enemyUsed.forEach((id) => disabled.add(id));
      }
    }
    return disabled;
  }, [
    activeTurn,
    allUsedChampions,
    disabledChampions,
    draftMode,
    usedChampionsByBlue,
    usedChampionsByRed,
  ]);
  const filteredChampions = useMemo(() => {
    return champions.filter((champion) => {
      const matchesRole =
        activeRole === "ALL" ||
        champion.positions.includes(
          activeRole as Exclude<(typeof ROLES)[number], "ALL">,
        );
      const matchesSearch = matchesChampionSearch(champion, search);

      return matchesRole && matchesSearch;
    });
  }, [activeRole, champions, search]);

  useEffect(() => {
    if (!isTimerEnabled || !activeTurn || isSetFinished || isSeriesOver) return;
    if (timeLeft !== 0) return;
    if (isProcessingTimeoutRef.current) return;
    isProcessingTimeoutRef.current = true;

    const timeoutAction = setTimeout(() => {
      const latest = useBanPickStore.getState();
      const latestTurn = latest.draftOrder[latest.currentTurn];
      if (!latestTurn) {
        isProcessingTimeoutRef.current = false;
        return;
      }
      // Priority #1: if pending exists, force-confirm it immediately.
      if (latest.pendingChampion) {
        latest.resolveTurn(latest.pendingChampion, { isManual: false });
        isProcessingTimeoutRef.current = false;
        return;
      }

      // Priority #2: fallback by phase.
      if (latestTurn.type === "ban") {
        latest.resolveTurn(null, { isManual: false });
        isProcessingTimeoutRef.current = false;
        return;
      }

      const strictPool = champions
        .map((champion) => champion.id)
        .filter((id) => !selectedChampionIds.has(id));
      const fallbackPool = champions
        .map((champion) => champion.id)
        .filter((id) => !disabledChampions.includes(id));
      const pool = strictPool.length > 0 ? strictPool : fallbackPool;
      if (pool.length === 0) {
        isProcessingTimeoutRef.current = false;
        return;
      }

      const randomChampion = pool[Math.floor(Math.random() * pool.length)];
      latest.resolveTurn(randomChampion, { isManual: false });
      isProcessingTimeoutRef.current = false;
    }, 1000);

    return () => {
      clearTimeout(timeoutAction);
      isProcessingTimeoutRef.current = false;
    };
  }, [
    activeTurn,
    champions,
    currentTurn,
    disabledChampions,
    isSetFinished,
    isSeriesOver,
    isTimerEnabled,
    selectedChampionIds,
    timeLeft,
  ]);

  return (
    <div
      className={cn(
        "bg-[radial-gradient(circle_at_0%_0%,#04333f_0%,#0a0e13_42%,#2b1e44_100%)] text-[#edf1f7]",
        "flex min-h-screen flex-col",
      )}
    >
      <main
        className={cn(
          "mx-auto w-full max-w-[1220px] font-light tracking-wide",
          isSetupComplete
            ? "flex min-h-0 flex-1 flex-col px-7 pb-2 pt-4"
            : "flex flex-1 items-center justify-center px-7 py-6",
        )}
      >
        {!isSetupComplete ? <SetupScreen /> : null}
        {isSetupComplete ? (
          <>
        <button
          type="button"
          onClick={() => {
            resetDraft();
            resetSeries();
          }}
          className="group fixed left-6 top-6 z-40 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[9px] font-light tracking-[0.2em] uppercase text-slate-400 opacity-40 backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:text-white hover:opacity-100 hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.28)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
        >
          <ChevronLeft className="h-3 w-3 shrink-0" strokeWidth={1.6} aria-hidden />
          <span>BACK TO SETUP</span>
        </button>
        <div className="flex min-h-0 flex-1 flex-col gap-y-2">
        <div className="relative mb-1 mt-0 flex shrink-0 flex-col items-center gap-2">
          <div className="relative z-20">
            <SetScoreBadge
              maxSets={maxSets}
              currentSet={currentSet}
              scoreBlue={score.blue}
              scoreRed={score.red}
            />
          </div>
          <motion.div
            key={draftMode}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex select-none items-center justify-center gap-3 pointer-events-none"
          >
            <div className="h-px w-4 shrink-0 bg-white/20" aria-hidden />
            <div className="relative rounded-sm bg-white/5 px-2 py-1">
              <motion.span
                initial={{ letterSpacing: "0.1em" }}
                animate={{ letterSpacing: "0.4em" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="block text-center text-[9px] font-light uppercase text-slate-400"
              >
                {draftModeMetaLabel[draftMode]}
              </motion.span>
              <div
                className={cn(
                  "mt-1 h-[0.5px] w-full rounded-full",
                  draftMode === "SOFT" && "bg-cyan-400/85",
                  draftMode === "HARD" && "bg-red-500",
                  draftMode === "TOURNAMENT" && "bg-white/25",
                )}
                aria-hidden
              />
            </div>
            <div className="h-px w-4 shrink-0 bg-white/20" aria-hidden />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="relative mb-1 w-full min-h-[88px] rounded-t-xl border-b border-white/10 bg-gradient-to-r from-cyan-950/60 via-slate-900/90 to-red-950/60 px-5 py-4 pb-3 backdrop-blur-md"
          >
          <div className="absolute left-5 top-1/2 max-w-[min(38%,280px)] -translate-y-1/2 text-left">
            <span className="text-[10px] font-light tracking-[0.18em] text-cyan-300/95">
              BLUE SIDE
            </span>
            <span className="mt-1 block truncate text-sm font-light tracking-wide text-white">
              {blueTeamName || "블루팀"}
            </span>
          </div>
          <div className="absolute right-5 top-1/2 max-w-[min(38%,280px)] -translate-y-1/2 text-right">
            <span className="text-[10px] font-light tracking-[0.18em] text-rose-300/95">
              RED SIDE
            </span>
            <span className="mt-1 block truncate text-sm font-light tracking-wide text-white">
              {redTeamName || "레드팀"}
            </span>
          </div>
          <motion.div
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
            animate={isSeriesOver ? { opacity: 0, scale: 0.96 } : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            aria-hidden={isSeriesOver}
          >
            <div className="group relative flex flex-col items-center gap-2">
              <div
                className={cn(
                  "w-10 transition-[border-color,box-shadow,filter] duration-300",
                  !isTimerEnabled &&
                    "h-px rounded-full bg-slate-500/40 shadow-none",
                  isTimerEnabled &&
                    !timerUrgent &&
                    "h-px rounded-full bg-cyan-400/90 shadow-[0_0_14px_rgba(34,211,238,0.55)]",
                  isTimerEnabled &&
                    timerUrgent &&
                    "h-0 rounded-none border-0 border-t border-red-500 bg-transparent shadow-[0_0_16px_rgba(239,68,68,0.75)]",
                )}
                aria-hidden
              />
              <motion.div
                className={cn(
                  "relative inline-flex h-16 min-h-16 items-center justify-center overflow-visible bg-transparent px-6 py-3",
                  isTimerEnabled ? "min-w-[4.25ch] w-[4.25ch]" : "min-w-[6rem] w-[6rem]",
                )}
                animate={
                  showTimerPulse ? { scale: [1, 1.06, 1] } : { scale: 1 }
                }
                transition={
                  showTimerPulse
                    ? {
                        duration: isZeroTime ? 0.62 : 0.85,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                    : { duration: 0.2 }
                }
              >
                <div className="grid w-full grid-cols-1 grid-rows-1 place-items-center">
                  <AnimatePresence mode="wait" initial={false}>
                    {isTimerEnabled ? (
                      <motion.span
                        key={`t-${timeLeft}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{
                          duration: isTurnResetTransition ? 0.5 : 0.18,
                          ease: [0.33, 1, 0.68, 1],
                        }}
                        className={cn(
                          "col-span-1 row-span-1 flex items-center justify-center font-mono text-4xl font-semibold tabular-nums tracking-tighter",
                          isZeroTime &&
                            "text-[#b91c1c] drop-shadow-[0_0_8px_rgba(127,29,29,0.95)] drop-shadow-[0_0_25px_rgba(185,28,28,0.8)]",
                          isTimerEnabled &&
                            !timerUrgent &&
                            "text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]",
                          isTimerEnabled &&
                            timerUrgent &&
                            !isZeroTime &&
                            "text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]",
                        )}
                      >
                        {timeLeft.toString().padStart(2, "0")}
                      </motion.span>
                    ) : (
                      <motion.div
                        key="timer-no-limit"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="col-span-1 row-span-1"
                      >
                        <MoebiusInfiniteLoop
                          label={
                            isSwapPhase
                              ? "[ TACTICAL REORDERING PHASE ]"
                              : "[ NO TIME LIMIT ]"
                          }
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
        </div>

        <section className="grid min-h-0 flex-1 grid-cols-[1.08fr_1.65fr_1.08fr] items-stretch gap-x-3 gap-y-2">
          <TeamColumn
            side="blue"
            picks={blue.picks}
            bans={blue.bans}
            activeTurn={activeTurn}
            pendingChampion={pendingChampion}
            championsById={championsById}
            banStatus={banStatus}
            isSwapPhase={isSwapPhase}
            selectedSwapSlot={selectedSwapSlot}
            onSwapSelect={handleSwapSelect}
          />

          <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 p-3 backdrop-blur-xl shadow-[0_0_18px_rgba(59,130,246,0.08)] self-stretch">
            <div className="mb-2 shrink-0 border-b border-white/5 pb-1">
              <div className="flex items-center justify-center gap-6">
                {ROLES.map((role) => {
                  const isActiveRole = activeRole === role;
                  return (
                    <motion.button
                      key={role}
                      type="button"
                      onClick={() => setActiveRole(role)}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "relative cursor-pointer px-0.5 pb-1.5 pt-1 text-[11px] font-light uppercase tracking-[0.15em] transition-all",
                        isActiveRole
                          ? "text-white"
                          : "text-slate-500 hover:text-slate-300 hover:opacity-100",
                      )}
                    >
                      {roleFilterDisplayLabel[role]}
                      {isActiveRole ? (
                        <motion.div
                          layoutId="active-tab"
                          className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-cyan-500/0 via-cyan-400 to-cyan-500/0 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                          transition={{ type: "spring", stiffness: 500, damping: 36 }}
                        />
                      ) : null}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="relative mb-2 shrink-0">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7b8aa4]"
                size={14}
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="챔피언 검색"
                autoComplete="off"
                className="h-8 w-full rounded-sm border border-[#2d3748] bg-[#0f1624] pl-9 pr-3 text-xs text-[#dbe2ef] outline-none transition-shadow placeholder:text-[#6c7a93] focus:border-cyan-500/40 focus:shadow-[0_0_14px_rgba(6,182,212,0.2)] focus:ring-1 focus:ring-cyan-500/50"
              />
            </div>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {loadingChampions ? (
              <div className="champion-scroll grid min-h-0 flex-1 grid-cols-6 gap-[6px]">
                {Array.from({ length: 36 }).map((_, idx) => (
                  <div
                    key={`skeleton-${idx}`}
                    className="animate-pulse overflow-hidden rounded-md"
                  >
                    <div className="aspect-square w-full bg-[#223049]" />
                    <div className="mt-[3px] h-5 w-full bg-[#172030]" />
                  </div>
                ))}
              </div>
            ) : championsLoadError ? (
              <div className="flex min-h-0 flex-1 items-center justify-center rounded-lg border border-white/10 bg-slate-950/30 px-4 text-center">
                <p className="text-sm font-light tracking-[0.08em] text-slate-300">
                  챔피언 데이터를 불러오는 중입니다. 네트워크 상태를 확인한 뒤 다시
                  시도해주세요.
                </p>
              </div>
            ) : (
              <div className="champion-scroll grid min-h-0 flex-1 grid-cols-6 gap-[6px]">
                {filteredChampions.map((champion) => {
                  const disabled = selectedChampionIds.has(champion.id);
                  const isPending = pendingChampion === champion.id;
                  const team = activeTurn?.team;
                  return (
                    <button
                      key={champion.id}
                      type="button"
                      disabled={disabled || isSetFinished}
                      onClick={() => {
                        if (isSetFinished) return;
                        setPendingChampion(champion.id);
                      }}
                      className={cn(
                        "group flex w-full flex-col items-center text-left",
                        (disabled || isSetFinished) &&
                          "cursor-not-allowed opacity-50 grayscale",
                      )}
                    >
                      <div
                        className={cn(
                          "relative flex w-full flex-col overflow-hidden rounded-md border transition-all duration-500",
                          !isPending &&
                            "border-t-white/20 border-l-white/15 border-r-white/5 border-b-white/10",
                          !disabled &&
                            !isSetFinished &&
                            !isPending &&
                            "group-hover:border-cyan-500/50 group-hover:shadow-[0_0_10px_rgba(6,182,212,0.4)]",
                          isPending &&
                            team === "blue" &&
                            "border-cyan-400/85 shadow-[0_0_14px_rgba(45,115,255,0.55)]",
                          isPending &&
                            team === "red" &&
                            "border-rose-400/85 shadow-[0_0_14px_rgba(230,69,106,0.55)]",
                          isPending &&
                            !team &&
                            "border-amber-400/80 shadow-[0_0_14px_rgba(200,170,110,0.45)]",
                        )}
                      >
                        <div className="relative aspect-square w-full overflow-hidden">
                          <Image
                            src={champion.image}
                            alt={champion.nameKr}
                            fill
                            draggable={false}
                            sizes="72px"
                            className={cn(
                              "object-cover object-center transition-transform duration-500",
                              "scale-110 enabled:group-hover:scale-100",
                            )}
                          />
                        </div>
                        <p
                          className={cn(
                            "relative w-full truncate whitespace-nowrap border-t border-white/5 bg-slate-900/80 px-1 py-1 text-center text-[10px] font-light uppercase tracking-[0.15em] text-slate-300 backdrop-blur-md rounded-b-md transition-all duration-300",
                            !disabled &&
                              !isSetFinished &&
                              "group-hover:bg-slate-800/60 group-hover:text-cyan-400",
                          )}
                        >
                          {champion.nameKr}
                          <span
                            className={cn(
                              "pointer-events-none absolute inset-x-2 bottom-0 h-px rounded-full opacity-0 transition-opacity duration-300",
                              !disabled &&
                                !isSetFinished &&
                                "group-hover:opacity-100 group-hover:shadow-[0_0_10px_rgba(6,182,212,0.45)]",
                            )}
                            aria-hidden
                          />
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="mt-auto shrink-0 self-stretch">
            <AnimatePresence mode="wait">
              {!isSetFinished ? (
                <motion.div
                  key="draft-action-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                  className="mt-2 rounded-xl border border-white/10 bg-slate-950/40 p-4 backdrop-blur-xl"
                >
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-center text-xs font-light tracking-[0.12em] text-[#dbe2ef]/90">
                      {getTurnText(activeTurn)}
                    </p>
                    <DraftActionButton
                      variant={activeTurn?.type === "ban" ? "ban" : "pick"}
                      disabled={!activeTurn || !pendingChampion}
                      onClick={() => confirmSelection()}
                    >
                      {activeTurn?.type === "ban"
                        ? "챔피언 선택 금지"
                        : "준비 완료"}
                    </DraftActionButton>
                  </div>
                </motion.div>
              ) : isSwapPhase ? (
                <motion.div
                  key="swap-phase-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                  className="mt-1 shrink-0"
                >
                  <div className="mt-2 rounded-xl border border-white/10 bg-slate-950/40 p-4 backdrop-blur-xl">
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-center text-xs font-light tracking-[0.12em] text-[#dbe2ef]/85">
                        같은 팀 내에서 챔피언을 스왑한 뒤 드래프트를 확정하세요
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSwapPhase(false);
                          setSelectedSwapSlot(null);
                        }}
                        className="inline-flex min-h-[50px] items-center justify-center rounded-lg border border-white/25 bg-white/5 px-8 text-sm font-light tracking-[0.24em] text-white transition-all duration-300 hover:border-white/40 hover:bg-white/10 hover:drop-shadow-[0_0_14px_rgba(255,255,255,0.28)]"
                      >
                        FINALIZE DRAFT
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="set-victory-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                  className="mt-1 shrink-0"
                >
                  <WinnerSelectionPanel
                    blueTeamName={blueTeamName}
                    redTeamName={redTeamName}
                    pendingWinner={pendingWinner}
                    seriesWinner={seriesWinner}
                    onSelectWinner={selectSetWinner}
                    onNextSet={() => {
                      const bluePicks = blue.picks.filter(Boolean) as string[];
                      const redPicks = red.picks.filter(Boolean) as string[];
                      advanceToNextSet({ bluePicks, redPicks });
                      resetDraft();
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            </div>
            </div>
          </section>

          <TeamColumn
            side="red"
            picks={red.picks}
            bans={red.bans}
            activeTurn={activeTurn}
            pendingChampion={pendingChampion}
            championsById={championsById}
            banStatus={banStatus}
            isSwapPhase={isSwapPhase}
            selectedSwapSlot={selectedSwapSlot}
            onSwapSelect={handleSwapSelect}
          />
        </section>
        </div>
          <AnimatePresence>
            {showSeriesOverlay && seriesWinner ? (
              <motion.div
                key="series-finish-overlay"
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-[24px]"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="relative w-[420px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 p-8 text-center backdrop-blur-xl"
                >
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0",
                      seriesWinner === "blue" &&
                        "bg-[radial-gradient(circle_at_50%_45%,rgba(6,182,212,0.26),transparent_65%)]",
                      seriesWinner === "red" &&
                        "bg-[radial-gradient(circle_at_50%_45%,rgba(239,68,68,0.24),transparent_65%)]",
                    )}
                    aria-hidden
                  />
                  <div className="relative z-10">
                    <p className="text-[10px] font-light tracking-[0.36em] text-slate-400">
                      SERIES CHAMPION
                    </p>
                    <p className="mt-2 text-[10px] font-light tracking-[0.4em] text-slate-500">
                      시리즈 종료
                    </p>
                    <h2 className="mt-4 text-3xl font-bold tracking-widest text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.6)]">
                      {winnerTeamName} 승리
                    </h2>
                    <p className="mt-3 text-lg font-medium text-slate-200">
                      최종 스코어 {score.blue} : {score.red}
                    </p>
                    <button
                      type="button"
                      onClick={resetSeries}
                      className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-lg border border-white/20 bg-slate-950/40 px-7 py-3 text-sm font-light tracking-[0.2em] text-white transition-all duration-300 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
                    >
                      셋업으로 돌아가기
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
          </>
        ) : null}
      </main>
      {!isSetupComplete ? (
        <footer className="px-6 py-12 text-center text-[10px] leading-loose tracking-wider text-white/20">
          <p>© 2026 Drafter. All rights reserved.</p>
          <p className="mx-auto mt-2 max-w-3xl break-keep font-extralight text-white/40">
            This site is not affiliated with or endorsed by Riot Games, Inc. League of
            Legends and all related assets are trademarks or registered trademarks of Riot
            Games, Inc.
          </p>
          <div className="mt-2 flex items-center justify-center gap-x-4">
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="transition-colors duration-200 hover:text-white/60"
            >
              개인정보처리방침
            </button>
            <span className="opacity-10">|</span>
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="transition-colors duration-200 hover:text-white/60"
            >
              이용약관
            </button>
            <span className="opacity-10">|</span>
            <button
              type="button"
              onClick={handleContactClick}
              className="relative top-px text-[11px] font-mono opacity-40 transition-all duration-300 hover:opacity-100 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
            >
              <span className="inline-flex items-center gap-x-1.5">
                <Mail className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
                <span>CONTACT</span>
              </span>
            </button>
          </div>
        </footer>
      ) : null}
      <AnimatePresence>
        {showTermsModal ? (
          <motion.div
            key="terms-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 backdrop-blur-xl px-4"
            onClick={() => setShowTermsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[700px] rounded-2xl border border-white/10 bg-slate-950/90 p-6 backdrop-blur-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5">
                <h2 className="text-sm font-light uppercase tracking-[0.2em] text-slate-200">
                  TERMS OF SERVICE
                </h2>
              </div>
              <div className="champion-scroll max-h-[58vh] overflow-y-auto pr-2">
                <section className="mb-4 border-b border-white/5 pb-4">
                  <h3 className="text-sm font-bold text-white">제1조 (목적)</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
                    본 약관은 &apos;SEOCKHYUN&apos;이 운영하는 &apos;MOCK BANPICK
                    SIMULATOR&apos;(이하 &quot;서비스&quot;)의 이용 조건 및 절차에 관한
                    사항을 규정함을 목적으로 합니다.
                  </p>
                </section>
                <section className="mb-4 border-b border-white/5 pb-4">
                  <h3 className="text-sm font-bold text-white">제2조 (서비스의 내용)</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
                    본 서비스는 리그 오브 레전드(LoL)의 밴픽 과정을 시뮬레이션하고
                    전략을 구상할 수 있는 디지털 툴을 제공합니다.
                  </p>
                </section>
                <section className="mb-4 border-b border-white/5 pb-4">
                  <h3 className="text-sm font-bold text-white">
                    제3조 (저작권 및 Riot Games 관련 고지)
                  </h3>
                  <ul className="mt-2 space-y-1 text-[13px] leading-relaxed text-slate-400">
                    <li>
                      본 서비스는 Riot Games, Inc.와 제휴하거나 보증받지 않은 순수 팬
                      프로젝트입니다.
                    </li>
                    <li>
                      League of Legends 및 모든 관련 자산은 Riot Games, Inc.의 상표
                      또는 등록 상표입니다.
                    </li>
                    <li>
                      본 서비스에서 사용되는 모든 게임 내 자산은 라이엇 게임즈의
                      커뮤니티 정책을 준수하며 사용됩니다.
                    </li>
                  </ul>
                </section>
                <section className="mb-4 border-b border-white/5 pb-4">
                  <h3 className="text-sm font-bold text-white">제4조 (이용자의 의무)</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
                    이용자는 서비스를 이용함에 있어 관련 법령을 준수해야 하며, 시스템
                    취약점을 이용한 공격이나 서비스의 안정적 운영을 방해하는 행위를
                    해서는 안 됩니다.
                  </p>
                </section>
                <section className="mb-4 border-b border-white/5 pb-4">
                  <h3 className="text-sm font-bold text-white">제5조 (면책 조항)</h3>
                  <ul className="mt-2 space-y-1 text-[13px] leading-relaxed text-slate-400">
                    <li>
                      서비스는 &apos;있는 그대로(As-Is)&apos; 제공되며, 데이터의 영구 저장이나
                      무결성을 보장하지 않습니다.
                    </li>
                    <li>
                      이용자의 부주의로 인해 발생하는 결과에 대해 서비스 제공자는
                      책임을 지지 않습니다.
                    </li>
                  </ul>
                </section>
                <section className="mb-1 pb-1">
                  <h3 className="text-sm font-bold text-white">제6조 (약관의 변경)</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
                    본 약관은 서비스의 기능 개선 및 법적 요건에 따라 사전 고지 없이
                    변경될 수 있습니다.
                  </p>
                </section>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="rounded-md border border-white/15 bg-white/5 px-4 py-2 text-xs tracking-[0.14em] text-slate-200 transition-all duration-300 hover:border-cyan-300/40 hover:text-white hover:shadow-[0_0_16px_rgba(34,211,238,0.3)]"
                >
                  확인
                </button>
              </div>
              <p className="mt-3 text-[11px] text-slate-500">
                문의 사항은 {supportEmail}로 연락 주시기 바랍니다.
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {showPrivacyModal ? (
          <motion.div
            key="privacy-policy-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 backdrop-blur-xl px-4"
            onClick={() => setShowPrivacyModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[700px] rounded-2xl border border-white/10 bg-slate-950/90 p-6 backdrop-blur-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5">
                <h2 className="text-sm font-light uppercase tracking-[0.2em] text-slate-200">
                  PRIVACY POLICY
                </h2>
              </div>
              <div className="champion-scroll max-h-[58vh] space-y-4 overflow-y-auto pr-2 text-[13px] leading-relaxed text-slate-400">
                <section className="mb-4 border-b border-white/5 pb-4">
                  <h3 className="text-sm font-bold text-white">1. 정보 수집</h3>
                  <p className="mt-2">
                  1. 정보 수집: 본 서비스는 별도의 회원가입 없이 이용 가능하며, 어떠한
                  개인정보도 서버에 저장하지 않습니다.
                  </p>
                </section>
                <section className="mb-4 border-b border-white/5 pb-4">
                  <h3 className="text-sm font-bold text-white">2. 로컬 데이터</h3>
                  <p className="mt-2">
                  2. 로컬 데이터: 사용자의 밴픽 설정 및 기록은 브라우저의 로컬
                  스토리지(Local Storage)에만 임시로 저장되며, 브라우저 종료 시 혹은
                  데이터 삭제 시 파기됩니다.
                  </p>
                </section>
                <section>
                  <h3 className="text-sm font-bold text-white">3. 제3자 서비스</h3>
                  <p className="mt-2">
                  3. 제3자 서비스: 본 서비스는 제3자 광고 및 분석 도구를 사용하지 않는
                  순수 팬 프로젝트입니다.
                  </p>
                </section>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(false)}
                  className="rounded-md border border-white/15 bg-white/5 px-4 py-2 text-xs tracking-[0.14em] text-slate-200 transition-all duration-300 hover:border-cyan-300/40 hover:text-white hover:shadow-[0_0_16px_rgba(34,211,238,0.3)]"
                >
                  확인
                </button>
              </div>
              <p className="mt-3 text-[11px] text-slate-500">
                문의 사항은 {supportEmail}로 연락 주시기 바랍니다.
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {showContactToast ? (
          <motion.div
            key="contact-toast"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="pointer-events-none fixed bottom-5 left-1/2 z-[80] -translate-x-1/2 rounded-full border border-white/10 bg-slate-800/90 px-4 py-2 text-[11px] font-mono text-slate-200 backdrop-blur-md"
          >
            Email copied to clipboard
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
