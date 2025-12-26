import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import SectionTitle from "@/components/ui/SectionTitle";

export default function VideoSection() {
  return (
    <section className="relative py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <SectionTitle
            subtitle="Veja o CAIO em Ação"
            title="Conheça Nossa Visão"
            accent="cyan"
            align="center"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0a1628]/80 backdrop-blur-sm">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#00D4FF]/10 via-transparent to-[#C7A763]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Video iframe */}
            <iframe
              src="https://www.youtube.com/embed/vtxXMSLeVj4"
              title="CAIO Vision Presentation"
              className="w-full h-full relative z-10"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Decorative elements */}
          <motion.div
            className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-[#00D4FF]/10 blur-2xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-[#C7A763]/10 blur-2xl"
            animate={{ scale: [1.2, 1, 1.2] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </motion.div>
      </div>
    </section>
  );
}