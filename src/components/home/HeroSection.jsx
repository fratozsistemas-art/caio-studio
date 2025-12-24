import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import NeuralBrain from "@/components/ui/NeuralBrain";
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/utils";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 py-24">
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-[#00D4FF]/10 via-transparent to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-[#C7A763]/10 via-transparent to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text Content */}
          <motion.div
            className="order-2 lg:order-1"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#C7A763]/30 bg-[#C7A763]/5 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Sparkles className="w-4 h-4 text-[#C7A763]" />
              <span className="text-sm text-[#C7A763] font-medium">Venture Studio</span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white font-montserrat leading-[1.1] mb-6">
              An Operating System for{' '}
              <span className="relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-[#C7A763]">
                  Venture Creation
                </span>
                <motion.span
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-[#00D4FF] to-[#C7A763] rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 1 }}
                />
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 leading-relaxed mb-8 max-w-xl">
              Transformamos complexidade em clareza estratégica. Unimos o intelecto humano 
              com o poder da inteligência artificial para construir o futuro dos negócios.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to={createPageUrl("Portfolio")}>
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] hover:from-[#D4B474] hover:to-[#B99B5A] text-[#06101F] font-semibold px-8 py-6 text-base rounded-xl shadow-lg shadow-[#C7A763]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#C7A763]/30"
                >
                  Explorar Portfolio
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to={createPageUrl("About")}>
                <Button 
                  variant="outline"
                  size="lg"
                  className="border-white/20 bg-white/5 hover:bg-white/10 text-white px-8 py-6 text-base rounded-xl backdrop-blur-sm"
                >
                  Sobre Nós
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <motion.div 
              className="grid grid-cols-3 gap-8 mt-12 pt-12 border-t border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              {[
                { value: "12+", label: "Ventures" },
                { value: "4", label: "Camadas" },
                { value: "∞", label: "Possibilidades" }
              ].map((stat, index) => (
                <div key={index} className="text-center sm:text-left">
                  <div className="text-2xl md:text-3xl font-bold text-[#C7A763] font-montserrat">{stat.value}</div>
                  <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Neural Brain Visual */}
          <motion.div
            className="order-1 lg:order-2 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <div className="relative w-full max-w-lg aspect-square">
              {/* Outer glow ring */}
              <motion.div
                className="absolute inset-0 rounded-full border border-white/5"
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-8 rounded-full border border-[#00D4FF]/10"
                animate={{ rotate: -360 }}
                transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-16 rounded-full border border-[#C7A763]/10"
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Brain SVG */}
              <div className="absolute inset-0 flex items-center justify-center">
                <NeuralBrain className="w-3/4 h-3/4" />
              </div>

              {/* Floating labels */}
              <motion.div
                className="absolute top-1/4 -left-4 sm:left-0 px-3 py-1.5 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/20 text-[#00D4FF] text-xs font-medium"
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                AI Logic
              </motion.div>
              <motion.div
                className="absolute top-1/4 -right-4 sm:right-0 px-3 py-1.5 rounded-full bg-[#C7A763]/10 border border-[#C7A763]/20 text-[#C7A763] text-xs font-medium"
                animate={{ y: [5, -5, 5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                Human Vision
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
          <motion.div
            className="w-1 h-2 bg-[#C7A763] rounded-full"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}