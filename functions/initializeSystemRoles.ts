import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Initialize System Roles
 * Creates the default RBAC roles: Admin, Manager, Team Member, Viewer
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const systemRoles = [
      {
        name: "Admin",
        description: "Full system access with all permissions",
        is_system_role: true,
        priority: 100,
        permissions: {
          ventures: {
            view: true,
            create: true,
            edit: true,
            delete: true,
            view_financials: true,
            edit_financials: true
          },
          tasks: {
            view: true,
            create: true,
            edit: true,
            delete: true,
            assign: true
          },
          documents: {
            view: true,
            upload: true,
            edit: true,
            delete: true
          },
          collaboration: {
            view_channels: true,
            create_channels: true,
            post_messages: true,
            manage_squads: true
          },
          analytics: {
            view_dashboard: true,
            generate_ai_insights: true,
            export_reports: true
          },
          admin: {
            manage_users: true,
            manage_roles: true,
            system_settings: true
          }
        },
        field_permissions: {
          Venture: {
            viewable_fields: ["*"],
            editable_fields: ["*"]
          },
          VentureTask: {
            viewable_fields: ["*"],
            editable_fields: ["*"]
          }
        }
      },
      {
        name: "Manager",
        description: "Can manage ventures, tasks, and team members",
        is_system_role: true,
        priority: 75,
        permissions: {
          ventures: {
            view: true,
            create: true,
            edit: true,
            delete: false,
            view_financials: true,
            edit_financials: false
          },
          tasks: {
            view: true,
            create: true,
            edit: true,
            delete: true,
            assign: true
          },
          documents: {
            view: true,
            upload: true,
            edit: true,
            delete: true
          },
          collaboration: {
            view_channels: true,
            create_channels: true,
            post_messages: true,
            manage_squads: true
          },
          analytics: {
            view_dashboard: true,
            generate_ai_insights: true,
            export_reports: true
          },
          admin: {
            manage_users: false,
            manage_roles: false,
            system_settings: false
          }
        },
        field_permissions: {
          Venture: {
            viewable_fields: ["*"],
            editable_fields: [
              "name",
              "description",
              "status",
              "category",
              "tags",
              "website",
              "team_size",
              "roadmap"
            ]
          },
          VentureTask: {
            viewable_fields: ["*"],
            editable_fields: ["*"]
          }
        }
      },
      {
        name: "Team Member",
        description: "Can view ventures and manage assigned tasks",
        is_system_role: true,
        priority: 50,
        permissions: {
          ventures: {
            view: true,
            create: false,
            edit: false,
            delete: false,
            view_financials: false,
            edit_financials: false
          },
          tasks: {
            view: true,
            create: true,
            edit: true,
            delete: false,
            assign: false
          },
          documents: {
            view: true,
            upload: true,
            edit: false,
            delete: false
          },
          collaboration: {
            view_channels: true,
            create_channels: false,
            post_messages: true,
            manage_squads: false
          },
          analytics: {
            view_dashboard: true,
            generate_ai_insights: false,
            export_reports: false
          },
          admin: {
            manage_users: false,
            manage_roles: false,
            system_settings: false
          }
        },
        field_permissions: {
          Venture: {
            viewable_fields: [
              "name",
              "description",
              "status",
              "category",
              "tags",
              "website",
              "roadmap"
            ],
            editable_fields: []
          },
          VentureTask: {
            viewable_fields: ["*"],
            editable_fields: [
              "status",
              "description",
              "due_date"
            ]
          }
        }
      },
      {
        name: "Viewer",
        description: "Read-only access to ventures and tasks",
        is_system_role: true,
        priority: 25,
        permissions: {
          ventures: {
            view: true,
            create: false,
            edit: false,
            delete: false,
            view_financials: false,
            edit_financials: false
          },
          tasks: {
            view: true,
            create: false,
            edit: false,
            delete: false,
            assign: false
          },
          documents: {
            view: true,
            upload: false,
            edit: false,
            delete: false
          },
          collaboration: {
            view_channels: true,
            create_channels: false,
            post_messages: false,
            manage_squads: false
          },
          analytics: {
            view_dashboard: true,
            generate_ai_insights: false,
            export_reports: false
          },
          admin: {
            manage_users: false,
            manage_roles: false,
            system_settings: false
          }
        },
        field_permissions: {
          Venture: {
            viewable_fields: [
              "name",
              "description",
              "status",
              "category",
              "tags",
              "website"
            ],
            editable_fields: []
          },
          VentureTask: {
            viewable_fields: [
              "title",
              "description",
              "status",
              "priority",
              "due_date"
            ],
            editable_fields: []
          }
        }
      }
    ];

    const created = [];
    const errors = [];

    for (const role of systemRoles) {
      try {
        // Check if role already exists
        const existing = await base44.asServiceRole.entities.UserRole.filter({
          name: role.name,
          is_system_role: true
        });

        if (existing && existing.length > 0) {
          created.push({ ...role, status: 'already_exists', id: existing[0].id });
        } else {
          const newRole = await base44.asServiceRole.entities.UserRole.create(role);
          created.push({ ...role, status: 'created', id: newRole.id });
        }
      } catch (error) {
        errors.push({ role: role.name, error: error.message });
      }
    }

    return Response.json({
      success: true,
      message: 'System roles initialized',
      created,
      errors: errors.length > 0 ? errors : null
    });

  } catch (error) {
    return Response.json({ 
      error: 'Failed to initialize roles',
      message: error.message 
    }, { status: 500 });
  }
});