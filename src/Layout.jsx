import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Brain, ArrowUpRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Home", page: "Home" },
  { name: "Portfolio", page: "Portfolio" },
  { name: "Plataformas", page: "Platforms" },
  { name: "Sobre", page: "About" }
];

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentPageName]);

  return (
    <div className="min-h-screen bg-[#06101F] text-white font-inter">
      {/* Custom fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap');
        
        .font-montserrat {
          font-family: 'Montserrat', sans-serif;
        }
        .font-inter {
          font-family: 'Inter', sans-serif;
        }
        
        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #06101F;
        }
        ::-webkit-scrollbar-thumb {
          background: #C7A763;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #A88B4A;
        }

        /* Selection color */
        ::selection {
          background: #C7A763;
          color: #06101F;
        }
      `}</style>

      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'bg-[#06101F]/90 backdrop-blur-xl border-b border-white/10 py-4' 
            : 'bg-transparent py-6'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link 
            to={createPageUrl("Home")} 
            className="flex items-center gap-3 group"
          >
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00D4FF] to-[#C7A763] rounded-xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative w-full h-full rounded-xl border border-white/20 flex items-center justify-center bg-[#06101F]">
                <Brain className="w-5 h-5 text-[#C7A763]" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold font-montserrat tracking-tight">CAIO VISION</span>
              <span className="text-xs text-[#C7A763] -mt-1 tracking-wider">VENTURE STUDIO</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`relative text-sm font-medium transition-colors ${
                  currentPageName === item.page 
                    ? 'text-[#C7A763]' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {item.name}
                {currentPageName === item.page && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#C7A763]"
                    transition={{ duration: 0.3 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link to={createPageUrl("About")}>
              <Button 
                size="sm"
                className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] hover:from-[#D4B474] hover:to-[#B99B5A] text-[#06101F] font-semibold px-5 rounded-full"
              >
                Contato
                <ArrowUpRight className="ml-1 w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#06101F]/95 backdrop-blur-xl border-b border-white/10"
            >
              <div className="px-6 py-6 space-y-4">
                {navigation.map((item) => (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`block py-3 text-lg font-medium transition-colors ${
                      currentPageName === item.page 
                        ? 'text-[#C7A763]' 
                        : 'text-white/70'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                <Link 
                  to={createPageUrl("About")}
                  className="block"
                >
                  <Button 
                    className="w-full bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F] font-semibold rounded-full mt-4"
                  >
                    Contato
                    <ArrowUpRight className="ml-1 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="relative">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link to={createPageUrl("Home")} className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl border border-white/20 flex items-center justify-center bg-[#06101F]">
                  <Brain className="w-5 h-5 text-[#C7A763]" />
                </div>
                <div>
                  <span className="text-lg font-bold font-montserrat">CAIO VISION</span>
                </div>
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                An Operating System for Venture Creation. Transformando complexidade 
                em clareza estratégica através da união entre inteligência humana e artificial.
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="text-white font-semibold mb-4">Navegação</h4>
              <ul className="space-y-3">
                {navigation.map((item) => (
                  <li key={item.page}>
                    <Link
                      to={createPageUrl(item.page)}
                      className="text-slate-400 text-sm hover:text-[#C7A763] transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4">Contato</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li>contato@caiovision.com</li>
                <li>São Paulo, Brasil</li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} CAIO Vision Venture Studio. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-xs text-slate-500">
                Strategic insight at <span className="text-[#C7A763]">thought speed</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}