import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * AEGIS Protocol - Intellectual Property Protection System
 * Detects and blocks attempts to extract proprietary information
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, context = 'general' } = await req.json();

    // Threat patterns - multilingual (PT/EN)
    const threatPatterns = {
      systemPrompt: [
        /system\s+prompt/i,
        /instruc[ção]+es?\s+do\s+sistema/i,
        /show\s+me\s+(your|the)\s+prompt/i,
        /mostre\s+o\s+prompt/i,
        /reveal\s+instructions/i
      ],
      architecture: [
        /arquitetura\s+(interna|do\s+sistema)/i,
        /internal\s+architecture/i,
        /system\s+design/i,
        /design\s+de\s+sistema/i,
        /como\s+(funciona|está\s+estruturado)/i,
        /how\s+(does\s+it\s+work|is\s+it\s+structured)/i
      ],
      proprietary: [
        /metodologia\s+(interna|proprietária)/i,
        /proprietary\s+method/i,
        /secret\s+sauce/i,
        /molho\s+secreto/i,
        /algoritmo\s+proprietário/i,
        /proprietary\s+algorithm/i
      ],
      systemNames: [
        /tsi/i,
        /esios/i,
        /caio/i,
        /hermes/i,
        /eva-strong/i,
        /hermes-prime/i,
        /inspector/i,
        /aegis/i
      ],
      protocols: [
        /protocolos?\s+(internos?|proprietários?)/i,
        /(internal|proprietary)\s+protocols?/i,
        /código\s+fonte/i,
        /source\s+code/i,
        /implementação\s+técnica/i,
        /technical\s+implementation/i
      ],
      jailbreak: [
        /ignore\s+(previous|all)\s+instructions/i,
        /ignore\s+(todas|as)\s+instruções/i,
        /you\s+are\s+now/i,
        /agora\s+você\s+é/i,
        /pretend\s+(you\s+are|to\s+be)/i,
        /finja\s+que\s+(você\s+é|é)/i,
        /roleplay/i,
        /simulação/i
      ],
      extraction: [
        /export\s+your\s+(knowledge|data|config)/i,
        /exporte\s+(seu\s+conhecimento|dados|configuração)/i,
        /dump\s+(database|knowledge)/i,
        /despeje\s+(banco\s+de\s+dados|conhecimento)/i,
        /extract\s+all/i,
        /extrair\s+tudo/i
      ]
    };

    // Classify threat type and calculate threat score
    const threatAnalysis = {
      detected: false,
      threatType: null,
      threatScore: 0,
      matchedPatterns: [],
      language: 'en'
    };

    // Detect language
    if (/[àáâãçéêíóôõú]/i.test(query)) {
      threatAnalysis.language = 'pt';
    }

    // Check each pattern category
    for (const [category, patterns] of Object.entries(threatPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          threatAnalysis.detected = true;
          threatAnalysis.threatType = category;
          threatAnalysis.matchedPatterns.push(pattern.toString());
          
          // Assign threat scores
          const scores = {
            systemPrompt: 10,
            architecture: 9,
            proprietary: 9,
            protocols: 8,
            systemNames: 7,
            jailbreak: 10,
            extraction: 10
          };
          
          threatAnalysis.threatScore = Math.max(
            threatAnalysis.threatScore, 
            scores[category] || 5
          );
        }
      }
    }

    // Check for combination attacks (multiple pattern matches)
    if (threatAnalysis.matchedPatterns.length > 1) {
      threatAnalysis.threatScore = Math.min(10, threatAnalysis.threatScore + 2);
    }

    // Log suspicious activity (threat score >= 5)
    if (threatAnalysis.threatScore >= 5) {
      await base44.asServiceRole.entities.PermissionAudit.create({
        user_email: user.email,
        action: 'ip_protection_alert',
        resource_type: 'aegis_protocol',
        resource_id: 'query_analysis',
        granted: false,
        reason: `AEGIS: Threat detected (score: ${threatAnalysis.threatScore})`,
        metadata: {
          query: query.substring(0, 200), // Log truncated query
          threatType: threatAnalysis.threatType,
          threatScore: threatAnalysis.threatScore,
          matchedPatterns: threatAnalysis.matchedPatterns.length,
          context,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Pre-approved responses by threat type and language
    const responses = {
      en: {
        systemPrompt: "I'm designed to help you with venture management, analytics, and collaboration. For information about our platform's capabilities, please refer to our public documentation or contact our team at contato@caiovision.com.",
        architecture: "CAIO Vision's internal systems are proprietary. I can help you understand our platform's features and how to use them effectively for your ventures.",
        proprietary: "Our methodologies and algorithms are proprietary intellectual property. I'm here to help you leverage our platform's capabilities to build successful ventures.",
        protocols: "System protocols are confidential. I can assist you with platform features, venture management, and strategic insights.",
        systemNames: "I'm the CAIO Vision AI assistant. How can I help you with your ventures today?",
        jailbreak: "I'm designed specifically to assist with venture building and management. Let me know how I can help with your ventures.",
        extraction: "I cannot provide system data or configurations. I can help you with venture analytics, task management, and collaboration features.",
        general: "I'm here to help you build and manage ventures successfully. What would you like to work on today?"
      },
      pt: {
        systemPrompt: "Fui projetado para ajudá-lo com gestão de ventures, análises e colaboração. Para informações sobre as capacidades da nossa plataforma, consulte nossa documentação pública ou entre em contato com nossa equipe em contato@caiovision.com.",
        architecture: "Os sistemas internos da CAIO Vision são proprietários. Posso ajudá-lo a entender os recursos da nossa plataforma e como usá-los efetivamente para suas ventures.",
        proprietary: "Nossas metodologias e algoritmos são propriedade intelectual. Estou aqui para ajudá-lo a aproveitar as capacidades da nossa plataforma para construir ventures de sucesso.",
        protocols: "Os protocolos do sistema são confidenciais. Posso ajudá-lo com recursos da plataforma, gestão de ventures e insights estratégicos.",
        systemNames: "Sou o assistente de IA da CAIO Vision. Como posso ajudá-lo com suas ventures hoje?",
        jailbreak: "Fui projetado especificamente para auxiliar na construção e gestão de ventures. Me diga como posso ajudar com suas ventures.",
        extraction: "Não posso fornecer dados ou configurações do sistema. Posso ajudá-lo com análises de ventures, gestão de tarefas e recursos de colaboração.",
        general: "Estou aqui para ajudá-lo a construir e gerenciar ventures com sucesso. No que gostaria de trabalhar hoje?"
      }
    };

    // If threat detected, return pre-approved response
    if (threatAnalysis.detected && threatAnalysis.threatScore >= 5) {
      const lang = threatAnalysis.language;
      const responseKey = threatAnalysis.threatType || 'general';
      
      return Response.json({
        blocked: true,
        threatScore: threatAnalysis.threatScore,
        threatType: threatAnalysis.threatType,
        response: responses[lang][responseKey] || responses[lang].general,
        auditLogged: true
      }, { status: 403 });
    }

    // Query is safe - allow processing
    return Response.json({
      blocked: false,
      threatScore: threatAnalysis.threatScore,
      safe: true,
      message: threatAnalysis.language === 'pt' 
        ? 'Query aprovada pelo AEGIS Protocol'
        : 'Query approved by AEGIS Protocol'
    });

  } catch (error) {
    return Response.json({ 
      error: 'AEGIS Protocol error',
      message: error.message 
    }, { status: 500 });
  }
});