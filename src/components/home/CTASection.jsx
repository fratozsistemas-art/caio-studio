import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, MessageSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/utils";

export default function CTASection() {
  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-t from-[#C7A763]/10 via-transparent to-transparent" />
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-[#C7A763]/20 via-transparent to-transparent blur-3xl"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [0.9, 1.1, 0.9]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-2 rounded-full border border-[#C7A763]/30 bg-[#C7A763]/5 text-[#C7A763] text-sm font-medium mb-6">
            Vamos Construir Juntos
          </span>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-montserrat leading-tight mb-6">
            Pronto para transformar sua{' '}
            <span className="text-[#C7A763]">visão</span> em{' '}
            <span className="text-[#00D4FF]">realidade</span>?
          </h2>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Se você tem uma ideia transformadora ou busca um parceiro estratégico para 
            escalar seu negócio, queremos ouvir sua história.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl("About")}>
              <Button 
                size="lg"
                className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] hover:from-[#D4B474] hover:to-[#B99B5A] text-[#06101F] font-semibold px-8 py-6 text-base rounded-xl shadow-lg shadow-[#C7A763]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#C7A763]/30"
              >
                <MessageSquare className="mr-2 w-5 h-5" />
                Iniciar Conversa
              </Button>
            </Link>
            <Button 
              variant="outline"
              size="lg"
              className="border-white/20 bg-white/5 hover:bg-white/10 text-white px-8 py-6 text-base rounded-xl backdrop-blur-sm"
            >
              <Mail className="mr-2 w-5 h-5" />
              contato@caiovision.com
            </Button>
          </div>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          className="mt-16 pt-16 border-t border-white/10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-slate-500 text-sm mb-6">Trusted by innovative teams worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-40">
            {['All.AI', 'ORIX', 'Fratoz', 'Innova', 'CRIA'].map((partner, index) => (
              <span 
                key={index}
                className="text-white font-bold text-lg tracking-wider"
              >
                {partner}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}