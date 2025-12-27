import React from 'react';
import { Youtube } from 'lucide-react';
import SectionTitle from '@/components/ui/SectionTitle';
import YouTubeVideoGrid from './YouTubeVideoGrid';

export default function YouTubeSection({ 
  title = "Últimos Vídeos",
  subtitle = "CONTEÚDO",
  category = null,
  limit = 6
}) {
  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <SectionTitle
            subtitle={subtitle}
            title={title}
            accent="cyan"
            align="left"
          />
          
          <a
            href="https://www.youtube.com/@artificiallysmarter"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 hover:bg-red-600/20 transition-colors"
          >
            <Youtube className="w-5 h-5" />
            <span className="text-sm font-medium">Ver Canal</span>
          </a>
        </div>

        <YouTubeVideoGrid category={category} limit={limit} />
      </div>
    </section>
  );
}