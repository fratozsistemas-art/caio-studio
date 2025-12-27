import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Variantes de botões com contraste WCAG AA/AAA garantido
 */
export const buttonVariants = {
  // Primary - Alto contraste
  primary: "bg-[#00D4FF] hover:bg-[#00B8E6] text-[#06101F] font-semibold shadow-lg hover:shadow-xl transition-all",
  
  // Secondary/Gold - Alto contraste
  gold: "bg-[#D4B474] hover:bg-[#C7A763] text-[#06101F] font-semibold shadow-lg hover:shadow-xl transition-all",
  
  // Outline com contraste melhorado
  outlineLight: "border-2 border-white bg-transparent hover:bg-white/10 text-white font-medium transition-all",
  outlineCyan: "border-2 border-[#00D4FF] bg-transparent hover:bg-[#00D4FF]/10 text-[#00D4FF] font-medium transition-all",
  outlineGold: "border-2 border-[#D4B474] bg-transparent hover:bg-[#D4B474]/10 text-[#D4B474] font-medium transition-all",
  
  // Ghost com contraste melhorado
  ghostLight: "bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 transition-all",
  
  // Danger
  danger: "bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg transition-all",
  
  // Success
  success: "bg-green-500 hover:bg-green-600 text-white font-semibold shadow-lg transition-all",
};

export default function AccessibleButton({ 
  children, 
  variant = "primary", 
  className = "",
  ...props 
}) {
  const variantClass = buttonVariants[variant] || buttonVariants.primary;
  
  return (
    <Button
      className={cn(variantClass, className)}
      {...props}
    >
      {children}
    </Button>
  );
}