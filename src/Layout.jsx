import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Brain, ArrowUpRight, Globe, Moon, Sun, User, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useTranslation } from "react-i18next";
import "@/components/i18n";
import Sidebar from "@/components/layout/Sidebar";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

function LayoutContent({ children, currentPageName }) {
  const { t, i18n } = useTranslation();
  const toggleLanguage = () => {
    const newLang = i18n.language === 'pt-BR' ? 'en-US' : 'pt-BR';
    i18n.changeLanguage(newLang);
  };
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  
  const publicNavigation = [
    { name: t.nav.home, page: "Home" },
    { name: t.nav.journey, page: "StakeholderJourney" },
    { name: t.nav.portfolio, page: "Portfolio" },
    { name: t.nav.about, page: "About" }
  ];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setIsAuthenticated(true);
        setIsAdmin(currentUser?.role === 'admin');
      } catch (error) {
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Check if current page requires authentication
  const protectedPages = ['AdminHub', 'LeadManagement', 'LeadAutomation', 'CRMHub', 'ContentHub', 'CommunicationHub', 'FeedbackHub', 'PortfolioDashboard', 'CollaborationHub'];
  const isProtectedPage = protectedPages.includes(currentPageName);
  const showSidebar = isAuthenticated && isProtectedPage;

  return (
    <div className="min-h-screen bg-background text-foreground font-inter transition-colors duration-300">
      {/* Custom fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap');

        .font-montserrat {
          font-family: 'Montserrat', sans-serif;
        }
        .font-inter {
          font-family: 'Inter', sans-serif;
        }

        :root {
          --background: 222.2 84% 4.9%;
          --foreground: 210 40% 98%;
          --card: 222.2 84% 4.9%;
          --card-foreground: 210 40% 98%;
          --popover: 222.2 84% 4.9%;
          --popover-foreground: 210 40% 98%;
          --primary: 210 40% 98%;
          --primary-foreground: 222.2 47.4% 11.2%;
          --secondary: 217.2 32.6% 17.5%;
          --secondary-foreground: 210 40% 98%;
          --muted: 217.2 32.6% 17.5%;
          --muted-foreground: 215 20.2% 65.1%;
          --accent: 217.2 32.6% 17.5%;
          --accent-foreground: 210 40% 98%;
          --destructive: 0 62.8% 30.6%;
          --destructive-foreground: 210 40% 98%;
          --border: 217.2 32.6% 17.5%;
          --input: 217.2 32.6% 17.5%;
          --ring: 212.7 26.8% 83.9%;
        }

        .light {
          --background: 220 20% 97%;
          --foreground: 222.2 47% 15%;
          --card: 220 20% 98%;
          --card-foreground: 222.2 47% 15%;
          --popover: 220 20% 98%;
          --popover-foreground: 222.2 47% 15%;
          --primary: 222.2 47.4% 11.2%;
          --primary-foreground: 210 40% 98%;
          --secondary: 220 15% 92%;
          --secondary-foreground: 222.2 47.4% 11.2%;
          --muted: 220 15% 92%;
          --muted-foreground: 215.4 16.3% 42%;
          --accent: 220 15% 92%;
          --accent-foreground: 222.2 47.4% 11.2%;
          --destructive: 0 84.2% 60.2%;
          --destructive-foreground: 210 40% 98%;
          --border: 220 15% 88%;
          --input: 220 15% 88%;
          --ring: 222.2 47% 15%;
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: hsl(var(--background));
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
          color: hsl(var(--background));
        }
      `}</style>

      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-background/95 backdrop-blur-xl border-b border-border py-3' 
            : 'bg-background/80 backdrop-blur-md py-4'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Sidebar toggle for authenticated users */}
            {isAuthenticated && isProtectedPage && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Logo */}
            <Link 
              to={createPageUrl("Home")} 
              className="flex items-center gap-2.5 group"
            >
              <div className="relative w-9 h-9">
                <div className="absolute inset-0 bg-gradient-to-r from-[#00D4FF] to-[#C7A763] rounded-lg opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative w-full h-full rounded-lg border border-border flex items-center justify-center bg-background">
                  <Brain className="w-4 h-4 text-[#C7A763]" />
                </div>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold font-montserrat tracking-tight">CASIO V2</span>
                <span className="text-[10px] text-[#C7A763] tracking-[0.15em] uppercase">STUDIO</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Only public pages */}
          <div className="hidden lg:flex items-center gap-1">
            {publicNavigation.map((item) => (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`relative px-3 py-2 text-sm font-medium transition-all rounded-lg ${
                  currentPageName === item.page 
                    ? 'text-[#C7A763] bg-[#C7A763]/10' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.name}
              </Link>
            ))}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-accent transition-all border border-border"
              title={t.theme.toggle}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-accent transition-all border border-border"
              title="Change language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{t.nav.langShort}</span>
            </button>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 ml-2">
                <NotificationBell />
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent transition-all border border-border">
                  <User className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{user?.full_name?.split(' ')[0]}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all"
                  title={t.nav.logout}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Button
                onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
                size="sm"
                className="bg-[#C7A763] hover:bg-[#A88B4A] text-background"
              >
                {t.nav.login}
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          {!isAuthenticated && (
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors border border-border"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          )}
        </nav>

        {/* Mobile Menu - Only for public pages when not authenticated */}
        <AnimatePresence>
          {mobileMenuOpen && !isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-background/98 backdrop-blur-xl border-b border-border"
            >
              <div className="px-6 py-6 space-y-2">
                {publicNavigation.map((item) => (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`block px-3 py-2.5 text-base font-medium rounded-lg transition-all ${
                      currentPageName === item.page 
                        ? 'text-[#C7A763] bg-[#C7A763]/10' 
                        : 'hover:bg-accent'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}

                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-base font-medium rounded-lg hover:bg-accent"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {theme === 'dark' ? t.theme.light : t.theme.dark}
                </button>

                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-base font-medium rounded-lg hover:bg-accent"
                >
                  <Globe className="w-4 h-4" />
                  {t.nav.langFull}
                </button>

                <Button
                  onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
                  className="w-full bg-[#C7A763] hover:bg-[#A88B4A] text-background font-semibold rounded-lg shadow-lg mt-4"
                >
                  {t.nav.login}
                  <ArrowUpRight className="ml-1.5 w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Layout with Sidebar for authenticated users */}
      <div className="flex pt-16">
        {/* Sidebar for authenticated users on protected pages */}
        {showSidebar && isAdmin !== null && (
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            isAdmin={isAdmin}
          />
        )}

        {/* Main Content */}
        <main className={cn(
          "flex-1 min-h-screen transition-all",
          showSidebar && "lg:ml-0"
        )}>
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-border py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link to={createPageUrl("Home")} className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl border border-white/20 flex items-center justify-center bg-[#06101F]">
                  <Brain className="w-5 h-5 text-[#C7A763]" />
                </div>
                <div>
                  <span className="text-lg font-bold font-montserrat">CASIO V2 STUDIO</span>
                </div>
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                {t.footer.description}
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="text-white font-semibold mb-4">{t.footer.navigation}</h4>
              <ul className="space-y-3">
                {publicNavigation.map((item) => (
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
              <h4 className="text-white font-semibold mb-4">{t.footer.contact}</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li>contato@caiovision.com</li>
                <li>São Paulo, Brasil</li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} {t.footer.brand || 'CASIO V2 STUDIO'}. {t.footer.rights}
            </p>
            <div className="flex items-center gap-6">
              <span className="text-xs text-slate-500">
                {t.footer.tagline} <span className="text-[#C7A763]">{t.footer.speed}</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { ThemeProvider } from "@/components/providers/ThemeProvider";

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </ThemeProvider>
  );
}