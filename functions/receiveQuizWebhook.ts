import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Parse webhook payload
    const payload = await req.json();
    
    const { talent_id, email, score, results } = payload;

    if (!talent_id && !email) {
      return Response.json({ 
        error: 'Missing talent_id or email' 
      }, { status: 400 });
    }

    // Find talent by id or email
    let query = {};
    if (talent_id) {
      query.id = talent_id;
    } else if (email) {
      query.email = email;
    }

    const talents = await base44.asServiceRole.entities.Talent.filter(query);
    
    if (!talents || talents.length === 0) {
      return Response.json({ 
        error: 'Talent not found' 
      }, { status: 404 });
    }

    const talent = talents[0];

    // Update talent with quiz results
    await base44.asServiceRole.entities.Talent.update(talent.id, {
      quiz_completed: true,
      quiz_score: score,
      quiz_results: results,
      quiz_completed_at: new Date().toISOString()
    });

    // Create notification
    await base44.asServiceRole.entities.Notification.create({
      user_email: talent.email,
      type: 'milestone_reached',
      title: '✅ Quiz Concluído',
      message: `Você completou o quiz de avaliação com pontuação: ${score}/100`,
      action_url: '/AdminHub'
    });

    return Response.json({ 
      success: true,
      message: 'Quiz results updated successfully' 
    });
  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});