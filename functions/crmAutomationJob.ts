import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This function runs as a scheduled job to check for stale leads
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get all leads in negotiation stage
    const leadsRes = await base44.asServiceRole.functions.invoke('secureEntityQuery', {
      entity_name: 'StakeholderLead',
      operation: 'filter',
      query: { status: 'negotiation' }
    });

    const leads = leadsRes.data?.data || [];
    const alerts = [];

    for (const lead of leads) {
      const updatedDate = new Date(lead.updated_date);
      
      // Check if lead has been in negotiation for more than 7 days
      if (updatedDate < sevenDaysAgo) {
        const daysInNegotiation = Math.floor((new Date() - updatedDate) / (1000 * 60 * 60 * 24));
        
        // Send alert email
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'CAIO Vision CRM',
          to: lead.created_by,
          subject: `🚨 Alerta: Lead em negociação há ${daysInNegotiation} dias`,
          body: `
            <h2>Alerta de Lead Inativo</h2>
            <p>O lead <strong>${lead.full_name}</strong> da empresa <strong>${lead.company || 'N/A'}</strong> está em fase de negociação há <strong>${daysInNegotiation} dias</strong>.</p>
            
            <h3>Detalhes do Lead:</h3>
            <ul>
              <li>Email: ${lead.email}</li>
              <li>Tipo: ${lead.type}</li>
              <li>Último contato: ${lead.last_contact_date || 'Não registrado'}</li>
            </ul>
            
            <p><strong>Ação recomendada:</strong> Entre em contato o quanto antes para avançar a negociação ou atualizar o status do lead.</p>
            
            <p style="color: #666; font-size: 12px; margin-top: 20px;">Este é um email automático do sistema CRM CAIO Vision.</p>
          `
        });

        alerts.push({
          lead_id: lead.id,
          lead_name: lead.full_name,
          days_in_negotiation: daysInNegotiation,
          alert_sent_to: lead.created_by
        });
      }
    }

    return Response.json({
      status: 'success',
      alerts_sent: alerts.length,
      details: alerts
    });
  } catch (error) {
    return Response.json({ 
      status: 'error',
      error: error.message 
    }, { status: 500 });
  }
});