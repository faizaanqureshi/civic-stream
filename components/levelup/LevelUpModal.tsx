"use client";

import { useEffect, useState } from "react";
import { useCivicStream } from "@/context/CivicStreamContext";
import { motion, AnimatePresence } from "framer-motion";
import { PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LevelUpOverlay() {
  const { state, dispatch } = useCivicStream();
  const [isOpen, setIsOpen] = useState(false);

  // Logic: Calculate level (100 pts per level)
  const currentLevel = Math.floor((state.points || 0) / 100) + 1;

  useEffect(() => {
    // Trigger if they crossed a threshold we haven't celebrated yet
    if (currentLevel > (state.lastCelebratedLevel || 1)) {
      setIsOpen(true);

      // Tell the state we've acknowledged this new level
      dispatch({
        type: "ACKNOWLEDGE_LEVEL_UP",
        payload: currentLevel,
      });
    }
  }, [currentLevel, state.lastCelebratedLevel, dispatch]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PartyPopper className="w-10 h-10 text-[#0F9B7A]" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-1">
              Level {currentLevel}!
            </h2>
            <p className="text-gray-500 mb-6">
              You're leveling up your civic impact. Keep it going!
            </p>
            <Button
              onClick={() => setIsOpen(false)}
              className="w-full py-4 text-lg font-bold">
              Let's Go
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
