import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Validate admin or service role
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_email, type, title, message, action_url, metadata } = await req.json();

    if (!user_email || !type || !title || !message) {
      return Response.json({ 
        error: 'Missing required fields: user_email, type, title, message' 
      }, { status: 400 });
    }

    const notification = await base44.asServiceRole.entities.Notification.create({
      user_email,
      type,
      title,
      message,
      action_url,
      metadata,
      read: false
    });

    return Response.json({ 
      success: true, 
      notification 
    });
  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});