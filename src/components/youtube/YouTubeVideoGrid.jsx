import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Play, Eye, ThumbsUp, ExternalLink } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';

export default function YouTubeVideoGrid({ category = null, limit = 6 }) {
  const { data: videos, isLoading } = useQuery({
    queryKey: ['youtube-videos', category],
    queryFn: async () => {
      const allVideos = await base44.entities.YouTubeVideo.list('-published_at', 50);
      
      if (category) {
        return allVideos.filter(v => v.category === category).slice(0, limit);
      }
      
      return allVideos.slice(0, limit);
    }
  });

  const formatViewCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatDuration = (duration) => {
    if (!duration) return '';
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '';
    
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white/5 rounded-2xl h-64" />
          </div>
        ))}
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Nenhum vídeo encontrado nesta categoria</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video, i) => (
        <motion.div
          key={video.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
        >
          <a
            href={`https://www.youtube.com/watch?v=${video.video_id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GlowCard glowColor="cyan" className="overflow-hidden group cursor-pointer h-full">
              <div className="relative">
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06101F] to-transparent opacity-60" />
                
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 rounded-full bg-[#00D4FF]/90 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>
                </div>

                {/* Duration */}
                {video.duration && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-xs text-white">
                    {formatDuration(video.duration)}
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="text-white font-semibold mb-2 line-clamp-2 group-hover:text-[#00D4FF] transition-colors">
                  {video.title}
                </h3>
                
                <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                  {video.description}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {formatViewCount(video.view_count)}
                    </span>
                    {video.like_count > 0 && (
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        {formatViewCount(video.like_count)}
                      </span>
                    )}
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Category badge */}
                {video.category && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-[#00D4FF]/10 text-[#00D4FF]">
                      {video.category}
                    </span>
                  </div>
                )}
              </div>
            </GlowCard>
          </a>
        </motion.div>
      ))}
    </div>
  );
}