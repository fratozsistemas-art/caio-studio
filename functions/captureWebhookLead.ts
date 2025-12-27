import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Parse incoming webhook data
    const data = await req.json();
    
    // Validate webhook (optional: add signature verification)
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
    const signature = req.headers.get('x-webhook-signature');
    
    if (webhookSecret && signature !== webhookSecret) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Extract lead data from webhook payload
    // Adjust these fields based on your form provider
    const leadData = {
      full_name: data.name || data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
      email: data.email,
      phone: data.phone || data.telephone,
      company: data.company || data.organization,
      stakeholder_type: data.type || 'founder',
      notes: data.message || data.notes || data.comments || '',
      status: 'new',
      qualification_answers: data.custom_fields || {}
    };

    // Validate required fields
    if (!leadData.full_name || !leadData.email) {
      return Response.json({ 
        error: 'Missing required fields: name and email' 
      }, { status: 400 });
    }

    // Create lead using service role
    const lead = await base44.asServiceRole.entities.StakeholderLead.create(leadData);

    // Optional: Send notification email to admins
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: Deno.env.get('ADMIN_EMAIL') || 'admin@example.com',
        subject: `Novo Lead: ${leadData.full_name}`,
        from_name: 'CAIO Vision CRM',
        body: `
          <h2>Novo Lead Capturado</h2>
          <p><strong>Nome:</strong> ${leadData.full_name}</p>
          <p><strong>Email:</strong> ${leadData.email}</p>
          <p><strong>Empresa:</strong> ${leadData.company || 'N/A'}</p>
          <p><strong>Telefone:</strong> ${leadData.phone || 'N/A'}</p>
          <p><strong>Tipo:</strong> ${leadData.stakeholder_type}</p>
          ${leadData.notes ? `<p><strong>Mensagem:</strong><br>${leadData.notes}</p>` : ''}
          <p><a href="${Deno.env.get('APP_URL')}/lead-management">Ver no CRM</a></p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // Don't fail the whole request if email fails
    }

    return Response.json({ 
      success: true,
      lead_id: lead.id,
      message: 'Lead created successfully'
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ 
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
});