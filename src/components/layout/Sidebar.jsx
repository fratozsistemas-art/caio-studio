import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  MessageSquare, 
  Settings, 
  FileText,
  Mail,
  MessageCircle,
  TrendingUp,
  Trophy,
  X,
  CheckSquare,
  FolderKanban
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/translations";

export default function Sidebar({ isOpen, onClose, isAdmin, language }) {
  const location = useLocation();
  const t = useTranslation(language);
  
  const currentPage = location.pathname.split('/').pop() || 'Home';

  const userMenuItems = [
    { name: t.nav.dashboard, page: "PortfolioDashboard", icon: LayoutDashboard },
    { name: t.nav.collaboration, page: "CollaborationHub", icon: MessageSquare },
    { name: t.nav.feedback, page: "FeedbackHub", icon: MessageCircle },
    { name: 'Gamificação', page: "GamificationHub", icon: Trophy }
  ];

  const adminMenuItems = [
    { name: t.nav.admin, page: "AdminHub", icon: Shield },
    { name: t.nav.leads, page: "LeadManagement", icon: Users },
    { name: t.nav.automation, page: "LeadAutomation", icon: TrendingUp },
    { name: t.nav.crm, page: "CRMHub", icon: Settings },
    { name: t.nav.content, page: "ContentHub", icon: FileText },
    { name: t.nav.communication, page: "CommunicationHub", icon: Mail },
    { name: "ClickUp", page: "ClickUpDashboard", icon: CheckSquare },
    { name: "Projects", page: "VentureProjects", icon: FolderKanban }
  ];

  const menuItems = isAdmin ? [...userMenuItems, ...adminMenuItems] : userMenuItems;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: "spring", damping: 20 }}
        className={cn(
          "fixed left-0 top-16 bottom-0 w-64 bg-[#06101F]/95 backdrop-blur-xl border-r border-white/10 z-50 overflow-y-auto",
          "lg:translate-x-0 lg:static lg:z-0"
        )}
      >
        <div className="p-4 space-y-2">
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5 text-white"
          >
            <X className="w-5 h-5" />
          </button>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                  isActive 
                    ? "bg-[#C7A763]/20 text-[#C7A763] border border-[#C7A763]/30" 
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </motion.aside>
    </>
  );
}