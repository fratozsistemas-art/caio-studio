import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        error: 'Unauthorized: Admin access required' 
      }, { status: 403 });
    }

    const { action, repoUrl, filePath, commitMessage, fileContent, branch = 'main' } = await req.json();

    if (!action) {
      return Response.json({ error: 'action parameter required' }, { status: 400 });
    }

    const githubToken = Deno.env.get('GITHUB_TOKEN');
    if (!githubToken) {
      return Response.json({ 
        error: 'GITHUB_TOKEN not configured' 
      }, { status: 500 });
    }

    // Extract owner and repo from URL
    const match = repoUrl?.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
    if (!match && (action === 'read' || action === 'push')) {
      return Response.json({ error: 'Invalid GitHub URL' }, { status: 400 });
    }
    const [, owner, repo] = match || [];

    switch (action) {
      case 'read': {
        // Read file from GitHub repo
        if (!filePath) {
          return Response.json({ error: 'filePath required for read action' }, { status: 400 });
        }

        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Base44-Code-Auditor'
          }
        });

        if (!response.ok) {
          return Response.json({ 
            error: `GitHub API error: ${response.statusText}` 
          }, { status: response.status });
        }

        const data = await response.json();
        const content = atob(data.content); // Decode base64

        return Response.json({
          filePath,
          content,
          size: data.size,
          sha: data.sha,
          url: data.html_url
        });
      }

      case 'list': {
        // List files in repo directory
        const dirPath = filePath || '';
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}?ref=${branch}`;
        
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Base44-Code-Auditor'
          }
        });

        if (!response.ok) {
          return Response.json({ 
            error: `GitHub API error: ${response.statusText}` 
          }, { status: response.status });
        }

        const files = await response.json();
        return Response.json({
          files: files.map(f => ({
            name: f.name,
            path: f.path,
            type: f.type,
            size: f.size,
            url: f.html_url
          }))
        });
      }

      case 'push': {
        // Create or update file in GitHub repo
        if (!filePath || !fileContent || !commitMessage) {
          return Response.json({ 
            error: 'filePath, fileContent, and commitMessage required for push action' 
          }, { status: 400 });
        }

        // Get current file SHA (if exists) for update
        let sha;
        try {
          const checkUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
          const checkResponse = await fetch(checkUrl, {
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'Base44-Code-Auditor'
            }
          });
          if (checkResponse.ok) {
            const existingFile = await checkResponse.json();
            sha = existingFile.sha;
          }
        } catch (e) {
          // File doesn't exist, will create new
        }

        // Create or update file
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
        const response = await fetch(apiUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'Base44-Code-Auditor'
          },
          body: JSON.stringify({
            message: commitMessage,
            content: btoa(fileContent), // Encode to base64
            branch: branch,
            ...(sha && { sha })
          })
        });

        if (!response.ok) {
          const error = await response.text();
          return Response.json({ 
            error: `GitHub API error: ${error}` 
          }, { status: response.status });
        }

        const result = await response.json();
        return Response.json({
          success: true,
          commit: result.commit,
          content: result.content
        });
      }

      default:
        return Response.json({ 
          error: 'Invalid action. Use: read, list, or push' 
        }, { status: 400 });
    }

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});