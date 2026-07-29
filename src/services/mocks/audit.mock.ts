export interface AuditRow {
  id: string
  actor_name: string | null
  action: string
  entity_type: string
  entity_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

function daysAgo(days: number, hours = 9) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hours, 0, 0, 0)
  return d.toISOString()
}

export const auditRows: AuditRow[] = [
  {
    id: "audit_1",
    actor_name: "Admin Demo",
    action: "nutritionist_approved",
    entity_type: "nutritionist",
    entity_id: "nutri_2",
    metadata: {},
    created_at: daysAgo(0, 10),
  },
  {
    id: "audit_2",
    actor_name: "Admin Demo",
    action: "user_blocked",
    entity_type: "user",
    entity_id: "user_5",
    metadata: { notified: true },
    created_at: daysAgo(1, 15),
  },
  {
    id: "audit_3",
    actor_name: "Admin Demo",
    action: "plan_updated",
    entity_type: "plan",
    entity_id: "plan_pro",
    metadata: { field: "price_monthly" },
    created_at: daysAgo(2, 11),
  },
  {
    id: "audit_4",
    actor_name: "Admin Demo",
    action: "nutritionist_rejected",
    entity_type: "nutritionist",
    entity_id: "nutri_4",
    metadata: { reason: "Matrícula no verificable" },
    created_at: daysAgo(3, 17),
  },
  {
    id: "audit_5",
    actor_name: "Admin Demo",
    action: "role.grant",
    entity_type: "role",
    entity_id: "nutricionista",
    metadata: { permission: "recipes.publish" },
    created_at: daysAgo(5, 9),
  },
  {
    id: "audit_6",
    actor_name: "Sistema",
    action: "recipe_created",
    entity_type: "recipe",
    entity_id: "recipe_1",
    metadata: {},
    created_at: daysAgo(6, 8),
  },
]
