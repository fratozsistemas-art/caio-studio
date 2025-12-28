import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { decompress } from 'https://deno.land/x/zip@v1.2.5/mod.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        error: 'Unauthorized: Admin access required' 
      }, { status: 403 });
    }

    const { zipUrl, targetPath } = await req.json();

    if (!zipUrl) {
      return Response.json({ 
        error: 'zipUrl parameter is required' 
      }, { status: 400 });
    }

    // Create temporary directory
    const tempDir = await Deno.makeTempDir();
    const zipPath = `${tempDir}/upload.zip`;

    // Download zip file
    const zipResponse = await fetch(zipUrl);
    if (!zipResponse.ok) {
      return Response.json({ 
        error: 'Failed to download zip file' 
      }, { status: 400 });
    }

    const zipData = await zipResponse.arrayBuffer();
    await Deno.writeFile(zipPath, new Uint8Array(zipData));

    // Extract zip file
    const extractPath = `${tempDir}/extracted`;
    await decompress(zipPath, extractPath);

    // Read specific file if targetPath provided
    if (targetPath) {
      const fullPath = `${extractPath}/${targetPath}`;
      
      try {
        const content = await Deno.readTextFile(fullPath);
        
        // Cleanup
        await Deno.remove(tempDir, { recursive: true });

        return Response.json({
          filePath: targetPath,
          content,
          size: content.length,
          lines: content.split('\n').length
        });
      } catch (error) {
        // Cleanup
        await Deno.remove(tempDir, { recursive: true });
        
        return Response.json({ 
          error: `File not found in zip: ${targetPath}` 
        }, { status: 404 });
      }
    }

    // List all files in the zip
    const files = [];
    
    async function walkDir(dir, prefix = '') {
      for await (const entry of Deno.readDir(dir)) {
        const path = prefix ? `${prefix}/${entry.name}` : entry.name;
        
        if (entry.isDirectory) {
          await walkDir(`${dir}/${entry.name}`, path);
        } else {
          const stat = await Deno.stat(`${dir}/${entry.name}`);
          
          // Only include code files
          const allowedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.html'];
          if (allowedExtensions.some(ext => entry.name.endsWith(ext))) {
            files.push({
              path,
              size: stat.size,
              name: entry.name
            });
          }
        }
      }
    }

    await walkDir(extractPath);

    // Cleanup
    await Deno.remove(tempDir, { recursive: true });

    return Response.json({
      totalFiles: files.length,
      files: files.slice(0, 100), // Limit to first 100 files
      message: files.length > 100 ? 'Showing first 100 files. Use targetPath to read specific files.' : null
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});