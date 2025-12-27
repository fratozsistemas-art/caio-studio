import React from 'react';
import HeroSection from '@/components/home/HeroSection';
import PortfolioPreview from '@/components/home/PortfolioPreview';
import OperatingSystemSection from '@/components/home/OperatingSystemSection';
import VideoSection from '@/components/home/VideoSection';
import CTASection from '@/components/home/CTASection';
import YouTubeSection from '@/components/youtube/YouTubeSection';

export default function Home() {
  return (
    <main className="relative">
      <HeroSection />
      <VideoSection />
      <OperatingSystemSection />
      <PortfolioPreview />
      <YouTubeSection 
        title="Conteúdo e Insights"
        subtitle="DO NOSSO CANAL"
        limit={3}
      />
      <CTASection />
    </main>
  );
}