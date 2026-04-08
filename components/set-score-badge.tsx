"use client";

import { AnimatePresence, motion } from "framer-motion";

function SlidingScore({ value }: { value: number }) {
  return (
    <span className="inline-flex h-5 min-w-[1.25ch] items-center justify-center overflow-hidden tabular-nums">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={value}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

type SetScoreBadgeProps = {
  currentSet: number;
  scoreBlue: number;
  scoreRed: number;
  maxSets: number;
};

export function SetScoreBadge({
  currentSet,
  scoreBlue,
  scoreRed,
  maxSets,
}: SetScoreBadgeProps) {
  const seriesText = maxSets === 5 ? "BO5" : "BO3";

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      className="pointer-events-none flex items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-slate-950/40 px-6 py-1 shadow-[0_0_15px_rgba(255,255,255,0.05)] backdrop-blur-xl"
    >
      <span className="text-[10px] font-light uppercase tracking-[0.2em] text-slate-400">
        {seriesText}
      </span>
      <span className="text-[10px] font-light uppercase tracking-[0.2em] text-slate-500">
        ·
      </span>
      <span className="text-[10px] font-light uppercase tracking-[0.2em] text-slate-400">
        SET {currentSet}
      </span>
      <span className="h-3 w-px shrink-0 bg-white/10" aria-hidden />
      <div className="flex items-center gap-2 text-base font-medium tracking-widest text-white">
        <span
          className="h-[3px] w-[3px] shrink-0 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.5)]"
          aria-hidden
        />
        <SlidingScore value={scoreBlue} />
        <span className="text-white/35">:</span>
        <SlidingScore value={scoreRed} />
        <span
          className="h-[3px] w-[3px] shrink-0 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.45)]"
          aria-hidden
        />
      </div>
    </motion.div>
  );
}
