import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Layers, Network, ArrowRight, Zap, Shield, TrendingUp, Users, Code, Database, Cloud, Lock } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import SectionTitle from '@/components/ui/SectionTitle';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function OperatingSystem() {
  const features = {
    tsi: [
      {
        icon: Brain,
        title: 'Market Intelligence',
        description: 'Análise preditiva de mercado com IA avançada'
      },
      {
        icon: TrendingUp,
        title: 'Risk Assessment',
        description: 'Identificação proativa de riscos e oportunidades'
      },
      {
        icon: Database,
        title: 'Data Integration',
        description: 'Consolidação de dados de múltiplas fontes'
      },
      {
        icon: Zap,
        title: 'Real-time Insights',
        description: 'Insights estratégicos em tempo real'
      }
    ],
    os: [
      {
        icon: Layers,
        title: 'Venture Lifecycle',
        description: 'Gestão completa do ciclo de vida das ventures'
      },
      {
        icon: Users,
        title: 'Resource Allocation',
        description: 'Otimização de alocação de recursos e talentos'
      },
      {
        icon: Code,
        title: 'Process Automation',
        description: 'Automação inteligente de processos operacionais'
      },
      {
        icon: Network,
        title: 'Ecosystem Orchestration',
        description: 'Orquestração do ecossistema de ventures'
      }
    ],
    services: [
      {
        icon: Shield,
        title: 'Jurídico',
        description: 'Consultoria jurídica especializada para ventures'
      },
      {
        icon: TrendingUp,
        title: 'Financeiro',
        description: 'Gestão financeira e planejamento estratégico'
      },
      {
        icon: Users,
        title: 'RH & Talentos',
        description: 'Recrutamento, desenvolvimento e retenção'
      },
      {
        icon: Cloud,
        title: 'Marketing & Tech',
        description: 'Infraestrutura tecnológica e marketing digital'
      }
    ]
  };

  const kernelComponents = [
    {
      id: 'tsi',
      title: 'CAIO TSI',
      subtitle: 'The Strategic Intelligence',
      icon: Brain,
      color: 'from-[#00D4FF] to-[#0099CC]',
      description: 'Núcleo de inteligência estratégica que processa dados de mercado e gera insights acionáveis para tomada de decisão.',
      features: features.tsi,
      capabilities: [
        'Análise preditiva com modelos de machine learning',
        'Processamento de big data em tempo real',
        'Intelligence sobre competidores e tendências',
        'Cenários estratégicos automatizados'
      ]
    },
    {
      id: 'os',
      title: 'CAIO OS',
      subtitle: 'Operating System',
      icon: Layers,
      color: 'from-[#C7A763] to-[#A88B4A]',
      description: 'Arquitetura proprietária que padroniza processos de criação e escala de ventures, garantindo eficiência operacional.',
      features: features.os,
      capabilities: [
        'Metodologia padronizada de venture building',
        'Workflows automatizados e KPIs integrados',
        'Gestão de portfolio com dashboards em tempo real',
        'Sistema de alocação dinâmica de recursos'
      ]
    },
    {
      id: 'services',
      title: 'Central Services',
      subtitle: 'Shared Infrastructure',
      icon: Network,
      color: 'from-[#8B5CF6] to-[#6D28D9]',
      description: 'Recursos compartilhados: jurídico, financeiro, RH, marketing e tecnologia, reduzindo custos e acelerando execução.',
      features: features.services,
      capabilities: [
        'Infraestrutura compartilhada entre ventures',
        'Expertise especializada on-demand',
        'Redução de custos operacionais em até 40%',
        'Time-to-market reduzido drasticamente'
      ]
    }
  ];

  return (
    <main className="min-h-screen py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 mb-6">
            <span className="text-[#00D4FF] text-xs font-medium tracking-[0.3em] uppercase">THE KERNEL</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white font-montserrat mb-6">
            Sistema Operacional para Ventures
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Uma arquitetura integrada que combina inteligência estratégica, 
            padronização de processos e infraestrutura compartilhada para 
            acelerar o sucesso de ventures.
          </p>
        </motion.div>

        {/* Visual Architecture */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-20"
        >
          <GlowCard glowColor="mixed" className="p-8 md:p-12">
            <div className="grid md:grid-cols-3 gap-8">
              {kernelComponents.map((component, idx) => (
                <div key={component.id} className="relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${component.color} opacity-10 rounded-xl blur-xl`} />
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${component.color} flex items-center justify-center mb-4`}>
                      <component.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{component.title}</h3>
                    <p className="text-sm text-[#00D4FF] mb-3">{component.subtitle}</p>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {component.description}
                    </p>
                  </div>
                  {idx < 2 && (
                    <div className="hidden md:block absolute top-8 -right-4 text-[#C7A763]">
                      <ArrowRight className="w-8 h-8" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlowCard>
        </motion.div>

        {/* Detailed Components */}
        <div className="space-y-20">
          {kernelComponents.map((component, idx) => (
            <motion.section
              key={component.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="scroll-mt-24"
              id={component.id}
            >
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${component.color} flex items-center justify-center`}>
                    <component.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white font-montserrat">{component.title}</h2>
                    <p className="text-[#00D4FF]">{component.subtitle}</p>
                  </div>
                </div>
                <p className="text-lg text-slate-300 max-w-3xl">
                  {component.description}
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {component.features.map((feature, featureIdx) => (
                  <GlowCard key={featureIdx} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${component.color} flex items-center justify-center flex-shrink-0`}>
                        <feature.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold mb-1">{feature.title}</h4>
                        <p className="text-sm text-slate-400">{feature.description}</p>
                      </div>
                    </div>
                  </GlowCard>
                ))}
              </div>

              {/* Capabilities */}
              <GlowCard glowColor={idx === 0 ? 'cyan' : idx === 1 ? 'gold' : 'mixed'} className="p-6">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#C7A763]" />
                  Capacidades Principais
                </h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {component.capabilities.map((capability, capIdx) => (
                    <div key={capIdx} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] mt-2 flex-shrink-0" />
                      <span className="text-sm text-slate-300">{capability}</span>
                    </div>
                  ))}
                </div>
              </GlowCard>
            </motion.section>
          ))}
        </div>

        {/* Integration Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <SectionTitle
            title="Integração Sistêmica"
            subtitle="O DIFERENCIAL"
            accent="cyan"
            align="center"
            className="mb-12"
          />
          <GlowCard glowColor="mixed" className="p-8 md:p-12">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-[#00D4FF] mb-2">3x</div>
                <div className="text-sm text-slate-400">Velocidade de Execução</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#C7A763] mb-2">40%</div>
                <div className="text-sm text-slate-400">Redução de Custos</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">2x</div>
                <div className="text-sm text-slate-400">Taxa de Sucesso</div>
              </div>
            </div>
            <div className="border-t border-white/10 pt-8">
              <p className="text-center text-slate-300 mb-6">
                A combinação dessas três engrenagens cria um efeito multiplicador único no ecossistema, 
                permitindo que ventures escalem mais rápido com menor risco.
              </p>
              <div className="flex justify-center gap-4">
                <Link to={createPageUrl('Portfolio')}>
                  <Button className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]">
                    Ver Portfolio
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to={createPageUrl('About')}>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    Sobre Nós
                  </Button>
                </Link>
              </div>
            </div>
          </GlowCard>
        </motion.section>
      </div>
    </main>
  );
}