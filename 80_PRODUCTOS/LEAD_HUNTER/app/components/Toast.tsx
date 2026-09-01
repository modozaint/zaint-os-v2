"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";

export function Toast({ texto }: { texto: string | null }) {
  return (
    <AnimatePresence>
      {texto && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full bg-li-text px-5 py-2.5 text-[14px] font-medium text-white shadow-lg"
        >
          <Check size={15} strokeWidth={3} className="text-li-green" />
          {texto}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
