import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { venture_id } = await req.json();

    if (!venture_id) {
      return Response.json({ error: 'venture_id required' }, { status: 400 });
    }

    // Fetch venture data
    const ventureRes = await base44.asServiceRole.functions.invoke('secureEntityQuery', {
      entity_name: 'Venture',
      operation: 'get',
      query: { id: venture_id }
    });
    const venture = ventureRes.data?.data;

    if (!venture) {
      return Response.json({ error: 'Venture not found' }, { status: 404 });
    }

    // Fetch KPIs
    const kpisRes = await base44.asServiceRole.functions.invoke('secureEntityQuery', {
      entity_name: 'VentureKPI',
      operation: 'filter',
      query: { venture_id }
    });
    const kpis = kpisRes.data?.data || [];

    // Fetch financial records
    const financialsRes = await base44.asServiceRole.functions.invoke('secureEntityQuery', {
      entity_name: 'FinancialRecord',
      operation: 'filter',
      query: { venture_id },
      sort: '-record_date',
      limit: 6
    });
    const financials = financialsRes.data?.data || [];

    // Calculate scores with AI
    const scoreData = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um analista sênior de venture capital. Analise os dados abaixo e calcule scores precisos (0-100) para cada categoria.

VENTURE: ${JSON.stringify(venture)}
KPIs: ${JSON.stringify(kpis)}
FINANCIALS: ${JSON.stringify(financials)}

Calcule scores considerando:

1. FINANCIAL HEALTH (0-100):
- Burn rate vs runway
- Revenue growth
- Expense management
- Cash position

2. KPI PERFORMANCE (0-100):
- Percentage of KPIs meeting/exceeding targets
- Growth trends
- Consistency

3. MARKET POSITION (0-100):
- Layer positioning (startup/scaleup/deeptech)
- Status (active/scaling/development)
- Category strength

4. GROWTH POTENTIAL (0-100):
- Historical growth
- Market opportunities
- Team capacity
- Scalability

Forneça também insights específicos e recomendações acionáveis.`,
      response_json_schema: {
        type: "object",
        properties: {
          financial_health_score: { type: "number" },
          kpi_performance_score: { type: "number" },
          market_position_score: { type: "number" },
          growth_potential_score: { type: "number" },
          overall_score: { type: "number" },
          insights: {
            type: "array",
            items: { type: "string" }
          },
          recommendations: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    // Save score
    const scoreRecord = {
      venture_id,
      ...scoreData,
      calculated_at: new Date().toISOString()
    };

    // Check for existing score
    const existingRes = await base44.asServiceRole.functions.invoke('secureEntityQuery', {
      entity_name: 'VentureScore',
      operation: 'filter',
      query: { venture_id }
    });

    if (existingRes.data?.data?.length > 0) {
      // Update existing
      await base44.asServiceRole.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureScore',
        operation: 'update',
        query: { id: existingRes.data.data[0].id },
        data: scoreRecord
      });
    } else {
      // Create new
      await base44.asServiceRole.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureScore',
        operation: 'create',
        data: scoreRecord
      });
    }

    // Check for alerts
    const alerts = [];

    // Low runway alert
    if (financials.length > 0) {
      const latestFinancial = financials[0];
      const burnRate = latestFinancial.expenses;
      const runway = latestFinancial.cash_balance / burnRate;
      
      if (runway < 6) {
        alerts.push({
          venture_id,
          alert_type: 'runway_low',
          severity: runway < 3 ? 'critical' : 'high',
          title: 'Runway Baixo',
          message: `Runway atual de ${runway.toFixed(1)} meses. Ação necessária para garantir continuidade.`,
          status: 'active',
          metadata: { runway, burn_rate: burnRate }
        });
      }
    }

    // KPI alerts
    kpis.forEach(kpi => {
      if (kpi.target_value && kpi.current_value >= kpi.target_value * 1.2) {
        alerts.push({
          venture_id,
          alert_type: 'kpi_exceeded',
          severity: 'low',
          title: `KPI Superado: ${kpi.kpi_name}`,
          message: `${kpi.kpi_name} alcançou ${kpi.current_value} (meta: ${kpi.target_value})`,
          status: 'active',
          metadata: { kpi_id: kpi.id, kpi_name: kpi.kpi_name }
        });
      } else if (kpi.target_value && kpi.current_value < kpi.target_value * 0.7) {
        alerts.push({
          venture_id,
          alert_type: 'kpi_missed',
          severity: 'medium',
          title: `KPI Abaixo da Meta: ${kpi.kpi_name}`,
          message: `${kpi.kpi_name} está em ${kpi.current_value} (meta: ${kpi.target_value})`,
          status: 'active',
          metadata: { kpi_id: kpi.id, kpi_name: kpi.kpi_name }
        });
      }
    });

    // Financial health alert
    if (scoreData.financial_health_score < 40) {
      alerts.push({
        venture_id,
        alert_type: 'financial_health',
        severity: 'high',
        title: 'Saúde Financeira em Risco',
        message: `Score de saúde financeira baixo (${scoreData.financial_health_score.toFixed(0)}). Revisão urgente necessária.`,
        status: 'active'
      });
    }

    // Create alerts
    for (const alert of alerts) {
      // Check if similar alert already exists
      const existingAlertRes = await base44.asServiceRole.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureAlert',
        operation: 'filter',
        query: {
          venture_id,
          alert_type: alert.alert_type,
          status: 'active'
        }
      });

      if (!existingAlertRes.data?.data?.length) {
        await base44.asServiceRole.functions.invoke('secureEntityQuery', {
          entity_name: 'VentureAlert',
          operation: 'create',
          data: alert
        });
      }
    }

    return Response.json({
      success: true,
      score: scoreRecord,
      alerts_created: alerts.length
    });

  } catch (error) {
    console.error('Error calculating venture score:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});