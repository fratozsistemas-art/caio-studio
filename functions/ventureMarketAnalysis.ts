import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ventureName, category, tags } = await req.json();

    // Build search query for market sentiment
    const searchQuery = `${ventureName} ${category || ''} ${tags?.join(' ') || ''} market analysis news`;

    // Use InvokeLLM with internet context to get market sentiment
    const sentimentAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analyze the market sentiment and trends for a venture called "${ventureName}" in the ${category || 'tech'} sector with focus on: ${tags?.join(', ') || 'innovation'}.

Provide a comprehensive analysis including:
1. Overall market sentiment (positive/neutral/negative)
2. Key market trends affecting this sector
3. Competitive landscape insights
4. Growth opportunities
5. Potential risks and challenges
6. Recent news or developments (if any)

Be objective and data-driven in your analysis.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          overall_sentiment: {
            type: "string",
            enum: ["very_positive", "positive", "neutral", "negative", "very_negative"]
          },
          sentiment_score: {
            type: "number",
            description: "Score from -100 to 100"
          },
          market_trends: {
            type: "array",
            items: { type: "string" }
          },
          competitive_landscape: { type: "string" },
          growth_opportunities: {
            type: "array",
            items: { type: "string" }
          },
          risks: {
            type: "array",
            items: { type: "string" }
          },
          recent_developments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                impact: { type: "string", enum: ["positive", "neutral", "negative"] }
              }
            }
          },
          summary: { type: "string" }
        }
      }
    });

    return Response.json({
      venture: ventureName,
      analysis: sentimentAnalysis,
      analyzed_at: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});