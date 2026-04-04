"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, FileStack, History } from "lucide-react";

interface TestOption {
  id: string;
  title: string;
  description: string;
  icon: any;
}

interface TestOptionsSheetProps {
  onSelect: (optionId: string) => void;
}

const options: TestOption[] = [
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

export function TestOptionsSheet({ onSelect }: TestOptionsSheetProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    // Auto-dismiss after 300ms
    setTimeout(() => {
      onSelect(id);
    }, 300);
  };

  return (
    <div className="space-y-3 pt-4">
      <h3 className="text-lg font-medium text-[#f2efff] mb-4 px-2">
        Choose test scope
      </h3>

      {options.map((option) => {
        const Icon = option.icon;
        const isSelected = selectedId === option.id;

        return (
          <motion.button
            key={option.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(option.id)}
            className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 ${
              isSelected
                ? "bg-[#a78bfa]/10 border-[#a78bfa]/40 opacity-50"
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
  );
}
