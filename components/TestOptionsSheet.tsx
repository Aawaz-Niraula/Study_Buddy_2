"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, FileStack, History, Clock, type LucideIcon } from "lucide-react";

interface TestOption {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

interface TestOptionsSheetProps {
  onSelect: (optionId: string, timerMinutes: number | null) => void;
}

const scopeOptions: TestOption[] = [
  {
    id: "current-session",
    title: "Use questions from this session only",
    description: "Generate a test from the questions you just created",
    icon: FileStack,
  },
  {
    id: "include-previous",
    title: "Include questions from previous sessions",
    description: "Mix in questions from your past study sessions",
    icon: History,
  },
];

const timerOptions = [
  { id: "no-timer", label: "No Timer", minutes: null },
  { id: "2-min", label: "2 Minutes", minutes: 2 },
  { id: "4-min", label: "4 Minutes", minutes: 4 },
];

export function TestOptionsSheet({ onSelect }: TestOptionsSheetProps) {
  const [selectedScopeId, setSelectedScopeId] = useState<string | null>(null);
  const [selectedTimerId, setSelectedTimerId] = useState<string>("no-timer");

  const handleSelect = () => {
    if (!selectedScopeId) return;
    
    const timerOption = timerOptions.find(t => t.id === selectedTimerId);
    const timerMinutes = timerOption?.minutes ?? null;

    // Auto-dismiss after 300ms
    setTimeout(() => {
      onSelect(selectedScopeId, timerMinutes);
    }, 300);
  };

  return (
    <div className="space-y-4 pt-4">
      <h3 className="text-lg font-medium text-[#f2efff] mb-4 px-2">
        Choose test options
      </h3>

      {/* Scope Selection */}
      <div className="space-y-3">
        <p className="text-xs text-[#857ca2] uppercase tracking-wide px-2">Test Scope</p>
        {scopeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedScopeId === option.id;

          return (
            <motion.button
              key={option.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedScopeId(option.id)}
              className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 ${
                isSelected
                  ? "bg-[#a78bfa]/10 border-[#a78bfa]/40"
                  : "bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-xl ${
                    isSelected ? "bg-[#a78bfa]/20" : "bg-white/5"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? "text-[#a78bfa]" : "text-[#ddd6fe]"}`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-[#f2efff]">{option.title}</h4>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.3 }}
                      >
                        <Check className="w-5 h-5 text-[#22c55e]" />
                      </motion.div>
                    )}
                  </div>
                  <p className="text-sm text-[#857ca2]">{option.description}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Timer Selection */}
      <div className="space-y-3 pt-2">
        <p className="text-xs text-[#857ca2] uppercase tracking-wide px-2">Time Limit</p>
        <div className="grid grid-cols-3 gap-2">
          {timerOptions.map((option) => {
            const isSelected = selectedTimerId === option.id;

            return (
              <motion.button
                key={option.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedTimerId(option.id)}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? "bg-[#a78bfa]/20 border-[#a78bfa]/50"
                    : "bg-white/5 border-white/10 hover:bg-white/8"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Clock className={`w-5 h-5 ${isSelected ? "text-[#a78bfa]" : "text-[#ddd6fe]"}`} />
                  <span className={`text-xs font-medium ${isSelected ? "text-[#a78bfa]" : "text-[#ddd6fe]"}`}>
                    {option.label}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Start Test Button */}
      <motion.button
        whileTap={{ opacity: 0.6 }}
        onClick={handleSelect}
        disabled={!selectedScopeId}
        className={`w-full min-h-[56px] px-6 py-4 rounded-2xl font-bold text-sm tracking-wide transition-all mt-6 ${
          selectedScopeId
            ? "bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] text-white shadow-lg"
            : "bg-white/5 text-[#857ca2] opacity-50 cursor-not-allowed"
        }`}
      >
        START TEST
      </motion.button>
    </div>
  );
}
