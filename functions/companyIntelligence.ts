import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_name, stock_symbol, cnpj } = await req.json();

    if (!company_name) {
      return Response.json({ error: 'company_name is required' }, { status: 400 });
    }

    const intelligence = {
      news: [],
      stock_data: null,
      market_sentiment: null,
      executives: [],
      financial_metrics: null
    };

    // Use AI to search for news
    try {
      const newsPrompt = `Busque e forneça as 5 notícias mais recentes sobre a empresa "${company_name}" no Brasil. Para cada notícia, inclua título, descrição breve, fonte e data aproximada.`;
      
      const newsResult = await base44.integrations.Core.InvokeLLM({
        prompt: newsPrompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            articles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  source: { type: "string" },
                  published_at: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (newsResult?.articles) {
        intelligence.news = newsResult.articles;
      }
    } catch (error) {
      console.error('News search error:', error);
    }

    // Fetch stock data using AI with internet context
    if (stock_symbol) {
      try {
        const stockPrompt = `Busque dados atuais da ação ${stock_symbol} na B3 (Bolsa brasileira). Forneça: preço atual, variação percentual do dia, volume de negociação, abertura, máxima e mínima do dia.`;
        
        const stockResult = await base44.integrations.Core.InvokeLLM({
          prompt: stockPrompt,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              symbol: { type: "string" },
              price: { type: "number" },
              change: { type: "number" },
              change_percent: { type: "string" },
              volume: { type: "number" },
              open: { type: "number" },
              high: { type: "number" },
              low: { type: "number" },
              latest_trading_day: { type: "string" }
            }
          }
        });

        intelligence.stock_data = stockResult;
      } catch (error) {
        console.error('Stock data error:', error);
      }
    }

    // Generate market sentiment analysis
    if (intelligence.news.length > 0 || intelligence.stock_data) {
      try {
        const newsText = intelligence.news.slice(0, 5).map(n => n.title).join('\n');
        const stockInfo = intelligence.stock_data ?
          `Preço: R$${intelligence.stock_data.price}, Variação: ${intelligence.stock_data.change_percent}` : '';

        const sentimentPrompt = `
Analise o sentimento do mercado para a empresa ${company_name} baseado nas seguintes informações:

Notícias recentes:
${newsText}

Dados de ações:
${stockInfo}

Forneça uma análise de sentimento de mercado estruturada com oportunidades e riscos.
`;

        const sentimentResult = await base44.integrations.Core.InvokeLLM({
          prompt: sentimentPrompt,
          response_json_schema: {
            type: "object",
            properties: {
              overall_sentiment: {
                type: "string",
                enum: ["very_positive", "positive", "neutral", "negative", "very_negative"]
              },
              sentiment_score: { type: "number" },
              summary: { type: "string" },
              key_factors: {
                type: "array",
                items: { type: "string" }
              },
              opportunities: {
                type: "array",
                items: { type: "string" }
              },
              risks: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        });

        intelligence.market_sentiment = sentimentResult;
      } catch (error) {
        console.error('AI sentiment analysis error:', error);
      }
    }

    // Get financial metrics using AI
    if (stock_symbol || company_name) {
      try {
        const metricsPrompt = `Busque os principais indicadores financeiros da empresa ${company_name} (${stock_symbol || ''}): market cap, P/L, ROE, margem líquida, dividend yield, setor e indústria.`;
        
        const metricsResult = await base44.integrations.Core.InvokeLLM({
          prompt: metricsPrompt,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              market_cap: { type: "string" },
              pe_ratio: { type: "string" },
              roe: { type: "string" },
              profit_margin: { type: "string" },
              dividend_yield: { type: "string" },
              sector: { type: "string" },
              industry: { type: "string" },
              description: { type: "string" }
            }
          }
        });

        intelligence.financial_metrics = metricsResult;
      } catch (error) {
        console.error('Financial metrics error:', error);
      }
    }

    // Extract executives from CVM data if available
    if (cnpj) {
      try {
        const cvmData = await base44.asServiceRole.entities.CompanyProfile.filter({ cnpj });
        if (cvmData.length > 0 && cvmData[0].cvm_data?.executives) {
          intelligence.executives = cvmData[0].cvm_data.executives;
        }
      } catch (error) {
        console.error('CVM data error:', error);
      }
    }

    return Response.json({
      success: true,
      intelligence,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Function error:', error);
    return Response.json({
      error: error.message,
      success: false
    }, { status: 500 });
  }
});