import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user authentication
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get LinkedIn access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('linkedin');
    
    if (!accessToken) {
      return Response.json({ 
        error: 'LinkedIn not connected. Please authorize LinkedIn access.' 
      }, { status: 403 });
    }

    // Fetch LinkedIn profile
    const response = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`LinkedIn API error: ${response.status}`);
    }

    const profileData = await response.json();

    return Response.json(profileData);
  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});