import React from 'react';
import { motion } from 'framer-motion';
import { Book, Globe, Shield, Smartphone, Award, Github, ExternalLink, ChevronRight, Sparkles, Users, Target, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlowCard from '@/components/ui/GlowCard';
import SectionTitle from '@/components/ui/SectionTitle';

export default function ColourMeBrazil() {
  const features = [
    {
      icon: Book,
      title: "Interactive Learning",
      description: "Engaging stories about Brazilian culture, folklore, and the Amazon rainforest"
    },
    {
      icon: Globe,
      title: "Bilingual Content",
      description: "Full support for English and Portuguese with text-to-speech"
    },
    {
      icon: Shield,
      title: "Child Safety First",
      description: "COPPA and LGPD compliant with parental consent and minimal data collection"
    },
    {
      icon: Smartphone,
      title: "Progressive Web App",
      description: "Install on any device, works offline, feels like a native app"
    }
  ];

  const techStack = [
    { name: "React 18", category: "Frontend" },
    { name: "Tailwind CSS", category: "Styling" },
    { name: "Base44 SDK", category: "Backend" },
    { name: "Supabase", category: "Storage" },
    { name: "Stripe", category: "Payments" }
  ];

  const milestones = [
    { label: "UI/UX Quality", value: 88, color: "cyan" },
    { label: "PWA Implementation", value: 96, color: "gold" },
    { label: "Accessibility", value: 89, color: "cyan" },
    { label: "Deployment Ready", value: 93, color: "gold" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00D4FF]/5 via-transparent to-[#C7A763]/5" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C7A763]/10 border border-[#C7A763]/20 mb-6">
              <Sparkles className="w-4 h-4 text-[#C7A763]" />
              <span className="text-sm text-[#C7A763] font-medium">Interactive Learning Platform</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 font-montserrat">
              Colour Me <span className="text-[#C7A763]">Brazil</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              An interactive learning platform for children aged 6-12, celebrating Brazilian culture, 
              folklore, and the Amazon rainforest through bilingual educational content.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
              {["COPPA Compliant", "GDPR Ready", "LGPD Ready", "PWA Ready"].map((badge) => (
                <div key={badge} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-500 font-medium">{badge}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-[#C7A763] hover:bg-[#A88B4A] text-background gap-2"
                onClick={() => window.open('https://colourmebrazil.com', '_blank')}
              >
                Visit Website
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="gap-2"
                onClick={() => window.open('https://github.com/fratozsistemas-art/colour-me-brazil', '_blank')}
              >
                <Github className="w-4 h-4" />
                View on GitHub
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            subtitle="KEY FEATURES"
            title="Built for Learning, Safety, and Engagement"
            accent="gold"
            className="mb-16"
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlowCard glowColor="gold" className="p-6 h-full">
                  <feature.icon className="w-10 h-10 text-[#C7A763] mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 px-6 bg-accent/30">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            subtitle="TECHNOLOGY"
            title="Modern Tech Stack"
            accent="cyan"
            className="mb-16"
          />

          <div className="grid md:grid-cols-5 gap-4">
            {techStack.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <GlowCard glowColor="cyan" className="p-4 text-center">
                  <div className="text-xs text-[#00D4FF] mb-2">{tech.category}</div>
                  <div className="font-semibold">{tech.name}</div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Readiness Metrics */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            subtitle="PROJECT STATUS"
            title="Deployment Readiness: 93/100"
            accent="gold"
            className="mb-16"
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlowCard glowColor={milestone.color} className="p-6">
                  <div className="text-4xl font-bold mb-2 text-[#C7A763]">{milestone.value}%</div>
                  <div className="text-sm text-muted-foreground mb-4">{milestone.label}</div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div 
                      className="bg-[#C7A763] h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${milestone.value}%` }}
                    />
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="py-20 px-6 bg-accent/30">
        <div className="max-w-5xl mx-auto">
          <GlowCard glowColor="mixed" className="p-12">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <Users className="w-12 h-12 text-[#00D4FF] mx-auto mb-4" />
                <div className="text-3xl font-bold mb-2">6-12</div>
                <div className="text-muted-foreground">Age Range</div>
              </div>
              <div>
                <Target className="w-12 h-12 text-[#C7A763] mx-auto mb-4" />
                <div className="text-3xl font-bold mb-2">50K+</div>
                <div className="text-muted-foreground">Target Schools</div>
              </div>
              <div>
                <Award className="w-12 h-12 text-[#00D4FF] mx-auto mb-4" />
                <div className="text-3xl font-bold mb-2">2</div>
                <div className="text-muted-foreground">Languages</div>
              </div>
            </div>
          </GlowCard>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6">Ready for Launch</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Colour Me Brazil is production-ready and set to launch in Q1 2026.
              Join us in bringing Brazilian culture to children worldwide.
            </p>
            <Button 
              size="lg" 
              className="bg-[#C7A763] hover:bg-[#A88B4A] text-background gap-2"
              onClick={() => window.open('https://colourmebrazil.com', '_blank')}
            >
              Learn More
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}