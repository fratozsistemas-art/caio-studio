import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

export default function SectionTitle({ 
  title, 
  subtitle, 
  accent = "gold", // "gold" | "cyan" | "white"
  align = "center",
  className = ""
}) {
  const accentColors = {
    gold: "text-[#C7A763]",
    cyan: "text-[#00D4FF]",
    white: "text-white"
  };

  const lineColors = {
    gold: "from-transparent via-[#C7A763]/50 to-transparent",
    cyan: "from-transparent via-[#00D4FF]/50 to-transparent",
    white: "from-transparent via-white/30 to-transparent"
  };

  const alignClass = {
    center: "text-center items-center",
    left: "text-left items-start",
    right: "text-right items-end"
  };

  return (
    <motion.div 
      className={cn("flex flex-col gap-4", alignClass[align], className)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {subtitle && (
        <span className={cn(
          "text-sm font-medium tracking-[0.3em] uppercase",
          accentColors[accent]
        )}>
          {subtitle}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-montserrat leading-tight">
        {title}
      </h2>
      <div className={cn(
        "h-px w-24 bg-gradient-to-r",
        lineColors[accent]
      )} />
    </motion.div>
  );
}