import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify authentication
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, asset_id, file_url, text_content, change_notes } = await req.json();

        if (!action || !asset_id) {
            return Response.json({ 
                error: 'Missing required parameters: action and asset_id' 
            }, { status: 400 });
        }

        // Get the asset
        const asset = await base44.asServiceRole.entities.ContentAsset.get(asset_id);
        
        // Verify ownership
        if (asset.created_by !== user.email) {
            return Response.json({ error: 'Access denied' }, { status: 403 });
        }

        switch (action) {
            case 'create_version': {
                if (!file_url && !text_content) {
                    return Response.json({ 
                        error: 'file_url or text_content required for new version' 
                    }, { status: 400 });
                }

                // Save current version to history
                const currentVersion = await base44.asServiceRole.entities.ContentAssetVersion.create({
                    asset_id: asset.id,
                    version_number: asset.current_version || 1,
                    file_url: asset.file_url,
                    text_content: asset.text_content,
                    change_notes: 'Previous version archived',
                    created_by: user.email
                });

                // Update asset with new version
                const newVersionNumber = (asset.version_count || 1) + 1;
                const updatedAsset = await base44.asServiceRole.entities.ContentAsset.update(asset.id, {
                    file_url: file_url || asset.file_url,
                    text_content: text_content || asset.text_content,
                    current_version: newVersionNumber,
                    version_count: newVersionNumber
                });

                // Create version record for new version
                await base44.asServiceRole.entities.ContentAssetVersion.create({
                    asset_id: asset.id,
                    version_number: newVersionNumber,
                    file_url: file_url || asset.file_url,
                    text_content: text_content || asset.text_content,
                    change_notes: change_notes || 'New version uploaded',
                    created_by: user.email
                });

                return Response.json({ 
                    success: true, 
                    data: updatedAsset,
                    message: `Version ${newVersionNumber} created successfully`
                });
            }

            case 'list_versions': {
                const versions = await base44.asServiceRole.entities.ContentAssetVersion.filter(
                    { asset_id: asset_id },
                    '-version_number'
                );

                return Response.json({ 
                    success: true, 
                    data: versions
                });
            }

            case 'revert_to_version': {
                const { version_number } = await req.json();
                
                if (!version_number) {
                    return Response.json({ 
                        error: 'version_number required' 
                    }, { status: 400 });
                }

                // Get the version to revert to
                const versions = await base44.asServiceRole.entities.ContentAssetVersion.filter({
                    asset_id: asset_id,
                    version_number: version_number
                });

                if (versions.length === 0) {
                    return Response.json({ 
                        error: 'Version not found' 
                    }, { status: 404 });
                }

                const targetVersion = versions[0];

                // Save current as version before reverting
                await base44.asServiceRole.entities.ContentAssetVersion.create({
                    asset_id: asset.id,
                    version_number: asset.current_version,
                    file_url: asset.file_url,
                    text_content: asset.text_content,
                    change_notes: `Backup before reverting to v${version_number}`,
                    created_by: user.email
                });

                // Update asset to target version
                const newVersionNumber = (asset.version_count || 1) + 1;
                const updatedAsset = await base44.asServiceRole.entities.ContentAsset.update(asset.id, {
                    file_url: targetVersion.file_url,
                    text_content: targetVersion.text_content,
                    current_version: newVersionNumber,
                    version_count: newVersionNumber
                });

                // Create version record
                await base44.asServiceRole.entities.ContentAssetVersion.create({
                    asset_id: asset.id,
                    version_number: newVersionNumber,
                    file_url: targetVersion.file_url,
                    text_content: targetVersion.text_content,
                    change_notes: `Reverted to version ${version_number}`,
                    created_by: user.email
                });

                return Response.json({ 
                    success: true, 
                    data: updatedAsset,
                    message: `Reverted to version ${version_number}`
                });
            }

            default:
                return Response.json({ 
                    error: `Action "${action}" not supported` 
                }, { status: 400 });
        }

    } catch (error) {
        console.error('manageAssetVersion error:', error);
        return Response.json({ 
            error: error.message || 'Internal server error',
            details: error.toString()
        }, { status: 500 });
    }
});