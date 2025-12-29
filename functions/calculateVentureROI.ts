import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ventureId } = await req.json();

    // Fetch venture data
    const ventures = await base44.asServiceRole.entities.Venture.list();
    const venture = ventures.find(v => v.id === ventureId);

    if (!venture) {
      return Response.json({ error: 'Venture not found' }, { status: 404 });
    }

    // Fetch financial data
    const financialRecords = await base44.asServiceRole.entities.FinancialRecord.filter({
      venture_id: ventureId
    });

    const kpis = await base44.asServiceRole.entities.VentureKPI.filter({
      venture_id: ventureId
    });

    // Calculate ROI based on available data
    let totalInvestment = 0;
    let currentValuation = 0;
    let projectedROI = 0;

    // Extract investment from funding history
    if (venture.funding_history && venture.funding_history.length > 0) {
      venture.funding_history.forEach(round => {
        const amount = parseFloat(round.amount?.replace(/[^0-9.-]/g, '') || 0);
        if (amount) totalInvestment += amount;
        
        const valuation = parseFloat(round.valuation?.replace(/[^0-9.-]/g, '') || 0);
        if (valuation > currentValuation) currentValuation = valuation;
      });
    }

    // Calculate ROI from financials
    const revenue = financialRecords
      .filter(f => f.type === 'revenue')
      .reduce((sum, f) => sum + (f.amount || 0), 0);

    const expenses = financialRecords
      .filter(f => f.type === 'expense')
      .reduce((sum, f) => sum + (f.amount || 0), 0);

    const netProfit = revenue - expenses;

    // Calculate actual and projected ROI
    const actualROI = totalInvestment > 0 
      ? ((currentValuation - totalInvestment) / totalInvestment) * 100 
      : 0;

    // Use AI to project future ROI
    const roiProjection = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Based on the following venture data, provide a realistic 12, 24, and 36 month ROI projection:
      
Venture: ${venture.name}
Layer: ${venture.layer}
Status: ${venture.status}
Current Valuation: ${currentValuation}
Total Investment: ${totalInvestment}
Current ROI: ${actualROI.toFixed(2)}%
Revenue: ${revenue}
Expenses: ${expenses}
Net Profit: ${netProfit}
Team Size: ${venture.team_size || 'N/A'}
Founded: ${venture.founded_date || 'N/A'}

Consider:
- Industry growth rates for ${venture.category || 'the sector'}
- Current market conditions
- Venture stage and maturity
- Historical performance trends

Provide conservative, realistic, and optimistic scenarios.`,
      response_json_schema: {
        type: "object",
        properties: {
          projections: {
            type: "object",
            properties: {
              month_12: {
                type: "object",
                properties: {
                  conservative: { type: "number" },
                  realistic: { type: "number" },
                  optimistic: { type: "number" }
                }
              },
              month_24: {
                type: "object",
                properties: {
                  conservative: { type: "number" },
                  realistic: { type: "number" },
                  optimistic: { type: "number" }
                }
              },
              month_36: {
                type: "object",
                properties: {
                  conservative: { type: "number" },
                  realistic: { type: "number" },
                  optimistic: { type: "number" }
                }
              }
            }
          },
          key_factors: {
            type: "array",
            items: { type: "string" }
          },
          risks: {
            type: "array",
            items: { type: "string" }
          },
          confidence_level: {
            type: "string",
            enum: ["low", "medium", "high"]
          }
        }
      }
    });

    return Response.json({
      venture_id: ventureId,
      venture_name: venture.name,
      current_metrics: {
        total_investment: totalInvestment,
        current_valuation: currentValuation,
        actual_roi: actualROI,
        revenue,
        expenses,
        net_profit
      },
      projections: roiProjection.projections,
      analysis: {
        key_factors: roiProjection.key_factors,
        risks: roiProjection.risks,
        confidence_level: roiProjection.confidence_level
      },
      calculated_at: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});