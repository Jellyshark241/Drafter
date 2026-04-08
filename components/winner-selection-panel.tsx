"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { WinnerSide } from "@/stores/settings-store";

export type WinnerSelectionPanelProps = {
  blueTeamName: string;
  redTeamName: string;
  pendingWinner: WinnerSide | null;
  seriesWinner: WinnerSide | null;
  onSelectWinner: (side: WinnerSide) => void;
  onNextSet: () => void;
};

export function WinnerSelectionPanel({
  blueTeamName,
  redTeamName,
  pendingWinner,
  seriesWinner,
  onSelectWinner,
  onNextSet,
}: WinnerSelectionPanelProps) {
  const nextDisabled = !pendingWinner || !!seriesWinner;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "relative flex flex-col gap-4 overflow-hidden rounded-xl border border-white/10 p-6 backdrop-blur-xl",
        "bg-slate-950/40",
        "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-slate-950/60 to-slate-950/90",
        "drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]",
      )}
    >
      <p className="text-center text-sm font-light tracking-[0.14em] text-[#dbe2ef]/90">
        SET VICTORY DASHBOARD
      </p>

      <div className="grid grid-cols-2 gap-4">
        <motion.button
          type="button"
          onClick={() => onSelectWinner("blue")}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
          className={cn(
            "relative overflow-hidden rounded-lg border border-cyan-300/25 border-l border-l-cyan-300/70 px-5 py-4 text-center text-lg font-semibold tracking-widest text-slate-100 backdrop-blur-md",
            "bg-gradient-to-r from-cyan-500/20 via-cyan-950/12 to-slate-950/65",
            "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
            "drop-shadow-[0_0_6px_rgba(6,182,212,0.24)]",
            "hover:border-cyan-200/60 hover:border-l-cyan-200 hover:text-white hover:shadow-[0_0_20px_rgba(6,182,212,0.35)]",
            "hover:bg-gradient-to-r hover:from-cyan-400/24 hover:via-cyan-950/15 hover:to-slate-950/65",
            pendingWinner === "blue" &&
              "border-cyan-200/60 border-l-cyan-200 text-cyan-100 shadow-[0_0_22px_rgba(6,182,212,0.4)] bg-gradient-to-r from-cyan-400/25 via-cyan-950/18 to-slate-950/65",
            pendingWinner === "red" && "opacity-30 grayscale",
          )}
        >
          <span className="relative z-10 inline-block drop-shadow-[0_0_6px_rgba(6,182,212,0.28)]">
            {(blueTeamName || "블루팀").toUpperCase()} 승리
          </span>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => onSelectWinner("red")}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
          className={cn(
            "relative overflow-hidden rounded-lg border border-rose-300/25 border-l border-l-rose-300/70 px-5 py-4 text-center text-lg font-semibold tracking-widest text-slate-100 backdrop-blur-md",
            "bg-gradient-to-r from-rose-500/20 via-rose-950/12 to-slate-950/65",
            "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
            "drop-shadow-[0_0_6px_rgba(239,68,68,0.24)]",
            "hover:border-rose-200/60 hover:border-l-rose-200 hover:text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.35)]",
            "hover:bg-gradient-to-r hover:from-rose-400/24 hover:via-rose-950/15 hover:to-slate-950/65",
            pendingWinner === "red" &&
              "border-rose-200/60 border-l-rose-200 text-rose-100 shadow-[0_0_22px_rgba(239,68,68,0.4)] bg-gradient-to-r from-rose-400/25 via-rose-950/18 to-slate-950/65",
            pendingWinner === "blue" && "opacity-30 grayscale",
          )}
        >
          <span className="relative z-10 inline-block drop-shadow-[0_0_6px_rgba(239,68,68,0.28)]">
            {(redTeamName || "레드팀").toUpperCase()} 승리
          </span>
        </motion.button>
      </div>

      <motion.button
        type="button"
        disabled={nextDisabled}
        onClick={onNextSet}
        whileTap={nextDisabled ? undefined : { scale: 0.95 }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
        className={cn(
          "group relative mt-1 flex w-full min-h-[52px] items-center justify-center overflow-hidden",
          "rounded-lg border border-white/20 px-6 py-4 backdrop-blur-md",
          "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.06] via-slate-950/70 to-slate-950/95",
          "text-sm font-semibold tracking-widest text-slate-100/70",
          "transition-[color,box-shadow,border-color,background-color,filter] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          "drop-shadow-[0_0_5px_rgba(255,255,255,0.14)]",
          "hover:border-white/30 hover:text-white",
          "hover:bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] hover:from-white/[0.14] hover:via-slate-950/70 hover:to-slate-950/95",
          "hover:shadow-[0_0_20px_rgba(255,255,255,0.12)] hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.28)]",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/25",
          "disabled:pointer-events-none disabled:opacity-40",
        )}
      >
        <span className="inline-flex w-full items-center justify-center text-center drop-shadow-[0_0_6px_rgba(255,255,255,0.2)]">
          다음 세트 시작
        </span>
      </motion.button>
    </motion.div>
  );
}
