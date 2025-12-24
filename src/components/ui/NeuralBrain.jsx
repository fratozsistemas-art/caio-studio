import React from 'react';
import { motion } from 'framer-motion';

export default function NeuralBrain({ className = "" }) {
  return (
    <motion.svg
      viewBox="0 0 200 180"
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <defs>
        {/* Glow filters */}
        <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="cyanGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {/* Gradients */}
        <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00D4FF" stopOpacity="1"/>
          <stop offset="100%" stopColor="#0099CC" stopOpacity="0.8"/>
        </linearGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C7A763" stopOpacity="1"/>
          <stop offset="100%" stopColor="#A88B4A" stopOpacity="0.8"/>
        </linearGradient>
      </defs>

      {/* Left Hemisphere - Cyan (Logic/AI) */}
      <g filter="url(#cyanGlow)">
        {/* Main brain shape left */}
        <motion.path
          d="M100 40 C70 40, 45 55, 40 80 C35 105, 45 130, 60 145 C75 160, 95 160, 100 150"
          fill="none"
          stroke="url(#cyanGrad)"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        {/* Neural branches left */}
        <motion.path
          d="M55 70 C40 65, 25 75, 20 90"
          fill="none"
          stroke="#00D4FF"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />
        <motion.path
          d="M50 95 C35 95, 20 105, 15 120"
          fill="none"
          stroke="#00D4FF"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.7 }}
        />
        <motion.path
          d="M60 120 C45 125, 35 140, 35 155"
          fill="none"
          stroke="#00D4FF"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.9 }}
        />
        {/* Synaptic nodes left */}
        {[
          { cx: 20, cy: 90, delay: 1.5 },
          { cx: 15, cy: 120, delay: 1.7 },
          { cx: 35, cy: 155, delay: 1.9 },
          { cx: 55, cy: 70, delay: 1.3 },
        ].map((node, i) => (
          <motion.circle
            key={`left-${i}`}
            cx={node.cx}
            cy={node.cy}
            r="4"
            fill="#00D4FF"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: [0, 1, 0.7] }}
            transition={{ duration: 0.5, delay: node.delay, repeat: Infinity, repeatDelay: 2 }}
          />
        ))}
      </g>

      {/* Right Hemisphere - Gold (Human/Creative) */}
      <g filter="url(#goldGlow)">
        {/* Main brain shape right */}
        <motion.path
          d="M100 40 C130 40, 155 55, 160 80 C165 105, 155 130, 140 145 C125 160, 105 160, 100 150"
          fill="none"
          stroke="url(#goldGrad)"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        {/* Neural branches right */}
        <motion.path
          d="M145 70 C160 65, 175 75, 180 90"
          fill="none"
          stroke="#C7A763"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />
        <motion.path
          d="M150 95 C165 95, 180 105, 185 120"
          fill="none"
          stroke="#C7A763"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.7 }}
        />
        <motion.path
          d="M140 120 C155 125, 165 140, 165 155"
          fill="none"
          stroke="#C7A763"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.9 }}
        />
        {/* Synaptic nodes right */}
        {[
          { cx: 180, cy: 90, delay: 1.6 },
          { cx: 185, cy: 120, delay: 1.8 },
          { cx: 165, cy: 155, delay: 2.0 },
          { cx: 145, cy: 70, delay: 1.4 },
        ].map((node, i) => (
          <motion.circle
            key={`right-${i}`}
            cx={node.cx}
            cy={node.cy}
            r="4"
            fill="#C7A763"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: [0, 1, 0.7] }}
            transition={{ duration: 0.5, delay: node.delay, repeat: Infinity, repeatDelay: 2 }}
          />
        ))}
      </g>

      {/* Center connection - the corpus callosum */}
      <motion.line
        x1="100"
        y1="60"
        x2="100"
        y2="140"
        stroke="url(#cyanGrad)"
        strokeWidth="1"
        strokeDasharray="4 4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 1, delay: 2 }}
      />

      {/* Central pulse */}
      <motion.circle
        cx="100"
        cy="100"
        r="8"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [0.5, 1.5, 0.5], opacity: [0, 0.8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}