import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Linkedin, Loader2, ExternalLink, MapPin, Briefcase } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function LinkedInProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLinkedInProfile = async () => {
      try {
        const response = await base44.functions.invoke('getLinkedInProfile');
        setProfile(response.data);
      } catch (err) {
        setError(err.message);
        toast.error('Erro ao carregar perfil do LinkedIn');
      } finally {
        setLoading(false);
      }
    };

    fetchLinkedInProfile();
  }, []);

  if (loading) {
    return (
      <GlowCard className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#0077B5]" />
        </div>
      </GlowCard>
    );
  }

  if (error) {
    return (
      <GlowCard className="p-6">
        <div className="text-center py-8">
          <Linkedin className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </GlowCard>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <GlowCard glowColor="cyan" className="p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0077B5] to-[#005885] flex items-center justify-center text-white text-2xl font-bold">
          {profile.given_name?.[0] || profile.name?.[0] || 'L'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-white">
              {profile.name || `${profile.given_name} ${profile.family_name}`}
            </h3>
            <a
              href={`https://www.linkedin.com/in/${profile.sub || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0077B5] hover:text-[#005885] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          {profile.email && (
            <p className="text-sm text-slate-400">{profile.email}</p>
          )}
        </div>
        <Badge className="bg-[#0077B5]/20 text-[#0077B5]">
          <Linkedin className="w-3 h-3 mr-1" />
          LinkedIn
        </Badge>
      </div>

      {profile.headline && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-4 h-4 text-[#0077B5]" />
            <span className="text-sm text-slate-300">{profile.headline}</span>
          </div>
        </div>
      )}

      {profile.location && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <MapPin className="w-4 h-4" />
          <span>{profile.location}</span>
        </div>
      )}

      {profile.picture && (
        <img
          src={profile.picture}
          alt={profile.name}
          className="hidden"
          onLoad={(e) => {
            e.target.parentElement.querySelector('.w-16').style.backgroundImage = `url(${profile.picture})`;
            e.target.parentElement.querySelector('.w-16').style.backgroundSize = 'cover';
            e.target.parentElement.querySelector('.w-16').textContent = '';
          }}
        />
      )}
    </GlowCard>
  );
}