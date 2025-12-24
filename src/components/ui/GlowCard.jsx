import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

export default function GlowCard({ 
  children, 
  className = "", 
  glowColor = "cyan", // "cyan" | "gold" | "mixed"
  hover = true 
}) {
  const glowStyles = {
    cyan: "before:bg-gradient-to-r before:from-[#00D4FF]/20 before:to-transparent hover:before:from-[#00D4FF]/30",
    gold: "before:bg-gradient-to-r before:from-[#C7A763]/20 before:to-transparent hover:before:from-[#C7A763]/30",
    mixed: "before:bg-gradient-to-r before:from-[#00D4FF]/20 before:via-transparent before:to-[#C7A763]/20 hover:before:from-[#00D4FF]/30 hover:before:to-[#C7A763]/30"
  };

  const borderStyles = {
    cyan: "border-[#00D4FF]/20 hover:border-[#00D4FF]/40",
    gold: "border-[#C7A763]/20 hover:border-[#C7A763]/40",
    mixed: "border-white/10 hover:border-white/20"
  };

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-[#0a1628]/80 backdrop-blur-sm",
        "before:absolute before:inset-0 before:opacity-0 before:transition-opacity before:duration-500",
        hover && "hover:before:opacity-100",
        glowStyles[glowColor],
        borderStyles[glowColor],
        "transition-all duration-500",
        className
      )}
      whileHover={hover ? { y: -4, scale: 1.01 } : {}}
      transition={{ duration: 0.3 }}
    >
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}