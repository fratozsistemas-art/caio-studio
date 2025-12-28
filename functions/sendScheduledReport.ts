import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active reports
    const reports = await base44.asServiceRole.entities.MarketReport.filter({ active: true });

    for (const report of reports) {
      try {
        // Check if it's time to send this report
        const now = new Date();
        const nextScheduled = report.next_scheduled ? new Date(report.next_scheduled) : null;
        
        if (nextScheduled && nextScheduled > now) {
          continue; // Not time yet
        }

        // Fetch intelligence for all companies in report
        const companiesData = await base44.asServiceRole.entities.CompanyProfile.filter({
          id: { $in: report.companies }
        });

        const intelligenceData = [];
        for (const company of companiesData) {
          const intelligence = await base44.asServiceRole.functions.invoke('companyIntelligence', {
            company_name: company.company_name,
            stock_symbol: company.stock_symbol,
            cnpj: company.cnpj
          });

          if (intelligence.data?.success) {
            intelligenceData.push({
              company: company.company_name,
              data: intelligence.data.intelligence
            });
          }
        }

        // Generate report HTML
        let reportHTML = `
          <h1>${report.report_name}</h1>
          <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
          <hr>
        `;

        for (const companyIntel of intelligenceData) {
          reportHTML += `<h2>${companyIntel.company}</h2>`;

          if (report.report_sections.includes('stock_prices') && companyIntel.data.stock_data) {
            const stock = companyIntel.data.stock_data;
            reportHTML += `
              <h3>Dados de Ação</h3>
              <ul>
                <li>Preço: R$${stock.price}</li>
                <li>Variação: ${stock.change_percent}</li>
                <li>Volume: ${stock.volume}</li>
              </ul>
            `;
          }

          if (report.report_sections.includes('sentiment') && companyIntel.data.market_sentiment) {
            const sentiment = companyIntel.data.market_sentiment;
            reportHTML += `
              <h3>Sentimento de Mercado</h3>
              <p><strong>Status:</strong> ${sentiment.overall_sentiment}</p>
              <p>${sentiment.summary}</p>
            `;
          }

          if (report.report_sections.includes('news') && companyIntel.data.news.length > 0) {
            reportHTML += `<h3>Notícias Recentes</h3><ul>`;
            companyIntel.data.news.slice(0, 3).forEach(news => {
              reportHTML += `<li><strong>${news.title}</strong> - ${news.source}</li>`;
            });
            reportHTML += `</ul>`;
          }

          reportHTML += '<hr>';
        }

        // Send email to recipients
        for (const recipient of report.recipients) {
          await base44.integrations.Core.SendEmail({
            to: recipient,
            subject: `${report.report_name} - ${new Date().toLocaleDateString('pt-BR')}`,
            body: reportHTML
          });
        }

        // Update report
        const nextSend = new Date();
        if (report.report_type === 'daily') {
          nextSend.setDate(nextSend.getDate() + 1);
        } else if (report.report_type === 'weekly') {
          nextSend.setDate(nextSend.getDate() + 7);
        } else if (report.report_type === 'monthly') {
          nextSend.setMonth(nextSend.getMonth() + 1);
        }

        await base44.asServiceRole.entities.MarketReport.update(report.id, {
          last_sent: new Date().toISOString(),
          next_scheduled: nextSend.toISOString()
        });

      } catch (error) {
        console.error(`Error sending report ${report.report_name}:`, error);
      }
    }

    return Response.json({
      success: true,
      message: 'Reports processed',
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