import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Expected webhook payload: { lead_id, old_status, new_status, lead_data }
    const { lead_id, old_status, new_status, lead_data } = body;

    if (!lead_id || !new_status) {
      return Response.json({ 
        error: 'Missing required fields: lead_id, new_status' 
      }, { status: 400 });
    }

    const actions = [];

    // AUTOMATION 1: When lead is marked as 'contacted', schedule follow-up in 3 days
    if (new_status === 'contacted') {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + 3);

      await base44.asServiceRole.functions.invoke('secureEntityQuery', {
        entity_name: 'TaskReminder',
        operation: 'create',
        data: {
          task_description: `Follow-up com ${lead_data.full_name} - ${lead_data.company || 'Lead'}`,
          related_entity: 'StakeholderLead',
          related_entity_id: lead_id,
          scheduled_for: followUpDate.toISOString(),
          status: 'pending',
          priority: 'medium',
          assigned_to: lead_data.created_by
        }
      });

      actions.push({
        type: 'task_reminder_created',
        scheduled_for: followUpDate.toISOString()
      });
    }

    // AUTOMATION 2: When lead moves to 'qualified', send welcome email
    if (new_status === 'qualified') {
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'CAIO Vision Venture Studio',
        to: lead_data.email,
        subject: '🎉 Bem-vindo ao processo de qualificação - CAIO Vision',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #C7A763;">Olá, ${lead_data.full_name}!</h2>
            
            <p>Ficamos muito felizes em tê-lo(a) como parte do nosso pipeline de qualificação na CAIO Vision Venture Studio.</p>
            
            <p>Nossa equipe analisou seu perfil e acreditamos que há um grande potencial de colaboração entre nós.</p>
            
            <h3 style="color: #00D4FF;">Próximos Passos:</h3>
            <ol>
              <li>Gostaríamos de agendar uma reunião inicial para conhecê-lo(a) melhor</li>
              <li>Discutir oportunidades de parceria/investimento</li>
              <li>Apresentar nosso portfólio de ventures</li>
            </ol>
            
            <div style="background-color: #0a1628; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #fff; margin: 0;">📅 <strong>Agende uma reunião conosco:</strong></p>
              <p style="color: #C7A763; margin: 10px 0 0 0;">Responda este email com sua disponibilidade ou acesse nosso calendário em: <a href="https://calendly.com/caiovision" style="color: #00D4FF;">calendly.com/caiovision</a></p>
            </div>
            
            <p>Estamos ansiosos para conversar!</p>
            
            <p style="margin-top: 30px;">
              <strong>Atenciosamente,</strong><br/>
              Equipe CAIO Vision Venture Studio
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;"/>
            <p style="color: #666; font-size: 12px;">
              Este email foi enviado automaticamente pelo nosso sistema CRM. Se você recebeu este email por engano, por favor ignore.
            </p>
          </div>
        `
      });

      // Also send notification to the lead owner
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'CAIO Vision CRM',
        to: lead_data.created_by,
        subject: `✅ Email de boas-vindas enviado para ${lead_data.full_name}`,
        body: `
          <h3>Lead Qualificado - Email Enviado</h3>
          <p>O lead <strong>${lead_data.full_name}</strong> foi movido para o estágio "Qualified" e recebeu automaticamente um email de boas-vindas com link para agendamento de reunião.</p>
          
          <h4>Detalhes do Lead:</h4>
          <ul>
            <li>Nome: ${lead_data.full_name}</li>
            <li>Email: ${lead_data.email}</li>
            <li>Empresa: ${lead_data.company || 'N/A'}</li>
            <li>Tipo: ${lead_data.type}</li>
          </ul>
          
          <p><strong>Próxima ação:</strong> Aguarde resposta do lead para agendar a reunião inicial.</p>
        `
      });

      actions.push({
        type: 'welcome_email_sent',
        sent_to: lead_data.email
      });
    }

    // AUTOMATION 3: When lead moves to 'pitched', schedule follow-up in 5 days
    if (new_status === 'pitched') {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + 5);

      await base44.asServiceRole.functions.invoke('secureEntityQuery', {
        entity_name: 'TaskReminder',
        operation: 'create',
        data: {
          task_description: `Follow-up pós-pitch com ${lead_data.full_name}`,
          related_entity: 'StakeholderLead',
          related_entity_id: lead_id,
          scheduled_for: followUpDate.toISOString(),
          status: 'pending',
          priority: 'high',
          assigned_to: lead_data.created_by
        }
      });

      actions.push({
        type: 'post_pitch_reminder_created',
        scheduled_for: followUpDate.toISOString()
      });
    }

    return Response.json({
      status: 'success',
      lead_id,
      status_change: `${old_status} -> ${new_status}`,
      automations_executed: actions
    });
  } catch (error) {
    return Response.json({ 
      status: 'error',
      error: error.message 
    }, { status: 500 });
  }
});