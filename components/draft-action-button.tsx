"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type DraftActionVariant = "ban" | "pick";

type DraftActionButtonProps = {
  variant: DraftActionVariant;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

export function DraftActionButton({
  variant,
  disabled,
  onClick,
  children,
}: DraftActionButtonProps) {
  const isBan = variant === "ban";

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      layout
      whileTap={disabled ? undefined : { scale: 0.95 }}
      className={cn(
        "relative w-full max-w-[280px] overflow-hidden rounded-lg border px-8 py-3",
        "bg-slate-950/40 backdrop-blur-xl",
        "font-light uppercase tracking-[0.2em] text-white",
        "transition-all duration-500 ease-out",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "hover:bg-white/5",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20",
      )}
      initial={false}
      animate={{
        borderColor: isBan
          ? "rgba(239, 68, 68, 0.5)"
          : "rgba(6, 182, 212, 0.5)",
        boxShadow: isBan
          ? "0 0 22px rgba(239, 68, 68, 0.35), inset 0 1px 0 rgba(255,255,255,0.06)"
          : "0 0 22px rgba(6, 182, 212, 0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
      whileHover={{
        boxShadow: isBan
          ? "0 0 32px rgba(239, 68, 68, 0.55), inset 0 1px 0 rgba(255,255,255,0.08)"
          : "0 0 32px rgba(6, 182, 212, 0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
      transition={{
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
        scale: { type: "spring", stiffness: 500, damping: 28 },
      }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/10"
        initial={false}
        animate={{
          background: isBan
            ? "linear-gradient(135deg, rgba(127, 29, 29, 0.25) 0%, rgba(15, 23, 42, 0.35) 50%, rgba(2, 6, 23, 0.5) 100%)"
            : "linear-gradient(135deg, rgba(6, 78, 90, 0.35) 0%, rgba(15, 23, 42, 0.35) 50%, rgba(2, 6, 23, 0.5) 100%)",
        }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      />
      <span className="relative z-10 flex w-full items-center justify-center text-center">
        {children}
      </span>
    </motion.button>
  );
}
