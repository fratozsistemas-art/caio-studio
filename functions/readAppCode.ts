import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate and verify admin access
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        error: 'Unauthorized: Admin access required for code auditing' 
      }, { status: 403 });
    }

    const { filePath } = await req.json();

    if (!filePath) {
      return Response.json({ 
        error: 'filePath parameter is required' 
      }, { status: 400 });
    }

    // Security: Whitelist of allowed directories
    const allowedDirectories = [
      'entities/',
      'pages/',
      'components/',
      'functions/',
      'agents/',
      'Layout.js',
      'globals.css'
    ];

    // Security: Block path traversal attempts
    if (filePath.includes('..') || filePath.includes('~') || filePath.startsWith('/')) {
      return Response.json({ 
        error: 'Invalid file path: Path traversal detected' 
      }, { status: 400 });
    }

    // Security: Verify file is in allowed directory
    const isAllowed = allowedDirectories.some(dir => 
      filePath === dir || filePath.startsWith(dir)
    );

    if (!isAllowed) {
      return Response.json({ 
        error: `Access denied: Only files in ${allowedDirectories.join(', ')} are allowed` 
      }, { status: 403 });
    }

    // Security: Only allow specific file extensions
    const allowedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.css'];
    const hasAllowedExtension = allowedExtensions.some(ext => filePath.endsWith(ext));

    if (!hasAllowedExtension) {
      return Response.json({ 
        error: `Invalid file type: Only ${allowedExtensions.join(', ')} files are allowed` 
      }, { status: 400 });
    }

    // Read the file content
    let fileContent;
    try {
      fileContent = await Deno.readTextFile(filePath);
    } catch (error) {
      return Response.json({ 
        error: `File not found or cannot be read: ${error.message}` 
      }, { status: 404 });
    }

    return Response.json({ 
      filePath,
      content: fileContent,
      size: fileContent.length,
      lines: fileContent.split('\n').length
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});