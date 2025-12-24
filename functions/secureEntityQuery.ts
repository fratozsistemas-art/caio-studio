import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify authentication
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse request body
        const { entity_name, operation, query = {}, data = {}, sort, limit } = await req.json();

        if (!entity_name || !operation) {
            return Response.json({ 
                error: 'Missing required parameters: entity_name and operation' 
            }, { status: 400 });
        }

        // Map of entities that require user-scoped filtering
        // Key: entity name, Value: field name to filter by user
        const securityRules = {
            'ContentAsset': 'created_by',
            'ContentAssetVersion': 'created_by',
            'UserProfile': 'user_id',
            'Purchase': 'user_id',
            'Order': 'user_id',
            // Add more entities as needed
        };

        // Check if this entity requires security filtering
        const securityField = securityRules[entity_name];
        
        // Build secure query by injecting user filter
        let secureQuery = { ...query };
        if (securityField) {
            // For operations that read data, inject user filter
            if (['list', 'filter', 'get'].includes(operation)) {
                secureQuery[securityField] = user.email;
            }
        }

        // Execute operation using service role
        const entityAPI = base44.asServiceRole.entities[entity_name];
        
        if (!entityAPI) {
            return Response.json({ 
                error: `Entity "${entity_name}" not found` 
            }, { status: 404 });
        }

        let result;

        switch (operation) {
            case 'list':
                result = await entityAPI.list(sort, limit);
                // Filter results by user if security field exists
                if (securityField) {
                    result = result.filter(item => item[securityField] === user.email);
                }
                break;

            case 'filter':
                result = await entityAPI.filter(secureQuery, sort, limit);
                break;

            case 'get':
                if (!query.id) {
                    return Response.json({ error: 'Missing id for get operation' }, { status: 400 });
                }
                const item = await entityAPI.get(query.id);
                // Verify ownership if security field exists
                if (securityField && item[securityField] !== user.email) {
                    return Response.json({ error: 'Access denied' }, { status: 403 });
                }
                result = item;
                break;

            case 'create':
                // Inject user ownership for create operations
                const createData = { ...data };
                if (securityField) {
                    createData[securityField] = user.email;
                }
                result = await entityAPI.create(createData);
                break;

            case 'update':
                if (!data.id && !query.id) {
                    return Response.json({ error: 'Missing id for update operation' }, { status: 400 });
                }
                const updateId = data.id || query.id;
                
                // Verify ownership before update
                if (securityField) {
                    const existingItem = await entityAPI.get(updateId);
                    if (existingItem[securityField] !== user.email) {
                        return Response.json({ error: 'Access denied' }, { status: 403 });
                    }
                }
                
                const updateData = { ...data };
                delete updateData.id;
                result = await entityAPI.update(updateId, updateData);
                break;

            case 'delete':
                if (!query.id) {
                    return Response.json({ error: 'Missing id for delete operation' }, { status: 400 });
                }
                
                // Verify ownership before delete
                if (securityField) {
                    const existingItem = await entityAPI.get(query.id);
                    if (existingItem[securityField] !== user.email) {
                        return Response.json({ error: 'Access denied' }, { status: 403 });
                    }
                }
                
                result = await entityAPI.delete(query.id);
                break;

            case 'bulkCreate':
                if (!Array.isArray(data.items)) {
                    return Response.json({ error: 'bulkCreate requires items array in data' }, { status: 400 });
                }
                // Inject user ownership for all items
                const bulkData = data.items.map(item => {
                    if (securityField) {
                        return { ...item, [securityField]: user.email };
                    }
                    return item;
                });
                result = await entityAPI.bulkCreate(bulkData);
                break;

            default:
                return Response.json({ 
                    error: `Operation "${operation}" not supported` 
                }, { status: 400 });
        }

        return Response.json({ 
            success: true, 
            data: result,
            user_id: user.email
        });

    } catch (error) {
        console.error('secureEntityQuery error:', error);
        return Response.json({ 
            error: error.message || 'Internal server error',
            details: error.toString()
        }, { status: 500 });
    }
});